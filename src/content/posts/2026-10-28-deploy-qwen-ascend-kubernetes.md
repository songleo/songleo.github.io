---
title: "在 kubernetes 和昇腾 npu 上部署 qwen3.8-27b"
description: "从镜像、模型和双卡配置出发，记录一次使用官方 vllm ascend 镜像部署 qwen3.8-27b 的过程，以及普通用户运行时的权限处理。"
pubDatetime: 2026-10-28T00:00:00+08:00
tags: ["kubernetes", "ai", "部署"]
draft: true
---

一台机器上有昇腾 npu，也有大模型文件，接下来怎样让其他程序通过接口向模型提问？

本文记录一次从准备镜像、挂载模型到调用接口的过程。我们使用两张 ascend 910B4-1、一个 qwen3.8-27b w8a8 模型和官方 vllm ascend 镜像，最终让非 root 用户在 kubernetes 容器里完成了推理。过程中还遇到了一个很像“缺少算子”的错误，最后发现普通用户的目录访问权限是值得重点检查的线索。

文章以**已经具备 kubernetes、昇腾驱动、设备插件和容器运行时的环境**为起点；不覆盖从裸机安装这些组件。文中名称、用户编号和存储位置是去敏后的示例，复制前请按自己的环境调整。未经实际验证的通用示例和本次实测结果会分别说明。

## 1 部署流程

模型文件通过只读卷交给 vllm ascend，kubernetes 为服务分配两张 npu。vllm 的作用见[入门文章](/posts/2026-10-28-vllm-introduction-and-deployment/)，多卡并行可参考 [tp 和 pp 介绍](/posts/2026-10-28-llm-tp-pp-vllm-ascend-explained/)。

启动后还要确认模型加载、设备分配和实际回答，而不只是 pod 运行。

## 2 准备好硬件、集群和存储

本次实践使用的条件如下：

| 项目 | 条件 |
| --- | --- |
| 节点 | arm64，昇腾 ascend 910B4-1，单卡约 64 GiB 显存 |
| npu | 两张可以分配的整卡 |
| kubernetes | 设备插件已登记 `huawei.com/Ascend910`，并有适用于该节点的 `RuntimeClass` |
| 运行环境 | 使用与驱动兼容的 ascend 容器运行时；本例的 `RuntimeClass` 名为 `ascend` |
| 资源 | 推理容器申请 16 个 cpu 和 64 GiB 内存；另需模型存储和启动缓存空间 |
| 模型 | 已准备 qwen3.8-27b w8a8 权重、配置和 tokenizer |

在管理端先核对：

```bash
kubectl get nodes -o wide
kubectl get runtimeclass ascend
NPU_NODE="填写自己的-npu-节点名"
kubectl describe node "$NPU_NODE"
```

节点描述中的 `Capacity` 和 `Allocatable` 说明 kubernetes 能识别多少资源，**不等于当前空闲卡数**。还要检查已运行工作负载的请求；如果设备还由其他调度系统使用，也应遵循现场已有的协调方式。设备接入过程可参考[昇腾 npu 如何接入 kubernetes](/posts/2026-10-23-ascend-npu-kubernetes/)。

本例要求节点能拉取镜像；离线或私有镜像仓库应先完成原版镜像同步与权限配置。一个 pod 要有权限使用模型 pvc，但不应因此把私有模型或仓库凭据公开给所有人。

## 3 选择官方镜像和模型

### 推理镜像

这次使用官方 a2 openeuler 版本 `v0.23.0.post1-openeuler`，示例固定官方 arm64 manifest 摘要：

```text
quay.io/ascend/vllm-ascend@sha256:11125f9a4bbaecbc05d10f4af0619841f5dd1990623f97e61450e23d832872d3
```

固定摘要比只写可变标签更容易确认“究竟使用了哪一份镜像”。可以查看[官方镜像仓库](https://quay.io/repository/ascend/vllm-ascend)和[官方安装文档](https://docs.vllm.ai/projects/ascend/en/v0.23.0/installation.html)，了解不同硬件和系统的镜像；官方[模型教程](https://docs.vllm.ai/projects/ascend/en/latest/tutorials/models/Qwen3.8-27B.html)还列出专用于 qwen 的 a2 镜像 `qwen3.8-a2`。后者是另一候选，本次没有对它做现场验证。

本次实践实际从内部镜像仓库使用了一份事先导入的镜像；它的配置摘要及 16 个未压缩层声明与上述官方版本一致。**我们没有重新读取全部大文件并逐层计算摘要**，因此这个比较不能表述为完整归档逐字节校验。导入、压缩或封装方式不同也可能让镜像 manifest 摘要不同。

下面的示例使用官方地址，不包含私有仓库地址。如果计算节点不能访问官方仓库，可使用经确认的镜像源；替换前应核对同一个 arm64 manifest 摘要。不要仅凭相同标签认定内容相同。

### 模型文件

[官方模型教程](https://docs.vllm.ai/projects/ascend/en/latest/tutorials/models/Qwen3.8-27B.html)给出了昇腾适配的 [qwen3.8-27b w8a8 模型](https://www.modelscope.cn/models/Eco-Tech/Qwen3.8-27B-w8a8)。`w8a8` 表示权重和激活采用相应的 8 位量化表示；`--quantization ascend` 是加载与昇腾实现匹配的量化模型，不会把任意模型自动量化。

一种准备方法是先在可访问共享存储的下载机器上安装 modelscope 工具，再下载模型。下面的目录只是示例，**它应是 nfs 服务端实际导出的模型目录**；运行前核对磁盘空间、网络、模型许可及目标目录权限：

```bash
python3 -m venv "$HOME/.venvs/modelscope"
. "$HOME/.venvs/modelscope/bin/activate"
python3 -m pip install modelscope

MODEL_DIR=/srv/nfs/qwen3.8-27b-w8a8
modelscope download --model Eco-Tech/Qwen3.8-27B-w8a8 --local_dir "$MODEL_DIR"
ls -lh "$MODEL_DIR"
```

下载前应在模型仓库确认所需版本；长期复现时用 modelscope 的 `--revision` 指定你核实过的 commit 或 tag，并保存完整文件清单和摘要。[modelscope 命令说明](https://github.com/modelscope/modelscope/blob/master/docs/source/command.md)介绍了这些选项。本文实践中的模型是已准备好的 w8a8 版本，**其上游仓库 revision 未核实**；上面的公开下载地址是官方教程推荐的候选，不能说下载到的每个文件必然与本次实践逐字节相同。

例如，可在下载完成后创建一份本地校验记录，便于以后发现文件变化：

```bash
cd "$MODEL_DIR"
find . -type f -print0 | sort -z | xargs -0 sha256sum > ../qwen3.8-27b-w8a8.sha256
```

这份摘要记录用于后续对比，**不能单独证明文件来自官方或内容正确**。模型目录应至少包含模型配置、量化配置、tokenizer 和完整权重分片；保证推理用户有读取权限。

## 4 让 pod 以普通用户运行

原版镜像中的一个自定义算子目录在本次检查中属于 root 组，权限为 `750`；推理进程如果使用一个不在该组的普通用户，可能无法读取算子库。另外，镜像的身份文件中不一定有该用户编号。

这次没有重建镜像，也没有修改宿主机账户或系统权限。清单使用两个短暂的 init container：

1. 第一个以普通用户运行，将镜像原有的 `/etc/passwd`、`/etc/group` 复制到 pod 的临时卷，补充当前用户和组；推理容器只读挂载副本。
2. 第二个也使用非 root uid，但其**主组临时设为 gid 0**，以 root 组权限读取镜像内的算子目录，将其复制到另一个 pod 临时卷；推理容器仍以普通 uid 和普通 gid 运行，并只读挂载副本。

这里的 gid 0 不等同于 root uid，但它确实允许这个初始化容器读取镜像内 root 组可读的内容。示例不启用特权模式、不允许提权、不挂宿主机目录，也不挂服务账户令牌；如果你的集群策略不允许 gid 0，应该由管理员评估受支持的非 root 镜像或其他授权方式，而不是擅自放宽集群策略。[init container](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) 和 [`emptyDir`](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) 的生命周期由 kubernetes 管理。

示例的 uid `10001`、gid `20001` 只是教学值，并不是某个现场用户。应按自己的身份映射统一调整 `runAsUser`、`runAsGroup`、`fsGroup`、`USER`、`LOGNAME` 及初始化命令中的 uid 检查。使用 nfs 或 csi 时，先核对存储驱动对 `fsGroup`、权限及所有权的行为，避免修改共享数据权限。

## 5 创建模型 pvc

下面使用已有 nfs 共享作为例子；如果已有能够从 npu 节点读取模型的 pvc，可以复用它并跳过静态 pv 创建。本例的 `REPLACE_WITH_NFS_SERVER` 是占位符，必须替换成自己的 nfs 服务端地址；示例路径必须指向**包含模型文件的目录本身**。不要把整个共享盘挂进容器。

先确认 `llm-demo`、pv 与 pvc 的名称没有被占用，创建独立命名空间，再把下面内容保存为 `qwen-storage.yaml`：

```bash
kubectl create namespace llm-demo
```

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: qwen-weights-pv
spec:
  capacity:
    storage: 100Gi
  volumeMode: Filesystem
  accessModes:
    - ReadOnlyMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: ""
  nfs:
    server: REPLACE_WITH_NFS_SERVER
    path: /srv/nfs/qwen3.8-27b-w8a8
    readOnly: true
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: qwen-weights
  namespace: llm-demo
spec:
  accessModes:
    - ReadOnlyMany
  resources:
    requests:
      storage: 100Gi
  storageClassName: ""
  volumeName: qwen-weights-pv
```

修改占位符后创建并检查：

```bash
kubectl create -f qwen-storage.yaml
kubectl get pv qwen-weights-pv
kubectl get pvc -n llm-demo qwen-weights
```

`Bound` 表示 pvc 已绑定，不证明容器能读取模型。nfs 的 `100Gi` 是这里的资源声明，不自动为目录分配或限制实际容量；请使用已有存储系统的容量和配额能力。`Retain` 用于保留底层数据，清理资源前仍应确认实际存储行为。

## 6 创建双卡推理服务

把下面清单保存为 `qwen-ascend.yaml`。它包含一个 deployment 和一个仅供集群内部访问的 service。示例基于实际成功清单去敏：公开镜像地址、命名空间、pvc、用户编号和节点选择条件都已替换；**这些通用替换没有在另一套集群独立实测**，需要按前面的准备条件复核。

`GLOO_SOCKET_IFNAME` 和 `HCCL_SOCKET_IFNAME` 示例均为 `eth0`，实际容器网络接口不同则需要调整。`runtimeClassName` 和设备资源名也应以集群中的实际配置为准。如果改用私有仓库，还需在自己的命名空间配置有权拉取镜像的 `imagePullSecrets`，不要把凭据写进文章或清单。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qwen-ascend
  namespace: llm-demo
  labels:
    app: qwen-ascend
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: qwen-ascend
  template:
    metadata:
      labels:
        app: qwen-ascend
    spec:
      automountServiceAccountToken: false
      nodeSelector:
        kubernetes.io/arch: arm64
      runtimeClassName: ascend
      securityContext:
        fsGroup: 20001
      containers:
      - image: quay.io/ascend/vllm-ascend@sha256:11125f9a4bbaecbc05d10f4af0619841f5dd1990623f97e61450e23d832872d3
        command:
        - vllm
        - serve
        - /models
        - --served-model-name
        - qwen3.8-27b
        - --host
        - 0.0.0.0
        - --port
        - '8000'
        - --tensor-parallel-size
        - '2'
        - --pipeline-parallel-size
        - '1'
        - --max-model-len
        - '8192'
        - --gpu-memory-utilization
        - '0.85'
        - --quantization
        - ascend
        - --max-num-seqs
        - '1'
        env:
        - name: ASCEND_CUSTOM_OPP_PATH
          value: /vllm-workspace/vllm-ascend/vllm_ascend/_cann_ops_custom/vendors/custom_transformer
        - name: PATH
          value: /usr/local/Ascend/cann-9.1.0/bin:/usr/local/Ascend/cann-9.1.0/tools/ccec_compiler/bin:/usr/local/Ascend/cann-9.1.0/tools/profiler/bin:/usr/local/Ascend/cann-9.1.0/tools/ascend_system_advisor/asys:/usr/local/Ascend/cann-9.1.0/tools/show_kernel_debug_data:/usr/local/Ascend/cann-9.1.0/tools/msobjdump:/usr/local/python3.12.13/bin:/usr/local/Ascend/nnal/atb/latest/atb/cxx_abi_1/bin:/usr/local/Ascend/ascend-toolkit/latest/bin:/usr/local/Ascend/ascend-toolkit/latest/compiler/ccec_compiler/bin:/usr/local/Ascend/ascend-toolkit/latest/tools/ccec_compiler/bin:/usr/local/python3.12.13/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        - name: XDG_CACHE_HOME
          value: /tmp/vllm-cache/xdg
        - name: ASCEND_HOME_PATH
          value: /usr/local/Ascend/cann-9.1.0
        - name: TORCHINDUCTOR_CACHE_DIR
          value: /tmp/vllm-cache/torchinductor
        - name: USER
          value: uid10001
        - name: VLLM_CACHE_ROOT
          value: /tmp/vllm-cache/vllm
        - name: HOME
          value: /tmp
        - name: LOGNAME
          value: uid10001
        - name: PYTHONPATH
          value: '/usr/local/Ascend/cann-9.1.0/python/site-packages:/usr/local/Ascend/cann-9.1.0/opp/built-in/op_impl/ai_core/tbe:/usr/local/Ascend/ascend-toolkit/latest/python/site-packages:/usr/local/Ascend/ascend-toolkit/latest/opp/built-in/op_impl/ai_core/tbe:'
        - name: ASCEND_OPP_PATH
          value: /usr/local/Ascend/cann-9.1.0/opp
        - name: GLOO_SOCKET_IFNAME
          value: eth0
        - name: HCCL_SOCKET_IFNAME
          value: eth0
        - name: HF_HOME
          value: /tmp/vllm-cache/huggingface
        - name: LD_LIBRARY_PATH
          value: '/vllm-workspace/vllm-ascend/vllm_ascend/_cann_ops_custom/vendors/custom_transformer/op_api/lib:/usr/local/Ascend/cann-9.1.0/lib64:/usr/local/Ascend/cann-9.1.0/lib64/plugin/opskernel:/usr/local/Ascend/cann-9.1.0/lib64/plugin/nnengine:/usr/local/Ascend/cann-9.1.0/opp/built-in/op_impl/ai_core/tbe/op_tiling/lib/linux/aarch64:/usr/local/Ascend/driver/lib64:/usr/local/Ascend/driver/lib64/common:/usr/local/Ascend/driver/lib64/driver:/usr/lib64:/usr/local/Ascend/driver/lib64:/usr/local/Ascend/driver/lib64/common:/usr/local/Ascend/driver/lib64/driver:/usr/local/Ascend/nnal/atb/latest/atb/cxx_abi_1/lib:/usr/local/Ascend/nnal/atb/latest/atb/cxx_abi_1/examples:/usr/local/Ascend/nnal/atb/latest/atb/cxx_abi_1/tests/atbopstest:/usr/local/Ascend/ascend-toolkit/latest/tools/aml/lib64:/usr/local/Ascend/ascend-toolkit/latest/tools/aml/lib64/plugin:/usr/local/Ascend/ascend-toolkit/latest/lib64:/usr/local/Ascend/ascend-toolkit/latest/lib64/plugin/opskernel:/usr/local/Ascend/ascend-toolkit/latest/lib64/plugin/nnengine:/usr/local/Ascend/ascend-toolkit/latest/opp/built-in/op_impl/ai_core/tbe/op_tiling:/usr/local/python3.12.13/lib:'
        resources:
          limits:
            cpu: '16'
            huawei.com/Ascend910: '2'
            memory: 64Gi
          requests:
            cpu: '16'
            huawei.com/Ascend910: '2'
            memory: 64Gi
        securityContext:
          allowPrivilegeEscalation: false
          runAsGroup: 20001
          runAsUser: 10001
          runAsNonRoot: true
        name: vllm
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 8000
        volumeMounts:
        - mountPath: /models
          name: mount-0
          readOnly: true
        - name: runtime-identity
          mountPath: /etc/passwd
          subPath: passwd
          readOnly: true
        - name: runtime-identity
          mountPath: /etc/group
          subPath: group
          readOnly: true
        - name: accessible-operators
          mountPath: /vllm-workspace/vllm-ascend/vllm_ascend/_cann_ops_custom/vendors
          readOnly: true
        startupProbe:
          httpGet:
            path: /health
            port: http
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 180
        readinessProbe:
          httpGet:
            path: /health
            port: http
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
      volumes:
      - name: mount-0
        persistentVolumeClaim:
          claimName: qwen-weights
      - name: runtime-identity
        emptyDir: {}
      - name: accessible-operators
        emptyDir:
          sizeLimit: 256Mi
      initContainers:
      - name: prepare-runtime-identity
        image: quay.io/ascend/vllm-ascend@sha256:11125f9a4bbaecbc05d10f4af0619841f5dd1990623f97e61450e23d832872d3
        imagePullPolicy: IfNotPresent
        command:
        - /bin/bash
        - -c
        - |
          set -eu
          uid="$(id -u)"
          gid="$(id -g)"
          user="uid${uid}"
          group="gid${gid}"
          umask 022
          cp /etc/passwd /identity/passwd
          cp /etc/group /identity/group
          if awk -F: -v u="$user" -v id="$uid" '$1==u && $3!=id {exit 1}' /identity/passwd; then :; else echo 'user name collision' >&2; exit 1; fi
          if ! awk -F: -v id="$uid" '$3==id {found=1} END {exit !found}' /identity/passwd; then
              printf '%s:x:%s:%s:K8s inference user:/tmp:/sbin/nologin\n' "$user" "$uid" "$gid" >> /identity/passwd
          fi
          if awk -F: -v g="$group" -v id="$gid" '$1==g && $3!=id {exit 1}' /identity/group; then :; else echo 'group name collision' >&2; exit 1; fi
          if ! awk -F: -v id="$gid" '$3==id {found=1} END {exit !found}' /identity/group; then
              printf '%s:x:%s:\n' "$group" "$gid" >> /identity/group
          fi
          echo "prepared temporary identity for uid=$uid gid=$gid"
        securityContext:
          runAsUser: 10001
          runAsGroup: 20001
          runAsNonRoot: true
          allowPrivilegeEscalation: false
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: '1'
            memory: 512Mi
        volumeMounts:
        - name: runtime-identity
          mountPath: /identity
      - name: copy-operators-for-user
        image: quay.io/ascend/vllm-ascend@sha256:11125f9a4bbaecbc05d10f4af0619841f5dd1990623f97e61450e23d832872d3
        imagePullPolicy: IfNotPresent
        command:
        - /bin/bash
        - -c
        - |
          set -eu
          src=/vllm-workspace/vllm-ascend/vllm_ascend/_cann_ops_custom/vendors
          test "$(id -u)" = 10001
          test "$(id -g)" = 0
          test -x "$src"
          test -r "$src/custom_transformer/op_api/lib/libcust_opapi.so"
          cp -R "$src"/. /operators/
          test -r /operators/custom_transformer/op_api/lib/libcust_opapi.so
          test -x /operators/custom_transformer/op_api/lib
          echo "operator files copied into Pod temporary volume"
        securityContext:
          runAsUser: 10001
          runAsGroup: 0
          runAsNonRoot: true
          allowPrivilegeEscalation: false
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: '1'
            memory: 512Mi
        volumeMounts:
        - name: accessible-operators
          mountPath: /operators
---
apiVersion: v1
kind: Service
metadata:
  name: qwen-ascend
  namespace: llm-demo
  labels:
    app: qwen-ascend
spec:
  type: ClusterIP
  selector:
    app: qwen-ascend
  ports:
  - name: http
    port: 8000
    targetPort: http
```

创建前先确认对象名和双卡资源未被其他人占用，再执行：

```bash
kubectl create --dry-run=server -f qwen-ascend.yaml
kubectl create -f qwen-ascend.yaml
kubectl get pods -n llm-demo -l app=qwen-ascend -o wide
kubectl get deployment,service -n llm-demo -l app=qwen-ascend
```

这里使用 `kubectl create`，同名对象存在时会报错，避免不经核对覆盖已有服务。首次启动要加载权重和编译计算图，可能需要几分钟。`Running` 只说明容器进程运行，应该继续等待 deployment `1/1` Ready，并查看日志：

```bash
kubectl logs -n llm-demo -l app=qwen-ascend -c prepare-runtime-identity
kubectl logs -n llm-demo -l app=qwen-ascend -c copy-operators-for-user
kubectl logs -n llm-demo -l app=qwen-ascend -c vllm --tail=100
kubectl describe pod -n llm-demo -l app=qwen-ascend
```

## 7 这些启动参数是什么意思

| 参数 | 本例值 | 作用 |
| --- | --- | --- |
| `--tensor-parallel-size` | `2` | 两张卡协作处理同一份模型中的计算 |
| `--pipeline-parallel-size` | `1` | 不把模型分成多个流水线阶段 |
| `--max-model-len` | `8192` | 单次请求输入和输出合计的 token 上限 |
| `--gpu-memory-utilization` | `0.85` | 推理引擎规划显存使用的目标比例 |
| `--quantization` | `ascend` | 使用与当前 w8a8 文件匹配的昇腾量化实现 |
| `--max-num-seqs` | `1` | 引擎一轮最多处理一条序列，其他请求可能排队 |
| `--served-model-name` | `qwen3.8-27b` | 客户端发送请求时使用的模型名 |

尽管参数名中写着 `gpu`，在这套适配中它用于控制推理设备的显存预算。`0.85` 不意味着实际占用一定恰好是 85%，也不是吞吐或并发能力的承诺。环境变量中的 cann、nnal 和算子路径来自本次镜像运行配置；指定 `command` 会覆盖镜像默认入口，不能只复制一行 `vllm serve` 而忽略环境初始化。

## 8 验证是否真的完成推理

先确认推理进程不是 root，以及设备分配和双卡加载情况：

```bash
kubectl exec -n llm-demo deployment/qwen-ascend -c vllm -- id
kubectl get pod -n llm-demo -l app=qwen-ascend -o wide
kubectl logs -n llm-demo -l app=qwen-ascend -c vllm --tail=500 | grep -E 'world_size=2|Worker_TP[01].*Loading model weights'
POD=$(kubectl get pod -n llm-demo -l app=qwen-ascend -o jsonpath='{.items[0].metadata.name}')
kubectl get pod -n llm-demo "$POD" -o jsonpath='{.metadata.annotations.huawei\.com/AscendReal}{"\n"}'
kubectl exec -n llm-demo "$POD" -c vllm -- sh -c \
  'readelf -Ws /vllm-workspace/vllm-ascend/vllm_ascend/_cann_ops_custom/vendors/custom_transformer/op_api/lib/libcust_opapi.so | grep aclnnAddRmsNormBias'
```

上面的注解是本次使用的设备插件提供的信息，其他插件版本可能不同。还应在 npu 节点运行 `npu-smi info`，查看设备状态、进程和显存变化；并结合 pod 的设备分配及两个 worker 的日志判断。不要只根据 yaml 中写了两张卡，就宣称模型真的使用了两张卡。

service 默认只在集群内部提供访问。在一台有 kubectl 权限的机器上开启本地转发：

```bash
kubectl port-forward -n llm-demo service/qwen-ascend 18000:8000
```

保持此终端运行，在**同一台机器的另一个终端**执行：

```bash
curl --noproxy '*' --fail --silent http://127.0.0.1:18000/health
curl --noproxy '*' --fail --silent http://127.0.0.1:18000/v1/models
curl --noproxy '*' --fail --silent http://127.0.0.1:18000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"qwen3.8-27b","messages":[{"role":"user","content":"What is 2 + 3? Answer with a single number."}],"temperature":0,"max_tokens":32,"chat_template_kwargs":{"enable_thinking":false}}'
```

`/health` 返回成功状态即可，响应体可能为空；`/v1/models` 应列出 `qwen3.8-27b`；聊天接口应在 `choices` 中返回模型生成的内容。本例不设置 api 密钥，**只用于受控的内部验证**；正式服务还应根据自己的访问策略配置认证、网络隔离和权限。

本次实际使用官方原版镜像、两张 npu 和普通用户完成了基础验证：健康检查和模型列表返回 http 200，三次短问答依次返回 `5`、`15`、`5`；两个推理 worker 的进程映射显示加载了自定义算子库。首次请求约 50 秒，后续两次约 0.5 秒。这些数字只是单次观察，不是性能报告。

## 9 普通用户和算子权限

本次原版镜像启动时，普通用户无法遍历自定义算子目录，出现类似算子缺失的错误；使用上面的临时卷后，两个 worker 加载了算子库并完成问答。相同报错也可能有其他原因，不能直接认定都是权限问题。身份解析、算子访问的排查过程及权限边界见[普通用户故障排查](/posts/2026-10-28-vllm-ascend-nonroot-troubleshooting/)。

这里使用 root 组读取算子的初始化步骤依赖集群策略，禁止该权限时需评估其他方案；不要直接修改宿主机权限或将推理进程改为 root。

## 10 清楚这次验证的边界

本次验证覆盖一个已准备的 w8a8 模型、一个普通用户身份、两张 npu 和三次简短问答。它没有覆盖所有用户的镜像和模型授权、长上下文、多并发、吞吐、长期稳定性或生产安全。日志中仍有文件属主和 cpu 亲和性告警，不能因为回答正确就当作告警已经解决。

如果要复现，先检查自己的驱动、设备、存储、身份和网络条件；如果要面向更多用户开放，还要单独完成授权和相应的业务验证。把每一层的结果记录清楚，下一次遇到问题时，才能知道故障发生在设备、镜像、模型还是服务接口。
