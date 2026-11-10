---
title: "vllm ascend 多用户部署：从 hccl 19 到动态补齐用户身份"
description: "通过一次双卡通信故障的单变量对照，理解容器 uid 与用户记录的关系，并介绍用 kubernetes 临时卷和准入注入支持多用户的思路。"
pubDatetime: 2026-11-06T00:00:00+08:00
tags: ["kubernetes", "ai", "故障排查"]
---

在多用户推理平台上，不同用户通过同一镜像创建服务，容器通常保留各自的普通用户身份。一次在昇腾 npu 上运行 vllm ascend 的实践中，单卡模型可以推理，双卡模型却在通信初始化时失败。

排查发现，容器进程有数字 uid，但镜像的用户登记表中没有对应记录。底层组件按 uid 查询用户信息时失败，随后引发通信初始化错误。本文记录如何确认这个原因，以及如何在不修改原镜像和平台页面的条件下，为每个新服务动态准备用户记录。

本文的案例使用 vllm ascend 0.26.0rc1、kubernetes 和两张昇腾 npu。**下面的配置片段是经过脱敏和简化的说明，不是可以直接套用的生产清单**；镜像、设备、平台构造的 pod 和安全策略不同，实际配置也需要调整。

## 遇到了什么问题

两个不同账号分别创建双卡推理服务，模型进入加载流程，但服务没有完成启动。日志中的关键错误包括：

```text
HCCL function error: hcclGetRootInfo(&hcclID), error code is 19
ra init failed, return[19]
```

日志进一步显示底层身份查询失败：

```text
pwd is NULL! getpwuid fail, errno:0
```

这些日志要结合起来看：`HCCL 19` 告诉我们通信初始化失败；本次日志中的 `getpwuid fail` 则提供了继续追查用户身份的线索。**不能看到错误码 19 就认定是用户记录问题**，设备权限、驱动、通信配置等也可能造成初始化失败。

## 有 uid，为什么还会找不到用户

可以把 uid 理解成一串用户编号，把 `/etc/passwd` 理解成容器内的用户登记表。kubernetes 能让进程以指定的 uid 和 gid 启动，但不会因此自动在镜像的登记表中新增用户。

例如，进程的 uid 是 `10001`，镜像的 `/etc/passwd` 却没有 uid 为 `10001` 的条目。进程仍可能正常启动和读取有权限的文件，但调用 `getpwuid` 查询用户名的程序可能得不到结果。

设置 `USER`、`LOGNAME` 等环境变量只是提供文本值，不会新增系统用户记录。在本次双卡故障中，底层通信组件需要查询用户信息，查询返回空值后，后续的 tls、ra 和 hccl 初始化相继失败。

## 如何确认就是这个原因

推理服务涉及镜像、模型、设备和运行参数。如果一次修改多项，服务恢复后很难知道究竟是哪项起了作用。我们先做了一个尽量只改变用户记录的对照：

| 对照项 | 原镜像 | 临时对照镜像 |
| --- | --- | --- |
| 运行身份、双卡和测试命令 | 相同 | 相同 |
| 当前 uid 的 passwd 记录 | 缺失 | 新增一条 |
| 双卡集合通信 | 初始化失败 | 两个进程均得到预期结果 |

对照镜像保留原有镜像层，只增加包含该用户记录的一层；`/etc/group` 和运行配置未改。随后，使用对照镜像的完整双卡模型也完成了一次简单问答。

结合底层日志与这次对照，可以确认本次环境中的故障与缺失用户记录有关。这不意味着所有版本的镜像、所有模型或其他环境中的同类报错都由同一原因造成。

## 不修改镜像，怎样支持不同用户

固定给一个 uid 制作镜像只能覆盖那个用户。对于多用户平台，我们希望保留平台分配的实际 uid 和 gid，在每次创建服务时，为该 pod 单独准备用户记录：

```text
用户创建推理服务
        ↓
准入规则识别目标 pod，并加入 init 容器和临时卷
        ↓
init 容器复制镜像自带的 passwd，按当前 uid 补充缺失记录
        ↓
推理容器将临时文件只读挂载到 /etc/passwd
        ↓
推理进程继续使用原来的 uid 和 gid
```

这里的 `emptyDir` 是 pod 专用临时卷，随 pod 的生命周期管理。init 容器与推理容器使用相同镜像和普通用户身份，不需要申请 npu。它不修改镜像层、宿主机用户表或 `/etc/group`、`/etc/shadow`。

用户记录中的用户名可以是根据 uid 生成的容器内名称；它不需要等于平台登录名。真正需要保持一致的是运行进程的数字 uid 和 gid，以及追加记录中对应的编号。

### 第一步：验证身份文件的生成方式

下面展示 init 容器执行的核心逻辑。示例假设镜像包含 `sh`、`awk`、`cp`、`id`，且 `/identity` 是当前 uid 可以写入的 pod 临时卷。已有相同 uid 记录时保留原记录；实际落地还应检查重复 uid、生成用户名冲突等情况。

```sh
set -eu
uid="$(id -u)"
gid="$(id -g)"

test "$uid" -gt 0
test -r /etc/passwd
test -w /identity
cp /etc/passwd /identity/passwd

if ! awk -F: -v uid="$uid" '$3 == uid { found=1 } END { exit !found }' /identity/passwd; then
  printf 'poduser%s:x:%s:%s:runtime user:/tmp:/sbin/nologin\n' \
    "$uid" "$uid" "$gid" >> /identity/passwd
fi

chmod 0644 /identity/passwd
```

这个脚本只说明身份记录的生成方式。原镜像若已有同 uid 的记录，应核对其内容是否适合应用；不能因为查询有结果就假定所有依赖都已满足。

### 第二步：让推理容器只读使用它

下面是 pod 配置的**结构示意**，省略了镜像、启动命令和设备等字段，不能直接提交。示例中的 `10001` 只是演示；平台实际使用时应根据每个 pod 的真实身份注入，不能固定成某个用户。

```yaml
spec:
  securityContext:
    fsGroup: 10001
  volumes:
    - name: identity
      emptyDir:
        sizeLimit: 1Mi
  initContainers:
    - name: prepare-identity
      # image、command 和脚本按实际镜像配置
      securityContext:
        runAsUser: 10001
        runAsGroup: 10001
        runAsNonRoot: true
      volumeMounts:
        - name: identity
          mountPath: /identity
  containers:
    - name: serving
      # 保留原有 image、command、env、设备和模型挂载
      securityContext:
        runAsUser: 10001
        runAsGroup: 10001
      volumeMounts:
        - name: identity
          mountPath: /etc/passwd
          subPath: passwd
          readOnly: true
```

`fsGroup` 的用途之一是让指定组能够按集群和存储实际行为访问卷；应验证 init 容器确实能写入临时目录。这个方法只覆盖单个文件，不覆盖整个 `/etc`。主容器若已有 `/etc/passwd` 挂载，也需要先处理冲突，不能直接叠加。

### 第三步：在平台不提供 init 配置时自动注入

如果平台页面不能配置 init 容器和临时卷，可以由集群管理员评估准入控制器。例如，使用 kyverno 在目标 pod 创建时追加上述结构。实践中，我们将规则限定在指定命名空间、推理服务标签、明确的镜像摘要和非 root 用户身份，并排除已有业务服务。

配置流程可以按下面顺序执行：

1. 核实平台创建的 pod 实际镜像、容器名、uid、gid、`fsGroup` 和已有挂载，明确哪些服务应该匹配。
2. 根据集群的 kyverno 版本编写准入规则：从目标容器取得身份，注入同身份 init、独立 `emptyDir`、只读 passwd 挂载，并限制匹配范围。检查已存在的记录和挂载冲突，避免重复注入。
3. 先使用服务端 dry-run 检查：目标身份应被注入，其他命名空间、其他镜像、已有服务及不符合条件的 pod 不应变化；再检查重复处理时不会重复添加。
4. 在授权的测试环境实际创建服务，检查 init、身份解析、模型加载和推理；通过后再按变更流程扩大匹配范围。

我们的现场使用 kyverno 1.19.2 的 `kyverno.io/v1` Policy；该策略类型已有弃用提示。**本文不提供可直接套用的准入策略**：标签、镜像引用、集群版本和已有挂载都与平台有关，应依据当前 kyverno 文档设计并测试。若页面本身支持上述 pod 配置，也可以先在单个服务中手动验证，不一定要新增准入组件。

## 怎样确认修复生效

不要只看 pod 是否为 `Running`。对于新建的测试服务，可以按实际命名空间、pod 名和容器名替换下面的示例值：

```sh
kubectl get pod <pod-name> -n <namespace> -o yaml
kubectl logs <pod-name> -n <namespace> -c prepare-identity
kubectl exec <pod-name> -n <namespace> -c serving -- id
kubectl exec <pod-name> -n <namespace> -c serving -- sh -c 'getent passwd "$(id -u)"'
```

其中 `<...>` 是需要替换的占位符，不要原样执行。实际集群的 init 和主容器名称可能不同；`getent` 也需要镜像提供。重点依次确认：

1. 准入规则命中，init 容器成功退出，临时卷及只读挂载存在。
2. 主进程仍使用预期的普通 uid/gid，用户记录能够按 uid 解析。
3. 多卡场景先检查通信初始化；然后等待模型加载完成和健康接口就绪，再发送一次简单推理请求。
4. 使用另一个真实账号重复验证，最后停止测试服务，核对设备资源和原有服务状态。

本次实际测试中，两个不同账号都通过了双卡通信和 27b 模型的一次简单问答；在正式注入规则下，另用一个测试账号对 embedding、reranker、ocr 和图文模型各完成了一次基础推理。此前两个账号也分别做过这四种单卡模型的基本测试，但那是在启用动态注入之前完成的。

服务端 dry-run 还检查了第三个示例 uid 和不应受影响的对象。它说明规则没有只写死两个测试账号，**不等于第三个真实用户已经完成推理验收**。

## 使用边界与排查提醒

- **只修复身份记录缺失。** 模型和镜像访问权限、npu 分配、驱动、可写缓存和自定义算子路径仍需分别满足。本次测试还使用了针对镜像和模型的服务级参数。
- **准入失败策略有取舍。** 如果配置为 `Ignore`，准入组件异常时 pod 可能继续创建，但也可能没有注入身份文件；需要检查实际 pod，而不只检查规则是否存在。组件自身可能还有其他失败策略的 webhook，应在安装和故障演练前核对。
- **新建生效不等于修改现有服务。** 本次规则只处理匹配的新 pod；修改镜像版本或仓库引用后要重新核对匹配条件。组件多副本如果位于同一节点，也不能等同于节点级高可用。
- **权限与回退需要预先设计。** 限制可匹配的命名空间、镜像和工作负载；准备停用规则和验证方法，并在合适环境演练。不要为消除错误直接给推理容器 root 权限或修改宿主机用户表。
- **验证范围要写清楚。** 本次是有限账号和简单输入下的功能验证，未覆盖所有用户、外部入口鉴权、吞吐性能、长期稳定性或证书轮换。

此前的《在 kubernetes 中以普通用户运行 vllm ascend》还讨论了另一类情况：镜像里的自定义算子文件存在，但普通用户没有目录访问权限。它和本文的用户记录问题可以同时出现，却需要分别检查。该文目前也是草稿，发布后可在这里补充链接。

## 参考资料

- [vllm ascend：非 root uid 缺少用户记录时的多卡问题](https://github.com/vllm-project/vllm-ascend/issues/9490)
- [kubernetes：配置 pod 或容器安全上下文](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)
- [kubernetes：emptydir 卷](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir)
- [kyverno：mutate 规则](https://kyverno.io/docs/policy-types/cluster-policy/mutate/)
