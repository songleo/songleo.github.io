---
title: "昇腾 npu 如何接入 kubernetes：从机器有卡到 pod 能计算"
description: "用一次去敏后的实践，讲清昇腾 npu 如何被 kubernetes 发现、分配，以及怎样确认 pod 真正完成计算。"
pubDatetime: 2026-10-23T20:50:54+08:00
tags: ["kubernetes", "部署", "云原生"]
---

一台服务器上的 npu 驱动已经正常工作，主机工具也能列出设备，为什么 kubernetes 的 pod 还是申请不到 npu？我们在一次 ascend 910B 系列设备接入中遇到的正是这个问题：**硬件在主机上可用，不等于 kubernetes 已经认识这种资源。**

下面是一段去敏后的整卡接入记录。配置片段只展示关键字段，不能原样用于其他集群。

## 1 五个组件各做什么

可以把接入过程想成“登记设备，再把设备交给领到号的容器”：

| 角色 | 负责什么 |
| --- | --- |
| 宿主机驱动 | 让操作系统识别并操作 npu。主机工具能看到卡，只验证到这一层。 |
| ascend device plugin（设备插件） | 发现设备，向该节点的 kubelet 注册 `huawei.com/Ascend910`，报告设备数量和状态。 |
| containerd | 接到 kubelet 的容器创建请求，按指定配置启动容器。 |
| ascend 容器运行时 | 在启动使用 npu 的容器时接入所分配的设备及所需的驱动能力。 |
| runtimeclass | 给上述专用运行时一个 kubernetes 可引用的名字，例如 `ascend`，并限制它可用的节点。 |

设备插件负责“**报卡**”，专用运行时负责“**让容器用卡**”。两者配合，才能让 kubernetes 从发现设备走到实际计算。

这里还要分清 `containerd` 和 `runc`：kubelet 请 containerd 创建 pod 的容器；containerd 管镜像和容器生命周期，再选择底层执行程序。普通 pod 默认选 `runc`，它按容器标准启动进程；需要 npu 的 pod 则选昇腾容器运行时，由它接入获分配的设备和驱动文件。

```text
普通 pod：kubelet → containerd → containerd-shim-runc-v2 → runc → 容器
npu pod： kubelet → containerd → containerd-shim-runc-v2 → 昇腾容器运行时 → 容器
```

`containerd-shim-runc-v2` 是两条路径都用到的转接程序。**名字里有 `runc`，不表示它最终一定调用默认的 `runc` 程序。**本次由 containerd 中具名运行配置的 `BinaryName` 决定实际调用哪个程序；不能仅凭这层配置断言昇腾运行时内部完全不涉及 `runc`。[containerd 官方配置说明](https://github.com/containerd/containerd/blob/main/docs/cri/config.md)给出了具名运行时、默认运行时与 `BinaryName` 的关系。

## 2 这次怎样部署

本次按三个步骤完成接入：

1. 准备宿主机。确认驱动能识别设备、节点已加入 kubernetes；核对 arm64 软件版本、安装包与镜像摘要，并备份原有运行配置。
2. 接入容器运行时。在 npu 节点安装昇腾容器运行时；给 containerd 新增 `ascend` handler，保留默认 `runc`。创建同名 runtimeclass，限制到支持 npu 的节点。让 containerd 配置生效时，先核对它与 kubelet 的服务依赖，事后检查原有 pod。[kubernetes runtimeclass 文档](https://kubernetes.io/docs/concepts/containers/runtime-class/)说明了 handler 与节点调度约束。
3. 部署设备插件。用 daemonset 只在目标节点运行 ascend device plugin，配好服务账号、必要权限、宿主机驱动与 DCMI 访问，以及 kubelet 的设备插件通信目录；再确认插件 pod 就绪。昇腾的[安装说明](https://github.com/Ascend/mind-cluster/blob/master/docs/zh/scheduling/05_developer_guide/00_installation_deployment/00_manual_installation/04_ascend_device_plugin.md)要求先安装昇腾运行时，再安装设备插件。

插件启动后，先通过驱动和 DCMI 读取设备编号、数量、健康状态；再用 `Register` 向 kubelet 登记 `huawei.com/Ascend910`，用 `ListAndWatch` 持续上报设备。kubelet 据此更新 node 的资源数量。pod 申请卡并完成调度后，kubelet 通过 `Allocate` 取得具体分配信息，昇腾运行时再将获分配的设备接入容器。这是“主机有卡”变成“pod 能用卡”的核心过程。[昇腾组件说明](https://github.com/Ascend/mind-cluster/blob/master/docs/zh/scheduling/01_introduction/01_component_description.md)和[kubernetes 设备插件文档](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/)分别说明了设备采集及插件接口。

## 3 kubernetes 怎样把一张卡交给 pod

插件上报资源后，使用者要在容器资源限制中申请卡，并为 pod 选择 `ascend` runtimeclass。真正运行程序时，还要使用架构适配、包含相应 cann 依赖的计算镜像，并核对容器内 cann 与宿主机驱动兼容；这属于**计算环境准备**，不是向 kubernetes 注册设备的步骤。昇腾的[容器镜像说明](https://github.com/Ascend/cann-container-image/blob/main/OVERVIEW.md)列出了这项兼容前提。下面仅展示关键字段；镜像地址、节点选择条件和程序命令要按自己的环境填写：

```yaml
spec:
  runtimeClassName: ascend
  containers:
    - name: npu-worker
      image: <已验证的 ARM64 NPU 计算镜像>
      resources:
        limits:
          huawei.com/Ascend910: 1
```

`huawei.com/Ascend910: 1` 表示申请一张整卡，调度器据此挑选能够满足请求的节点；`runtimeClassName: ascend` 告诉 kubelet 用哪套运行配置启动容器。**写了 runtimeclass 不会自动申请卡；申请了卡也不能替代正确的运行时配置。** 设备插件再参与实际设备分配，容器启动后才能看到获分配的设备。扩展资源按整数申请、不能超卖，这是 kubernetes [设备插件文档](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/)规定的行为。

## 4 验收要过三道关

第一关是**宿主机**：驱动能列出预期设备，设备状态满足本次单卡测试要求。这说明硬件起点正常，但尚未证明 kubernetes 已注册资源。

第二关是**kubernetes 注册**：设备插件的 pod 处于 Ready；查看目标 node 的 `Capacity` 和 `Allocatable`，能看到 `huawei.com/Ascend910`，数值与预期的整卡数量相符。可以用只读命令查看，下面的节点名只是占位符：

```bash
kubectl -n kube-system get daemonset
kubectl get runtimeclass ascend
kubectl describe node <NPU节点>
```

`Capacity` 是节点上报的总量，`Allocatable` 是 kubernetes 可用于安排 pod 的上限。**它们不是“此刻还空着几张卡”的计数器**；判断剩余可分配量还要看已有 pod 的资源申请。如果另有 kubernetes 之外的程序使用设备，也不能仅凭这两个数字判断物理卡空闲。

第三关是**真正使用**：先运行一个不申请 npu 的普通 pod，确认默认运行时仍正常；再运行只申请一张卡的计算 pod，核对它确实落在 npu 节点、指定了 `ascend`、容器获得设备，并完成真实计算。测试结束后清理 pod。这里使用实际 pod 的运行结果作为证据；上面的清单只是示意，不表示测试 pod 按该片段手工创建。

```bash
kubectl get pod <验证Pod> -o wide
kubectl describe pod <验证Pod>
kubectl logs <验证Pod>
```

例如，让输入 `[1,2,3,4]` 与 `[10,20,30,40]` 在 npu 上相加，实际得到 `[11,22,33,44]`。这比只检查节点资源数字多证明了一步：设备已经进入容器，程序确实完成了计算。

至此，可以说 **kubernetes 已注册 npu，并已完成一次单卡调度与计算闭环**。还不能据此推断任意模型镜像、多卡通信、性能表现或跨系统资源协调都已合格。要验证这些能力，仍需各自的测试。

把整个过程记成一句话就是：**驱动让主机认识卡，设备插件让 kubernetes 看见卡，资源请求让调度器分卡，专用运行时让容器用卡，真实计算证明这条链路走通。**
