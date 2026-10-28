---
title: "在 kubernetes 上运行 qwen3-vl-8b：让模型理解图片与文字"
description: "结合昇腾单卡实践，介绍 qwen3-vl-8b 的 kubernetes 部署、图文请求和共享内存检查。"
pubDatetime: 2026-10-28T16:02:00+08:00
tags: ["kubernetes", "ai", "部署", "学习笔记"]
draft: true
---

普通文本模型可以回答文字问题。如果问题还包含一张图片，模型需要同时处理图片内容和用户的文字指令，例如“图片中有几个红色圆形？”

`Qwen3-VL-8B-Instruct` 是一个视觉语言模型，可以接收文字和图片并生成文字回答。本文结合昇腾单卡实践，介绍模型文件、推理服务和一个 kubernetes 部署示例，最后用文字和图片请求验证它是否真正工作。

先说明范围：本次完成了单卡启动以及集群内 Service 的基础文字、单图理解验证。下面的清单根据实践参数整理，**没有作为完整清单逐字验证**；镜像、存储、设备插件、共享内存与权限需按自己的集群调整。

## 1 模型、镜像和服务各做什么

| 组成 | 可以怎样理解 |
| --- | --- |
| 模型文件 | 已训练的权重、配置、处理器和分词器 |
| vllm | 加载模型并提供推理接口的服务程序 |
| vllm ascend | 适配昇腾设备的运行插件 |
| 驱动、cann 和设备插件 | 让容器能使用节点的 NPU |
| kubernetes 和 Service | 调度服务，并提供集群内访问入口 |

模型支持图文理解；具体能处理多大图片、多少张图或多长视频，仍取决于运行配置和硬件。[模型卡](https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct)介绍了模型能力；模型原生能力不能直接等同于某个部署已经完成的验收。

## 2 实践条件和镜像选择

本次实践使用 ARM64 节点和1张昇腾 910B 系列 64 GiB 卡，为容器配置了 8 CPU、64 GiB 内存；运行环境为 vllm 0.23.0 与 vllm ascend 0.23.0.post1 相关组合。CPU 和内存是这次采用的配置，不是官方最低要求。

实际镜像做过普通用户身份适配，不能与未修改的官方原版混为一谈。[昇腾 A2/A3 部署指南](https://docs.vllm.ai/projects/ascend/en/v0.23.0/tutorials/models/Qwen-VL-Dense.html)提供单卡运行该模型的示例及官方镜像参考。运行前要核对 CPU 架构、芯片系列、驱动、cann、容器运行时和镜像版本，并尽量固定镜像摘要。

无论选择哪个镜像，都要确认运行身份可以读取模型，也能写入日志和缓存目录。不要为了启动服务而直接修改宿主机目录权限。

## 3 部署前准备

先确认目标节点和设备插件状态：

```bash
kubectl get nodes -o wide
kubectl get runtimeclass
NODE_NAME=your-npu-node
kubectl describe node "$NODE_NAME"
```

节点中的资源名称、runtimeclass、可分配卡数和调度策略以实际集群为准。`huawei.com/Ascend910` 只是在后面示例中使用的设备资源名。

从 [ModelScope](https://modelscope.cn/models/Qwen/Qwen3-VL-8B-Instruct) 或 [Hugging Face](https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct) 获取完整模型目录，包括全部权重分片、索引、配置、图像处理器和分词器。记录来源版本并校验文件，然后放在集群可读取的存储上。下方假设已有 `qwen3-vl-model-pvc`，其根目录直接包含这些模型文件。

例如，已有 `hf` 工具时，可使用下列命令下载指定版本。先替换版本占位符，再按集群存储流程将准备目录放入 PVC；参数用法见 [hugging face 命令行文档](https://huggingface.co/docs/huggingface_hub/en/guides/cli)。

```bash
MODEL_REVISION=your-model-revision
hf download Qwen/Qwen3-VL-8B-Instruct \
  --revision "$MODEL_REVISION" \
  --local-dir ./qwen3-vl-8b-instruct
```

本次核对了权重分片数量、大小及部分配置摘要，但没有逐片计算完整权重摘要；这些检查不能证明全部权重字节均已核验。模型目录读取权限和实际挂载内容也需要在自己的集群中核对。

## 4 先理解关键启动参数

实际服务使用1张卡、BF16 精度、TP1 和 DP1。模型目录挂载到 `/models` 时，核心参数可写成：

```bash
vllm serve /models \
  --host 0.0.0.0 --port 8000 \
  --dtype bfloat16 \
  --served-model-name Qwen/Qwen3-VL-8B-Instruct \
  --no-enable-prefix-caching \
  --data-parallel-size 1 --tensor-parallel-size 1 \
  --trust-remote-code \
  --max-num-seqs 128 --max-model-len 32768 \
  --max-num-batched-tokens 16384 \
  --gpu-memory-utilization 0.91 --async-scheduling \
  --compilation-config '{"cudagraph_mode":"FULL_DECODE_ONLY","cudagraph_capture_sizes":[1,2,4,8,16,32]}' \
  --mm-processor-cache-gb 0 \
  --additional-config '{"enable_cpu_binding":false}'
```

这些参数参考官方 A2/A3 示例；本次使用本地模型目录、现场身份兼容镜像，并关闭 CPU 自动绑定，避免运行时自动调整宿主机相关设置。`--trust-remote-code` 可能执行模型目录中的代码，使用前要审核来源及具体版本。

`--max-model-len 32768` 是本服务的配置上限，图片生成的 token、文字输入和输出都要占用预算。`--max-num-seqs 128` 是启动配置，**不是已验证128并发的承诺**；`--max-num-batched-tokens` 控制批处理预算，不等于单次请求的上下文上限。显存比例0.91也不代表所有输入尺寸都不会溢出。

## 5 一个 kubernetes 部署示例

示例需要将 `REPLACE_WITH_VALIDATED_ARM64_IMAGE` 替换为已在目标环境核实的镜像和摘要，并替换 PVC、运行时及设备资源名称。模型 PVC 根目录应直接包含完整模型文件。镜像运行用户必须能读取模型并写入 `/tmp`。将调整后的内容保存为 `qwen3-vl8b.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qwen3-vl8b
spec:
  replicas: 1
  strategy:
    type: Recreate
  progressDeadlineSeconds: 1200
  selector:
    matchLabels:
      app: qwen3-vl8b
  template:
    metadata:
      labels:
        app: qwen3-vl8b
    spec:
      runtimeClassName: ascend
      containers:
        - name: vl
          image: REPLACE_WITH_VALIDATED_ARM64_IMAGE
          command: ["vllm", "serve"]
          args:
            - /models
            - --host
            - 0.0.0.0
            - --port
            - "8000"
            - --dtype
            - bfloat16
            - --served-model-name
            - Qwen/Qwen3-VL-8B-Instruct
            - --no-enable-prefix-caching
            - --data-parallel-size
            - "1"
            - --tensor-parallel-size
            - "1"
            - --trust-remote-code
            - --max-num-seqs
            - "128"
            - --max-model-len
            - "32768"
            - --max-num-batched-tokens
            - "16384"
            - --gpu-memory-utilization
            - "0.91"
            - --async-scheduling
            - --compilation-config
            - '{"cudagraph_mode":"FULL_DECODE_ONLY","cudagraph_capture_sizes":[1,2,4,8,16,32]}'
            - --mm-processor-cache-gb
            - "0"
            - --additional-config
            - '{"enable_cpu_binding":false}'
          env:
            - {name: HOME, value: /tmp}
            - {name: XDG_CACHE_HOME, value: /tmp/.cache}
            - {name: XDG_CONFIG_HOME, value: /tmp/.config}
            - {name: HF_HOME, value: /tmp/huggingface}
            - {name: HCCL_OP_EXPANSION_MODE, value: AIV}
            - {name: PYTORCH_NPU_ALLOC_CONF, value: "expandable_segments:True"}
            - {name: OMP_PROC_BIND, value: "false"}
            - {name: OMP_NUM_THREADS, value: "1"}
            - {name: TASK_QUEUE_ENABLE, value: "1"}
          ports:
            - {name: http, containerPort: 8000}
          resources:
            requests: {cpu: "8", memory: 64Gi}
            limits:
              cpu: "8"
              memory: 64Gi
              huawei.com/Ascend910: 1
          startupProbe:
            httpGet: {path: /health, port: http}
            periodSeconds: 10
            failureThreshold: 90
          readinessProbe:
            httpGet: {path: /health, port: http}
            periodSeconds: 10
            failureThreshold: 3
          volumeMounts:
            - {name: model, mountPath: /models, readOnly: true}
            - {name: temp, mountPath: /tmp}
            - {name: shm, mountPath: /dev/shm}
      volumes:
        - name: model
          persistentVolumeClaim: {claimName: qwen3-vl-model-pvc, readOnly: true}
        - name: temp
          emptyDir: {}
        - name: shm
          emptyDir: {medium: Memory, sizeLimit: 1Gi}
---
apiVersion: v1
kind: Service
metadata:
  name: qwen3-vl8b
spec:
  type: ClusterIP
  selector: {app: qwen3-vl8b}
  ports:
    - {name: http, port: 8000, targetPort: http}
```

PVC 提供只读模型，`temp` 提供临时缓存。此示例单独增加了1 GiB 的内存型 `/dev/shm` 卷，以接近官方 A2 示例的共享内存设置；**实际小样验证使用的是64 MiB，不是这个新清单**。需要确认运行用户能使用该卷，也要把内存型卷消耗计入容器资源预算。

启动和就绪探针同样是对实际验证配置的补充，不代表这个完整清单已经验收。首次加载、编译和预热可能较慢，应根据实际情况调整；`Recreate` 避免更新时同时申请两张卡，但更新期间会中断服务。

审查并替换参数后，在自己的测试集群中执行：

```bash
kubectl apply -f qwen3-vl8b.yaml
kubectl rollout status deployment/qwen3-vl8b --timeout=20m
kubectl get pods -l app=qwen3-vl8b -o wide
kubectl logs -l app=qwen3-vl8b --tail=100
kubectl get service qwen3-vl8b
```

## 6 测试文字和图片

在一个终端保持端口转发：

```bash
kubectl port-forward service/qwen3-vl8b 8000:8000
```

在另一个终端检查健康与模型列表，再测试简单文字请求：

```bash
curl -fsS http://127.0.0.1:8000/health
curl -fsS http://127.0.0.1:8000/v1/models
curl -fsS http://127.0.0.1:8000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"Qwen/Qwen3-VL-8B-Instruct","messages":[{"role":"user","content":"What is 1 + 1? Answer with only the number."}],"temperature":0,"max_tokens":64}'
```

再准备一张自己有权使用的 PNG 图片，将 `your-image.png` 换成图片路径。下面将图片编码在请求里，避免依赖模型容器访问外部图片网址：

```bash
python3 - your-image.png <<'PY'
import base64
import json
import sys
import urllib.request
from pathlib import Path

image = base64.b64encode(Path(sys.argv[1]).read_bytes()).decode("ascii")
payload = {
    "model": "Qwen/Qwen3-VL-8B-Instruct",
    "messages": [{"role": "user", "content": [
        {"type": "image_url", "image_url": {"url": "data:image/png;base64," + image}},
        {"type": "text", "text": "Describe the objects and their colors in this image."},
    ]}],
    "temperature": 0,
    "max_tokens": 256,
}
request = urllib.request.Request(
    "http://127.0.0.1:8000/v1/chat/completions",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(request, timeout=120) as response:
    result = json.load(response)
print(result["choices"][0]["message"]["content"])
print("finish_reason:", result["choices"][0]["finish_reason"])
PY
```

不要只看 HTTP 200；应核对回答是否符合图片内容。如果 `finish_reason` 为 `length`，输出可能被截断。测试结束后在转发终端按 `Ctrl+C`。

## 7 实际验证得到了什么

日志显示模型四个权重分片完成加载，随后完成图编译和预热；健康检查返回 HTTP 200。通过集群内 Service，对三项合成输入各请求一次：

1. 文字算术问题得到正确答案。
2. 对一张包含红色圆形和蓝色方形的图片，正确识别颜色与数量。
3. 对另一张包含字母、数字的图片，准确转写了两行文字。

这些结果说明所选硬件、镜像、模型和参数组合的**基础文字与单图推理**跑通。没有验证真实业务图片、多图、视频、32K 长输入、并发、长时间稳定性或生产合格性，不能把配置上限当成这些能力已通过的证据。

## 8 共享内存和显存要怎么看

实际运行容器的 `/dev/shm` 为64 MiB，启动和三项小样中未发现共享内存错误；[官方 A2/A3 示例](https://docs.vllm.ai/projects/ascend/en/v0.23.0/tutorials/models/Qwen-VL-Dense.html)指定1 GiB。前面的清单采用了单 Pod 内存卷作为示例，但该清单本身还需在目标集群验证。小样没报错，不保证高并发或大图片场景也足够；出现相关错误时，应先查看日志、Pod 卷和容器权限。

权重加载占用约 16.96 GB，但实际整卡显存占用远不止权重大小：运行时还会分配缓存和计算空间。本次使用了显存比例0.91，观测结果只对应本次配置，不能当作模型最低显存要求。

最后，示例的 Service 只在集群内提供访问，尚未配置对外认证、加密、配额和审计。正式使用前应按自己的场景设计这些能力，并使用真实数据验证效果。
