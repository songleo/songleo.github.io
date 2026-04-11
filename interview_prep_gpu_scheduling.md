# GPU 调度面试准备文档

深入解析 Kubernetes GPU 资源管理、调度策略与优化实践

---

## 一、GPU 基础与资源管理

### 1. Kubernetes 如何支持 GPU？核心组件有哪些？

**参考答案：**

**Kubernetes GPU 支持架构：**

```
┌─────────────────────────────────────────────────┐
│              Kubernetes Cluster                 │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │          kube-scheduler                  │  │
│  │  - GPU 资源感知调度                       │  │
│  │  - 节点亲和性                            │  │
│  └──────────────┬───────────────────────────┘  │
│                 │                               │
│  ┌──────────────▼───────────────────────────┐  │
│  │          kube-apiserver                  │  │
│  │  - Extended Resources                    │  │
│  └──────────────┬───────────────────────────┘  │
│                 │                               │
│  ┌──────────────▼───────────────────────────┐  │
│  │   GPU Node (Worker Node)                 │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │        kubelet                     │  │  │
│  │  │  - 资源上报                         │  │  │
│  │  │  - Pod 生命周期管理                 │  │  │
│  │  └──────────┬─────────────────────────┘  │  │
│  │             │                             │  │
│  │  ┌──────────▼─────────────────────────┐  │  │
│  │  │   Device Plugin                   │  │  │
│  │  │  - NVIDIA Device Plugin            │  │  │
│  │  │  - AMD Device Plugin               │  │  │
│  │  └──────────┬─────────────────────────┘  │  │
│  │             │                             │  │
│  │  ┌──────────▼─────────────────────────┐  │  │
│  │  │   Container Runtime                │  │  │
│  │  │  - containerd + nvidia-runtime     │  │  │
│  │  └──────────┬─────────────────────────┘  │  │
│  │             │                             │  │
│  │  ┌──────────▼─────────────────────────┐  │  │
│  │  │   GPU 硬件层                       │  │  │
│  │  │  - NVIDIA GPU (A100, H100...)      │  │  │
│  │  │  - CUDA Driver                     │  │  │
│  │  └────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**核心组件：**

**1. Device Plugin Framework**

Kubernetes 通过 Device Plugin 机制支持 GPU 等硬件加速器。

**工作流程：**
```
1. Device Plugin 启动并注册到 kubelet
2. Device Plugin 发现并上报 GPU 资源
3. kubelet 将 GPU 资源信息更新到 Node
4. Scheduler 根据 GPU 资源调度 Pod
5. kubelet 通过 Device Plugin 分配 GPU 给容器
```

**2. NVIDIA Device Plugin**

最常用的 GPU Device Plugin 实现。

**部署：**
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: nvidia-device-plugin-daemonset
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: nvidia-device-plugin-ds
  updateStrategy:
    type: RollingUpdate
  template:
    metadata:
      labels:
        name: nvidia-device-plugin-ds
    spec:
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      priorityClassName: system-node-critical
      containers:
      - name: nvidia-device-plugin-ctr
        image: nvcr.io/nvidia/k8s-device-plugin:v0.14.0
        env:
        - name: FAIL_ON_INIT_ERROR
          value: "false"
        - name: NVIDIA_MIG_MONITOR_DEVICES
          value: "all"
        - name: PASS_DEVICE_SPECS
          value: "true"
        - name: DEVICE_LIST_STRATEGY
          value: "envvar"
        - name: DEVICE_ID_STRATEGY
          value: "uuid"
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            drop: ["ALL"]
        volumeMounts:
        - name: device-plugin
          mountPath: /var/lib/kubelet/device-plugins
      volumes:
      - name: device-plugin
        hostPath:
          path: /var/lib/kubelet/device-plugins
```

**3. GPU Operator**

NVIDIA GPU Operator 自动化 GPU 软件栈部署。

```bash
# 安装 GPU Operator
helm install --wait --generate-name \
  -n gpu-operator --create-namespace \
  nvidia/gpu-operator \
  --set driver.enabled=true \
  --set toolkit.enabled=true \
  --set devicePlugin.enabled=true \
  --set dcgmExporter.enabled=true \
  --set gfd.enabled=true \
  --set migManager.enabled=true \
  --set nodeStatusExporter.enabled=true
```

**GPU Operator 组件：**
- **NVIDIA Driver**：GPU 驱动
- **NVIDIA Container Toolkit**：容器运行时
- **NVIDIA Device Plugin**：资源上报
- **NVIDIA DCGM Exporter**：监控指标导出
- **GPU Feature Discovery**：GPU 特性标签
- **MIG Manager**：MIG 配置管理

**4. Extended Resources**

Kubernetes 通过 Extended Resources 暴露 GPU 资源。

**节点资源示例：**
```yaml
apiVersion: v1
kind: Node
metadata:
  name: gpu-node-1
  labels:
    nvidia.com/gpu.product: NVIDIA-A100-SXM4-80GB
    nvidia.com/gpu.count: "8"
    nvidia.com/gpu.memory: "640GB"
status:
  capacity:
    nvidia.com/gpu: "8"
  allocatable:
    nvidia.com/gpu: "8"
```

**Pod 请求 GPU：**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  containers:
  - name: cuda-container
    image: nvidia/cuda:12.0.0-base-ubuntu22.04
    command: ["nvidia-smi"]
    resources:
      limits:
        nvidia.com/gpu: 2  # 请求 2 个 GPU
```

**我的实践经验：**
在生产环境中，GPU Operator 极大简化了 GPU 集群的部署和运维。关键配置点：
1. 根据驱动版本选择合适的 Operator 版本
2. 启用 DCGM Exporter 收集 GPU 监控指标
3. 配置 MIG 模式支持 GPU 切分
4. 使用 nodeSelector 确保 Operator 只部署在 GPU 节点

---

## 二、GPU 调度策略

### 2. Kubernetes GPU 调度有哪些限制？如何优化？

**参考答案：**

**原生 Kubernetes GPU 调度限制：**

**1. 粗粒度资源分配**

**问题：**
- 只能按整卡分配，无法共享
- 小任务浪费 GPU 资源
- GPU 利用率低（通常 < 30%）

**示例：**
```yaml
# 训练任务需要 8 个 GPU
resources:
  limits:
    nvidia.com/gpu: 8  # 独占 8 个 GPU

# 推理任务只需要 0.5 个 GPU，但必须分配 1 个
resources:
  limits:
    nvidia.com/gpu: 1  # 浪费 50% GPU 资源
```

**2. 缺乏拓扑感知**

**问题：**
- 不考虑 GPU 间的 NVLink/NVSwitch 连接
- 跨 NUMA 节点分配降低性能
- 不支持 GPU 亲和性调度

**GPU 拓扑示例（DGX A100）：**
```
GPU0 ── NVLink ── GPU1 ── NVLink ── GPU2 ── NVLink ── GPU3
 │                                                      │
NVSwitch                                          NVSwitch
 │                                                      │
GPU4 ── NVLink ── GPU5 ── NVLink ── GPU6 ── NVLink ── GPU7
```

**3. 缺乏 Gang Scheduling**

**问题：**
- 分布式训练需要多个 Pod 同时启动
- 部分 Pod 启动会占用资源，导致死锁

**示例：**
```yaml
# PyTorch DDP 训练需要 4 个 Worker 同时启动
# Worker 1 启动成功，占用 2 个 GPU
# Worker 2-4 因资源不足 Pending
# 训练无法开始，GPU 资源被浪费
```

**4. 不支持抢占式调度**

**问题：**
- 高优先级任务无法抢占低优先级任务
- 紧急任务需要等待

**优化方案：**

**方案 1：GPU 共享（vGPU）**

**NVIDIA MIG（Multi-Instance GPU）：**

硬件级 GPU 切分，适用于 A100/A30/H100。

```bash
# 配置 MIG 模式
nvidia-smi -mig 1

# 创建 MIG 实例（1g.10gb = 1/7 GPU, 10GB 显存）
nvidia-smi mig -cgi 1g.10gb,1g.10gb,1g.10gb,1g.10gb,1g.10gb,1g.10gb,1g.10gb

# 创建 Compute Instance
nvidia-smi mig -cci
```

**MIG Device Plugin 配置：**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nvidia-mig-config
  namespace: gpu-operator
data:
  config.yaml: |
    version: v1
    mig-configs:
      all-1g.10gb:
        - devices: [0,1,2,3,4,5,6,7]
          mig-enabled: true
          mig-devices:
            "1g.10gb": 7  # 每个 GPU 切分为 7 个实例
```

**使用 MIG：**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mig-pod
spec:
  containers:
  - name: cuda
    image: nvidia/cuda:12.0.0-base
    resources:
      limits:
        nvidia.com/mig-1g.10gb: 1  # 请求 1 个 MIG 实例
```

**GPU 共享方案对比：**

| 方案 | 隔离性 | 性能损失 | 适用场景 | 限制 |
|------|--------|----------|----------|------|
| MIG | 硬件隔离 | < 5% | 推理、小训练 | 仅 A100/H100 |
| vCUDA | 软件隔离 | 10-15% | 推理 | 需要修改 runtime |
| Time-Slicing | 时间片 | 20-30% | 开发测试 | 无隔离 |

**方案 2：拓扑感知调度**

**使用 GPU Feature Discovery (GFD) 标签：**

```bash
# GFD 自动给节点打标签
kubectl get nodes --show-labels | grep nvidia

# 标签示例
nvidia.com/gpu.product=NVIDIA-A100-SXM4-80GB
nvidia.com/gpu.memory=81920
nvidia.com/gpu.count=8
nvidia.com/cuda.driver.major=525
nvidia.com/cuda.driver.minor=85
nvidia.com/cuda.runtime.major=12
nvidia.com/cuda.runtime.minor=0
nvidia.com/gpu.compute.major=8
nvidia.com/gpu.compute.minor=0
```

**基于标签调度：**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: a100-pod
spec:
  nodeSelector:
    nvidia.com/gpu.product: NVIDIA-A100-SXM4-80GB
    nvidia.com/gpu.count: "8"
  containers:
  - name: training
    image: nvcr.io/nvidia/pytorch:23.12-py3
    resources:
      limits:
        nvidia.com/gpu: 8
```

**拓扑感知调度器（Topology-Aware Scheduler）：**

```yaml
# 使用 Volcano 的 GPU Topology Plugin
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: distributed-training
spec:
  schedulerName: volcano
  plugins:
    env: []
    svc: []
  policies:
  - event: PodEvicted
    action: RestartJob
  tasks:
  - name: worker
    replicas: 2
    template:
      spec:
        containers:
        - name: pytorch
          image: pytorch/pytorch:2.0.0-cuda11.8
          resources:
            limits:
              nvidia.com/gpu: 4
        affinity:
          # GPU 拓扑亲和性
          nodeAffinity:
            requiredDuringSchedulingIgnoredDuringExecution:
              nodeSelectorTerms:
              - matchExpressions:
                - key: nvidia.com/gpu.nvlink
                  operator: In
                  values: ["enabled"]
```

**方案 3：Gang Scheduling**

**使用 Volcano 实现 Gang Scheduling：**

```yaml
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: pytorch-ddp-training
spec:
  schedulerName: volcano
  minAvailable: 4  # 最小同时运行 Pod 数
  queue: default
  tasks:
  - name: worker
    replicas: 4
    policies:
    - event: TaskCompleted
      action: CompleteJob
    template:
      metadata:
        labels:
          app: pytorch-training
      spec:
        restartPolicy: OnFailure
        containers:
        - name: pytorch
          image: pytorch/pytorch:2.0.0-cuda11.8
          command: ["python", "-m", "torch.distributed.launch"]
          args:
          - "--nproc_per_node=2"
          - "--nnodes=4"
          - "--node_rank=$(RANK)"
          - "--master_addr=$(MASTER_ADDR)"
          - "--master_port=23456"
          - "train.py"
          resources:
            limits:
              nvidia.com/gpu: 2
          env:
          - name: RANK
            valueFrom:
              fieldRef:
                fieldPath: metadata.annotations['volcano.sh/task-index']
          - name: MASTER_ADDR
            value: "pytorch-ddp-training-worker-0"
```

**Volcano Gang Scheduling 原理：**
```
1. 所有 4 个 Worker Pod 创建
2. Volcano 检查集群是否有 8 个 GPU（4 x 2）可用
3. 如果资源不足，所有 Pod 保持 Pending
4. 如果资源充足，同时调度所有 4 个 Pod
5. 避免部分 Pod 运行导致的死锁
```

**方案 4：优先级与抢占**

**定义 PriorityClass：**
```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority-training
value: 1000000
globalDefault: false
description: "High priority for production training jobs"
preemptionPolicy: PreemptLowerPriority
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority-dev
value: 1000
globalDefault: false
description: "Low priority for development jobs"
preemptionPolicy: Never
```

**使用：**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: prod-training
spec:
  priorityClassName: high-priority-training
  containers:
  - name: training
    resources:
      limits:
        nvidia.com/gpu: 8
```

**我的实践经验：**
GPU 调度优化组合拳：
1. **推理场景**：MIG 切分 + Time-Slicing 提高利用率
2. **训练场景**：Volcano Gang Scheduling + 拓扑感知
3. **混合场景**：PriorityClass 确保生产任务优先
4. **成本优化**：Spot 实例 + Checkpoint 容错

---

## 三、GPU 共享与虚拟化

### 3. 如何实现 GPU 共享？有哪些方案？

**参考答案：**

**GPU 共享方案对比：**

**方案 1：NVIDIA MIG（推荐生产）**

**MIG 架构：**
```
┌────────────────── A100 GPU (80GB) ──────────────────┐
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│
│  │ MIG 1   │  │ MIG 2   │  │ MIG 3   │  │ MIG 4   ││
│  │ 10GB    │  │ 10GB    │  │ 10GB    │  │ 10GB    ││
│  │ 1 GPC   │  │ 1 GPC   │  │ 1 GPC   │  │ 1 GPC   ││
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘│
│  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │ MIG 5   │  │ MIG 6   │  │ MIG 7   │              │
│  │ 10GB    │  │ 10GB    │  │ 10GB    │              │
│  │ 1 GPC   │  │ 1 GPC   │  │ 1 GPC   │              │
│  └─────────┘  └─────────┘  └─────────┘              │
└──────────────────────────────────────────────────────┘
```

**MIG 配置模式：**

| Profile | GPU Slice | Memory | SM | 适用场景 |
|---------|-----------|--------|-----|---------|
| 1g.10gb | 1/7 | 10GB | 14 | 小推理 |
| 2g.20gb | 2/7 | 20GB | 28 | 中推理 |
| 3g.40gb | 3/7 | 40GB | 42 | 大推理 |
| 4g.40gb | 4/7 | 40GB | 56 | 训练 |
| 7g.80gb | 7/7 | 80GB | 98 | 完整 GPU |

**自动化 MIG 配置：**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mig-parted-config
  namespace: gpu-operator
data:
  config.yaml: |
    version: v1
    mig-configs:
      # 配置 1: 7 个小实例（推理）
      all-1g.10gb:
        - devices: all
          mig-enabled: true
          mig-devices:
            "1g.10gb": 7
      
      # 配置 2: 混合配置
      mixed:
        - devices: [0,1,2,3]
          mig-enabled: true
          mig-devices:
            "3g.40gb": 2  # 2 个大实例
            "1g.10gb": 1  # 1 个小实例
        - devices: [4,5,6,7]
          mig-enabled: false  # 保持整卡
```

**动态切换 MIG 配置：**
```bash
# 应用配置
kubectl label node gpu-node-1 \
  nvidia.com/mig.config=all-1g.10gb

# MIG Manager 自动重配置
# 1. Drain 节点
# 2. 配置 MIG
# 3. 重启 Device Plugin
# 4. Uncordon 节点
```

**方案 2：vCUDA / vGPU（阿里云、腾讯云）**

**架构：**
```
┌──────────────────────────────────┐
│         Container 1              │
│  ┌────────────────────────────┐  │
│  │  CUDA Application          │  │
│  └──────────┬─────────────────┘  │
│             │                    │
│  ┌──────────▼─────────────────┐  │
│  │  vCUDA Library             │  │
│  │  - 显存隔离                 │  │
│  │  - 算力限制                 │  │
│  └──────────┬─────────────────┘  │
└─────────────┼────────────────────┘
              │
┌─────────────▼────────────────────┐
│    vCUDA Runtime (Host)          │
│  - 资源调度                       │
│  - QoS 保证                       │
└─────────────┬────────────────────┘
              │
┌─────────────▼────────────────────┐
│         Physical GPU             │
└──────────────────────────────────┘
```

**使用示例：**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: vcuda-pod
spec:
  containers:
  - name: app
    image: tensorflow/tensorflow:2.12.0-gpu
    resources:
      limits:
        aliyun.com/gpu-mem: 8  # 8GB 显存
        aliyun.com/gpu-core: 50  # 50% 算力
```

**方案 3：GPU Time-Slicing（NVIDIA）**

**原理：**
```
Time Slice 1 (100ms): Container A
Time Slice 2 (100ms): Container B  
Time Slice 3 (100ms): Container C
Time Slice 4 (100ms): Container A
...
```

**配置：**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: time-slicing-config
  namespace: gpu-operator
data:
  config.yaml: |
    version: v1
    sharing:
      timeSlicing:
        replicas: 4  # 1 个 GPU 虚拟成 4 个
        renameByDefault: false
        failRequestsGreaterThanOne: true
        resources:
        - name: nvidia.com/gpu
          replicas: 4
```

**应用配置：**
```bash
# 配置 Device Plugin
kubectl patch clusterpolicy gpu-cluster-policy \
  --type merge \
  --patch '{"spec": {"devicePlugin": {"config": {"name": "time-slicing-config"}}}}'

# 节点资源变化
# Before: nvidia.com/gpu: 1
# After:  nvidia.com/gpu: 4
```

**使用：**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: shared-gpu-pod-1
spec:
  containers:
  - name: app
    resources:
      limits:
        nvidia.com/gpu: 1  # 实际是 1/4 GPU
```

**注意：**
- 无显存隔离，容器可以看到所有显存
- 无算力限制，先到先得
- 适合开发测试，不推荐生产

**方案 4：GPU Pooling（Run:ai, KubeAI）**

**架构：**
```
┌──────────── GPU Pool ────────────┐
│                                   │
│  GPU Node 1: 8x A100             │
│  GPU Node 2: 8x A100             │
│  GPU Node 3: 8x A100             │
│                                   │
│  Total: 24 GPUs                  │
└───────────────────────────────────┘
         │
         │ 动态分配
         │
┌────────▼───────────┐
│  Job 1: 16 GPUs    │
│  Job 2: 4 GPUs     │
│  Job 3: 2 GPUs     │
│  Job 4: 2 GPUs     │
└────────────────────┘
```

**特性：**
- 分数 GPU 支持（0.5, 0.25 GPU）
- GPU 超卖（Overcommitment）
- 动态 GPU 迁移
- Bin Packing 优化

**方案对比总结：**

| 方案 | 隔离性 | 性能 | 易用性 | 成本 | 推荐场景 |
|------|--------|------|--------|------|----------|
| MIG | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 高 | 生产推理 |
| vCUDA | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 中 | 推理 |
| Time-Slicing | ⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | 低 | 开发测试 |
| GPU Pooling | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 中 | 混合负载 |

**我的实践经验：**

**推理场景：**
```yaml
# 使用 MIG 1g.10gb 实例
# 1 个 A100 (80GB) → 7 个推理实例
# GPU 利用率从 20% 提升到 70%
# 成本降低 50%
```

**训练场景：**
```yaml
# 使用整卡或 MIG 3g.40gb
# 避免性能损失
# 通过 Gang Scheduling 提高资源利用率
```

**混合场景：**
```yaml
# 动态 MIG 配置
# 白天：7x 1g.10gb（推理高峰）
# 夜晚：1x 7g.80gb（训练任务）
```

---

## 四、GPU 监控与可观测性

### 4. 如何监控 GPU 集群？关键指标有哪些？

**参考答案：**

**GPU 监控架构：**

```
┌────────────────────────────────────────────┐
│          Grafana Dashboard                 │
│  - GPU 利用率                               │
│  - 显存使用                                 │
│  - 温度/功耗                                │
│  - 训练吞吐量                               │
└──────────────┬─────────────────────────────┘
               │
┌──────────────▼─────────────────────────────┐
│          Prometheus                        │
│  - 采集 GPU 指标                            │
│  - 存储时序数据                             │
│  - 告警规则                                 │
└──────────────┬─────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐ ┌──────▼──────────┐
│ DCGM        │ │ GPU Exporter    │
│ Exporter    │ │ (nvidia-smi)    │
└──────┬──────┘ └──────┬──────────┘
       │               │
       └───────┬───────┘
               │
┌──────────────▼─────────────────────────────┐
│          GPU Hardware                      │
│  - NVIDIA GPU                              │
│  - DCGM (Data Center GPU Manager)         │
└────────────────────────────────────────────┘
```

**1. 部署 DCGM Exporter**

**DaemonSet 部署：**
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: dcgm-exporter
  namespace: gpu-operator
spec:
  selector:
    matchLabels:
      app: dcgm-exporter
  template:
    metadata:
      labels:
        app: dcgm-exporter
    spec:
      nodeSelector:
        nvidia.com/gpu.present: "true"
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      containers:
      - name: dcgm-exporter
        image: nvcr.io/nvidia/k8s/dcgm-exporter:3.1.7-3.1.4-ubuntu20.04
        env:
        - name: DCGM_EXPORTER_LISTEN
          value: ":9400"
        - name: DCGM_EXPORTER_KUBERNETES
          value: "true"
        - name: DCGM_EXPORTER_COLLECTORS
          value: "/etc/dcgm-exporter/dcp-metrics-included.csv"
        ports:
        - name: metrics
          containerPort: 9400
        securityContext:
          privileged: true
          capabilities:
            add:
            - SYS_ADMIN
        volumeMounts:
        - name: pod-gpu-resources
          readOnly: true
          mountPath: /var/lib/kubelet/pod-resources
      volumes:
      - name: pod-gpu-resources
        hostPath:
          path: /var/lib/kubelet/pod-resources
```

**2. 配置 ServiceMonitor**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: dcgm-exporter
  namespace: gpu-operator
  labels:
    app: dcgm-exporter
spec:
  selector:
    app: dcgm-exporter
  ports:
  - name: metrics
    port: 9400
    targetPort: 9400
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: dcgm-exporter
  namespace: gpu-operator
spec:
  selector:
    matchLabels:
      app: dcgm-exporter
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

**3. 关键 GPU 指标**

**GPU 利用率：**
```promql
# GPU SM (Streaming Multiprocessor) 利用率
DCGM_FI_DEV_GPU_UTIL

# GPU 内存利用率
DCGM_FI_DEV_MEM_COPY_UTIL

# Tensor Core 利用率
DCGM_FI_PROF_PIPE_TENSOR_ACTIVE
```

**显存使用：**
```promql
# 已用显存（字节）
DCGM_FI_DEV_FB_USED

# 可用显存（字节）
DCGM_FI_DEV_FB_FREE

# 显存利用率（百分比）
DCGM_FI_DEV_FB_USED / (DCGM_FI_DEV_FB_USED + DCGM_FI_DEV_FB_FREE) * 100
```

**温度和功耗：**
```promql
# GPU 温度（摄氏度）
DCGM_FI_DEV_GPU_TEMP

# 功耗（瓦特）
DCGM_FI_DEV_POWER_USAGE

# 功耗上限
DCGM_FI_DEV_POWER_MGMT_LIMIT
```

**性能指标：**
```promql
# PCIe 吞吐量（发送）
DCGM_FI_PROF_PCIE_TX_BYTES

# PCIe 吞吐量（接收）
DCGM_FI_PROF_PCIE_RX_BYTES

# NVLink 带宽
DCGM_FI_PROF_NVLINK_TX_BYTES
DCGM_FI_PROF_NVLINK_RX_BYTES
```

**错误和健康：**
```promql
# ECC 错误（单bit）
DCGM_FI_DEV_ECC_SBE_VOL_TOTAL

# ECC 错误（双bit）
DCGM_FI_DEV_ECC_DBE_VOL_TOTAL

# XID 错误
DCGM_FI_DEV_XID_ERRORS
```

**4. Grafana Dashboard 配置**

**GPU 概览 Dashboard：**
```json
{
  "dashboard": {
    "title": "GPU Cluster Overview",
    "panels": [
      {
        "title": "GPU Utilization by Node",
        "targets": [{
          "expr": "avg by (Hostname) (DCGM_FI_DEV_GPU_UTIL)"
        }],
        "type": "graph"
      },
      {
        "title": "GPU Memory Usage",
        "targets": [{
          "expr": "sum by (Hostname) (DCGM_FI_DEV_FB_USED) / 1024 / 1024 / 1024"
        }],
        "type": "graph",
        "unit": "GB"
      },
      {
        "title": "GPU Temperature",
        "targets": [{
          "expr": "max by (gpu, Hostname) (DCGM_FI_DEV_GPU_TEMP)"
        }],
        "type": "graph",
        "thresholds": [
          {"value": 80, "color": "yellow"},
          {"value": 90, "color": "red"}
        ]
      },
      {
        "title": "GPU Power Usage",
        "targets": [{
          "expr": "avg by (Hostname) (DCGM_FI_DEV_POWER_USAGE)"
        }],
        "type": "graph",
        "unit": "W"
      }
    ]
  }
}
```

**训练任务 Dashboard：**
```json
{
  "panels": [
    {
      "title": "Training GPU Utilization",
      "targets": [{
        "expr": "avg by (pod, namespace) (DCGM_FI_DEV_GPU_UTIL{namespace=\"training\"})"
      }]
    },
    {
      "title": "GPU Memory per Pod",
      "targets": [{
        "expr": "sum by (pod, namespace) (DCGM_FI_DEV_FB_USED{namespace=\"training\"}) / 1024 / 1024 / 1024"
      }]
    },
    {
      "title": "Training Throughput (samples/sec)",
      "targets": [{
        "expr": "rate(training_samples_total[5m])"
      }]
    }
  ]
}
```

**5. 告警规则**

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: gpu-alerts
  namespace: monitoring
spec:
  groups:
  - name: gpu
    interval: 30s
    rules:
    # GPU 高温告警
    - alert: GPUHighTemperature
      expr: DCGM_FI_DEV_GPU_TEMP > 85
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "GPU temperature high"
        description: "GPU {{ $labels.gpu }} on {{ $labels.Hostname }} temperature is {{ $value }}°C"
    
    # GPU 严重高温
    - alert: GPUCriticalTemperature
      expr: DCGM_FI_DEV_GPU_TEMP > 90
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "GPU temperature critical"
        description: "GPU {{ $labels.gpu }} on {{ $labels.Hostname }} temperature is {{ $value }}°C"
    
    # GPU 功耗异常
    - alert: GPUPowerAbnormal
      expr: DCGM_FI_DEV_POWER_USAGE > DCGM_FI_DEV_POWER_MGMT_LIMIT * 0.95
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "GPU power usage near limit"
        description: "GPU {{ $labels.gpu }} power usage {{ $value }}W near limit"
    
    # GPU 显存不足
    - alert: GPUMemoryLow
      expr: DCGM_FI_DEV_FB_FREE / (DCGM_FI_DEV_FB_USED + DCGM_FI_DEV_FB_FREE) < 0.1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "GPU memory low"
        description: "GPU {{ $labels.gpu }} on {{ $labels.Hostname }} has less than 10% memory free"
    
    # ECC 错误
    - alert: GPUECCErrors
      expr: rate(DCGM_FI_DEV_ECC_DBE_VOL_TOTAL[5m]) > 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "GPU ECC errors detected"
        description: "GPU {{ $labels.gpu }} on {{ $labels.Hostname }} has ECC double-bit errors"
    
    # GPU 利用率过低（资源浪费）
    - alert: GPUUnderutilized
      expr: avg_over_time(DCGM_FI_DEV_GPU_UTIL[30m]) < 10
      for: 1h
      labels:
        severity: info
      annotations:
        summary: "GPU underutilized"
        description: "GPU {{ $labels.gpu }} on {{ $labels.Hostname }} utilization < 10% for 1 hour"
    
    # GPU Hung（卡死）
    - alert: GPUHung
      expr: changes(DCGM_FI_DEV_GPU_UTIL[10m]) == 0 and DCGM_FI_DEV_GPU_UTIL > 0
      for: 10m
      labels:
        severity: critical
      annotations:
        summary: "GPU may be hung"
        description: "GPU {{ $labels.gpu }} utilization not changing for 10 minutes"
```

**6. 应用层指标（训练/推理）**

**PyTorch 训练指标：**
```python
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# 定义指标
training_samples = Counter('training_samples_total', 'Total training samples processed')
training_loss = Gauge('training_loss', 'Current training loss')
training_accuracy = Gauge('training_accuracy', 'Current training accuracy')
batch_time = Histogram('batch_processing_seconds', 'Time to process a batch')
gpu_memory_allocated = Gauge('gpu_memory_allocated_bytes', 'GPU memory allocated', ['device'])

# 启动 Prometheus HTTP Server
start_http_server(8000)

# 训练循环
for epoch in range(num_epochs):
    for batch_idx, (data, target) in enumerate(train_loader):
        start_time = time.time()
        
        # 训练
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()
        
        # 更新指标
        training_samples.inc(len(data))
        training_loss.set(loss.item())
        batch_time.observe(time.time() - start_time)
        
        # GPU 显存
        for i in range(torch.cuda.device_count()):
            gpu_memory_allocated.labels(device=f'cuda:{i}').set(
                torch.cuda.memory_allocated(i)
            )
```

**ServiceMonitor：**
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: training-job-metrics
spec:
  selector:
    matchLabels:
      job-type: training
  endpoints:
  - port: metrics
    interval: 15s
```

**7. 成本监控**

**GPU 成本计算：**
```promql
# GPU 小时成本（假设 A100 $3/小时）
sum by (node) (
  count(DCGM_FI_DEV_GPU_UTIL) * 3
) * (time() - job_start_time) / 3600

# GPU 利用率加权成本
sum by (namespace, pod) (
  avg_over_time(DCGM_FI_DEV_GPU_UTIL[1h]) / 100 * gpu_cost_per_hour
)
```

**成本 Dashboard：**
```json
{
  "title": "GPU Cost Analysis",
  "panels": [
    {
      "title": "Total GPU Cost (Last 24h)",
      "targets": [{
        "expr": "sum(rate(gpu_cost_dollars[24h]))"
      }]
    },
    {
      "title": "Cost by Namespace",
      "targets": [{
        "expr": "sum by (namespace) (rate(gpu_cost_dollars[24h]))"
      }]
    },
    {
      "title": "Cost Efficiency (Util vs Cost)",
      "targets": [{
        "expr": "avg(DCGM_FI_DEV_GPU_UTIL) / sum(rate(gpu_cost_dollars[1h]))"
      }]
    }
  ]
}
```

**我的实践经验：**

**监控分层：**
1. **基础层**：DCGM Exporter（硬件指标）
2. **调度层**：kube-state-metrics（Pod GPU 请求/分配）
3. **应用层**：自定义指标（训练吞吐量、准确率）
4. **成本层**：GPU 利用率 + 成本计算

**告警策略：**
- 高温/ECC 错误：立即告警（Critical）
- 低利用率：延迟告警（1 小时后）
- 显存不足：提前告警（OOM 前 10 分钟）

**Dashboard 设计：**
- GPU 集群概览：管理员视图
- 训练任务详情：用户视图  
- 成本分析：FinOps 视图

---

## 五、GPU 故障排查

### 5. GPU 训练任务失败，如何排查？

**参考答案：**

**故障分类与排查流程：**

**故障树：**
```
GPU 训练失败
├── 资源问题
│   ├── GPU OOM
│   ├── GPU 不可用
│   └── 调度失败
├── 软件问题
│   ├── CUDA 错误
│   ├── 驱动不兼容
│   └── 库版本冲突
├── 硬件问题
│   ├── GPU 故障
│   ├── NVLink 错误
│   └── PCIe 错误
└── 网络问题
    ├── NCCL 超时
    └── RDMA 故障
```

**场景 1：GPU OOM (Out of Memory)**

**症状：**
```
CUDA out of memory. Tried to allocate 2.00 GiB (GPU 0; 79.20 GiB total capacity)
RuntimeError: CUDA error: out of memory
```

**排查步骤：**

**1. 检查 GPU 显存使用：**
```bash
# 实时监控
nvidia-smi dmon -s mu -d 1

# 查看详细信息
nvidia-smi

# 或通过 Prometheus
kubectl exec -it <pod> -- nvidia-smi
```

**2. 分析显存占用：**
```python
import torch

# 查看显存分配
print(f"Allocated: {torch.cuda.memory_allocated() / 1024**3:.2f} GB")
print(f"Reserved: {torch.cuda.memory_reserved() / 1024**3:.2f} GB")
print(f"Max allocated: {torch.cuda.max_memory_allocated() / 1024**3:.2f} GB")

# 详细显存统计
print(torch.cuda.memory_summary())

# 重置峰值统计
torch.cuda.reset_peak_memory_stats()
```

**3. 常见原因与解决：**

**原因 1：Batch Size 过大**
```python
# 减小 batch size
# Before
batch_size = 128
# After
batch_size = 64  # 减半

# 或使用梯度累积
accumulation_steps = 2
for i, (data, target) in enumerate(train_loader):
    output = model(data)
    loss = criterion(output, target) / accumulation_steps
    loss.backward()
    
    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()
```

**原因 2：模型过大**
```python
# 使用混合精度训练（节省 50% 显存）
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()

for data, target in train_loader:
    optimizer.zero_grad()
    
    with autocast():  # 自动使用 FP16
        output = model(data)
        loss = criterion(output, target)
    
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

**原因 3：显存碎片化**
```python
# 释放缓存
torch.cuda.empty_cache()

# 或设置环境变量
import os
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:128'
```

**原因 4：显存泄漏**
```python
# 错误示例（显存泄漏）
losses = []
for epoch in range(100):
    for data, target in train_loader:
        loss = train_step(data, target)
        losses.append(loss)  # loss 是 Tensor，会保留计算图

# 正确示例
losses = []
for epoch in range(100):
    for data, target in train_loader:
        loss = train_step(data, target)
        losses.append(loss.item())  # 只保存数值
```

**场景 2：CUDA 错误**

**症状：**
```
RuntimeError: CUDA error: an illegal memory access was encountered
RuntimeError: CUDA error: device-side assert triggered
```

**排查：**

**1. 启用 CUDA 错误检查：**
```bash
# 设置环境变量获取详细错误
export CUDA_LAUNCH_BLOCKING=1
export TORCH_USE_CUDA_DSA=1

# 重新运行
python train.py
```

**2. 常见原因：**

**原因 1：索引越界**
```python
# 错误示例
num_classes = 10
target = torch.randint(0, 11, (32,))  # 0-10，但只有 0-9 合法
loss = F.cross_entropy(output, target)  # CUDA error

# 检查
assert target.max() < num_classes, "Target index out of range"
```

**原因 2：Tensor 维度不匹配**
```python
# 错误示例
x = torch.randn(32, 10).cuda()
y = torch.randn(32, 20).cuda()
z = x + y  # CUDA error: dimension mismatch

# 添加检查
assert x.shape == y.shape, f"Shape mismatch: {x.shape} vs {y.shape}"
```

**场景 3：NCCL 通信失败（分布式训练）**

**症状：**
```
[E ProcessGroupNCCL.cpp:828] NCCL error: unhandled system error
[E ProcessGroupNCCL.cpp:828] NCCL timeout
```

**排查：**

**1. 检查 NCCL 环境：**
```bash
# 启用 NCCL 调试
export NCCL_DEBUG=INFO
export NCCL_DEBUG_SUBSYS=ALL

# 检查 NCCL 版本
python -c "import torch; print(torch.cuda.nccl.version())"

# 测试 NCCL 通信
kubectl exec -it worker-0 -- /opt/nccl-tests/build/all_reduce_perf -b 8 -e 256M -f 2 -g 8
```

**2. 检查网络连接：**
```bash
# Pod 间连通性
kubectl exec -it worker-0 -- ping worker-1

# 检查 IB/RDMA
kubectl exec -it worker-0 -- ibstatus
kubectl exec -it worker-0 -- ibv_devinfo
```

**3. 配置 NCCL：**
```yaml
env:
# 使用正确的网络接口
- name: NCCL_SOCKET_IFNAME
  value: "eth0"

# IB/RDMA 配置
- name: NCCL_IB_DISABLE
  value: "0"
- name: NCCL_IB_HCA
  value: "mlx5_0,mlx5_1"

# 超时设置
- name: NCCL_TIMEOUT
  value: "3600"  # 1 小时

# 调试
- name: NCCL_DEBUG
  value: "INFO"
```

**4. 常见问题：**

**问题 1：防火墙阻塞**
```bash
# 检查端口
netstat -tulpn | grep <port>

# 放行 NCCL 端口
iptables -A INPUT -p tcp --dport 1024:65535 -j ACCEPT
```

**问题 2：NVLink 故障**
```bash
# 检查 NVLink 状态
nvidia-smi nvlink --status

# 检查拓扑
nvidia-smi topo -m
```

**场景 4：GPU 硬件故障**

**症状：**
```
GPU has fallen off the bus
Xid error: 79 (GPU has fallen off the bus)
Xid error: 63 (ECC double bit error)
```

**排查：**

**1. 检查 GPU 状态：**
```bash
# 查看 Xid 错误
nvidia-smi -q | grep -A 5 "Gpu Operation Mode"
dmesg | grep -i nvidia

# 检查 ECC 错误
nvidia-smi --query-gpu=ecc.errors.corrected.volatile.total --format=csv
nvidia-smi --query-gpu=ecc.errors.uncorrected.volatile.total --format=csv
```

**2. 重置 GPU：**
```bash
# 重置单个 GPU
nvidia-smi -r -i 0

# 重置所有 GPU
nvidia-smi -r
```

**3. Drain 节点：**
```bash
# 标记节点不可调度
kubectl cordon gpu-node-1

# 驱逐 Pod
kubectl drain gpu-node-1 --ignore-daemonsets --delete-emptydir-data

# 重启节点或更换 GPU
```

**场景 5：调度失败**

**症状：**
```
Pod 状态：Pending
Events: 0/10 nodes are available: 10 Insufficient nvidia.com/gpu
```

**排查：**

```bash
# 1. 检查集群 GPU 资源
kubectl describe nodes | grep -A 5 "nvidia.com/gpu"

# 2. 检查 Device Plugin
kubectl get pods -n gpu-operator | grep device-plugin
kubectl logs -n gpu-operator <device-plugin-pod>

# 3. 检查 GPU Operator
kubectl get pods -n gpu-operator
kubectl logs -n gpu-operator <gpu-operator-pod>

# 4. 检查节点标签
kubectl get nodes --show-labels | grep nvidia

# 5. 手动注册 GPU（如果 Device Plugin 失败）
kubectl patch node <node-name> -p '{"status":{"capacity":{"nvidia.com/gpu":"8"}}}'
```

**故障排查工具箱：**

**脚本 1：GPU 健康检查**
```bash
#!/bin/bash
# gpu-health-check.sh

echo "=== GPU Device Check ==="
nvidia-smi -L

echo -e "\n=== GPU Utilization ==="
nvidia-smi --query-gpu=index,name,utilization.gpu,memory.used,memory.total --format=csv

echo -e "\n=== GPU Temperature ==="
nvidia-smi --query-gpu=index,temperature.gpu --format=csv

echo -e "\n=== ECC Errors ==="
nvidia-smi --query-gpu=index,ecc.errors.uncorrected.volatile.total --format=csv

echo -e "\n=== Xid Errors ==="
dmesg | grep -i "xid" | tail -20

echo -e "\n=== NVLink Status ==="
nvidia-smi nvlink --status

echo -e "\n=== CUDA/Driver Version ==="
nvidia-smi | grep "Driver Version"
```

**脚本 2：分布式训练诊断**
```bash
#!/bin/bash
# nccl-diag.sh

export NCCL_DEBUG=INFO
export NCCL_DEBUG_SUBSYS=INIT,NET

echo "=== Testing NCCL All-Reduce ==="
mpirun -np 8 -H worker-0:4,worker-1:4 \
  --mca btl_tcp_if_include eth0 \
  /opt/nccl-tests/build/all_reduce_perf -b 8 -e 256M -f 2 -g 4

echo -e "\n=== Network Bandwidth Test ==="
iperf3 -c worker-1 -t 30

echo -e "\n=== IB/RDMA Status ==="
ibstatus
ibv_devinfo
```

**我的实践经验：**

**故障排查优先级：**
1. 先查日志（kubectl logs）
2. 再查事件（kubectl describe pod）
3. 然后查指标（Prometheus）
4. 最后查硬件（nvidia-smi, dmesg）

**常见问题 Top 5：**
1. **GPU OOM**：减小 batch size / 使用混合精度
2. **NCCL 超时**：检查网络 / 增加超时时间
3. **调度失败**：检查 Device Plugin / 清理僵尸 Pod
4. **驱动不兼容**：统一 CUDA/驱动版本
5. **显存泄漏**：检查代码 / 定期重启训练

**预防措施：**
- 训练前检查 GPU 健康状态
- 使用 Checkpoint 定期保存
- 配置 PodDisruptionBudget 避免误删
- 监控 GPU 温度和 ECC 错误
- 设置合理的资源请求和限制

---

## 六、GPU 最佳实践

### 6. GPU 集群运维最佳实践有哪些？

**参考答案：**

**1. 资源规划**

**GPU 节点池划分：**
```yaml
# 训练节点池（A100 80GB）
nodeSelector:
  node-pool: training
  nvidia.com/gpu.product: NVIDIA-A100-SXM4-80GB

# 推理节点池（A10 24GB）
nodeSelector:
  node-pool: inference
  nvidia.com/gpu.product: NVIDIA-A10

# 开发节点池（T4 16GB）
nodeSelector:
  node-pool: dev
  nvidia.com/gpu.product: Tesla-T4
```

**容量规划：**
```
训练负载：70% A100 (80GB)
推理负载：20% A10/L4 (24GB)  
开发测试：10% T4 (16GB)

峰值预留：20% buffer
总 GPU 数 = 预期负载 / 0.8
```

**2. 资源配额管理**

**按团队划分配额：**
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-a-quota
  namespace: team-a
spec:
  hard:
    requests.nvidia.com/gpu: "32"
    limits.nvidia.com/gpu: "32"
    persistentvolumeclaims: "100"
  scopeSelector:
    matchExpressions:
    - operator: In
      scopeName: PriorityClass
      values: ["high-priority", "normal"]
```

**3. 成本优化**

**Spot 实例 + Checkpoint：**
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: training-with-spot
spec:
  template:
    spec:
      nodeSelector:
        node-lifecycle: spot  # Spot 实例
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
      containers:
      - name: training
        image: pytorch/pytorch:2.0.0-cuda11.8
        command:
        - python
        - train.py
        - --checkpoint-dir=/checkpoints
        - --checkpoint-interval=600  # 每 10 分钟保存
        volumeMounts:
        - name: checkpoints
          mountPath: /checkpoints
      volumes:
      - name: checkpoints
        persistentVolumeClaim:
          claimName: training-checkpoints
```

**自动扩缩容：**
```yaml
apiVersion: autoscaling/v1
kind: HorizontalPodAutoscaler
metadata:
  name: inference-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: inference-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Pods
    pods:
      metric:
        name: gpu_utilization
      target:
        type: AverageValue
        averageValue: "70"
```

**4. 安全最佳实践**

**限制容器权限：**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: true  # 只读文件系统
  allowPrivilegeEscalation: false
```

**使用专用 Service Account：**
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: gpu-training-sa
  namespace: training
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: gpu-training-role
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: gpu-training-binding
subjects:
- kind: ServiceAccount
  name: gpu-training-sa
roleRef:
  kind: Role
  name: gpu-training-role
  apiGroup: rbac.authorization.k8s.io
```

**5. 镜像管理**

**使用私有镜像仓库：**
```yaml
imagePullSecrets:
- name: harbor-registry

# 镜像缓存（减少拉取时间）
# 部署 Harbor 作为 Pull-Through Cache
```

**标准化基础镜像：**
```dockerfile
# base-cuda-pytorch.dockerfile
FROM nvidia/cuda:12.1.0-cudnn8-devel-ubuntu22.04

# 安装 Python
RUN apt-get update && apt-get install -y python3.10 python3-pip

# 安装 PyTorch
RUN pip3 install torch==2.1.0 torchvision==0.16.0 \
    --index-url https://download.pytorch.org/whl/cu121

# 安装训练库
RUN pip3 install transformers accelerate deepspeed

# 设置环境变量
ENV CUDA_HOME=/usr/local/cuda
ENV LD_LIBRARY_PATH=$CUDA_HOME/lib64:$LD_LIBRARY_PATH
```

**6. 监控告警**

**关键告警：**
```yaml
# GPU 故障告警
- alert: GPUDeviceError
  expr: DCGM_FI_DEV_XID_ERRORS > 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "GPU hardware error detected"

# 训练停滞告警
- alert: TrainingStalled
  expr: rate(training_samples_total[5m]) == 0
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Training not progressing"

# 低利用率告警
- alert: GPUWasted
  expr: |
    avg_over_time(DCGM_FI_DEV_GPU_UTIL[1h]) < 20
    and
    time() - kube_pod_start_time > 3600
  for: 1h
  labels:
    severity: info
  annotations:
    summary: "GPU underutilized, consider scaling down"
```

**7. 灾难恢复**

**Checkpoint 策略：**
```python
import torch
import os
from datetime import datetime

def save_checkpoint(model, optimizer, epoch, loss, checkpoint_dir="/checkpoints"):
    """保存训练检查点"""
    checkpoint = {
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': loss,
        'timestamp': datetime.now().isoformat()
    }
    
    # 保存最新检查点
    latest_path = os.path.join(checkpoint_dir, "checkpoint_latest.pt")
    torch.save(checkpoint, latest_path)
    
    # 每 10 个 epoch 保存一个持久检查点
    if epoch % 10 == 0:
        epoch_path = os.path.join(checkpoint_dir, f"checkpoint_epoch_{epoch}.pt")
        torch.save(checkpoint, epoch_path)
    
    # 上传到对象存储
    upload_to_s3(latest_path, f"s3://training-checkpoints/{job_id}/")

def load_checkpoint(checkpoint_path, model, optimizer):
    """加载检查点恢复训练"""
    checkpoint = torch.load(checkpoint_path)
    model.load_state_dict(checkpoint['model_state_dict'])
    optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
    start_epoch = checkpoint['epoch'] + 1
    return start_epoch
```

**8. 性能优化**

**数据加载优化：**
```python
from torch.utils.data import DataLoader

# 使用多进程数据加载
train_loader = DataLoader(
    dataset,
    batch_size=256,
    shuffle=True,
    num_workers=8,  # CPU 核心数
    pin_memory=True,  # 加速 CPU->GPU 传输
    prefetch_factor=2,  # 预取 2 个 batch
    persistent_workers=True  # 保持 worker 进程
)
```

**混合精度训练：**
```python
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()

for data, target in train_loader:
    optimizer.zero_grad()
    
    with autocast():  # 自动混合精度
        output = model(data)
        loss = criterion(output, target)
    
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

**9. 故障自愈**

**自动重启（Restart Policy）：**
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: training-job
spec:
  backoffLimit: 3  # 最多重试 3 次
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - name: training
        image: pytorch/pytorch:2.0.0
        # 失败后自动从 checkpoint 恢复
        command:
        - python
        - train.py
        - --resume-from-checkpoint
```

**节点自动修复：**
```yaml
# Node Problem Detector + Draino
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-problem-detector
spec:
  template:
    spec:
      containers:
      - name: node-problem-detector
        image: k8s.gcr.io/node-problem-detector:v0.8.12
        # 检测 GPU 故障并打 Taint
        # Draino 自动 drain 故障节点
```

**10. 文档和培训**

**运维手册：**
```markdown
# GPU 集群运维手册

## 常见问题

### GPU OOM
- 症状：CUDA out of memory
- 原因：batch size 过大
- 解决：减小 batch size 或使用梯度累积

### NCCL 超时
- 症状：NCCL timeout
- 原因：网络故障或配置错误
- 解决：检查网络连接，配置 NCCL_SOCKET_IFNAME

...

## 操作指南

### 如何添加 GPU 节点
1. 节点安装 NVIDIA 驱动
2. 加入 Kubernetes 集群
3. 验证 GPU Device Plugin 运行
4. 测试 GPU 可用性

### 如何更新 GPU 驱动
1. Drain 节点
2. 升级驱动
3. 重启节点
4. 验证并 Uncordon

...
```

**我的实践经验总结：**

**GPU 集群三大核心：**
1. **可靠性**：自动重启 + Checkpoint + 监控告警
2. **效率**：GPU 共享 + 自动扩缩容 + Spot 实例
3. **可观测性**：完善的监控 + 日志 + 追踪

**成本优化实践：**
- 推理：MIG 切分，利用率从 20% → 70%
- 训练：Spot 实例 + Checkpoint，成本降低 60%
- 开发：Time-Slicing 共享，节省 50% GPU

**避坑指南：**
1. 不要在生产环境使用 Time-Slicing（无隔离）
2. NCCL 通信务必配置正确的网络接口
3. 定期检查 ECC 错误，及时更换故障 GPU
4. Checkpoint 必须保存到持久化存储
5. 混合精度训练验证准确率不下降

---

## 致谢

本文档全面介绍了 Kubernetes GPU 调度的核心概念、调度策略、监控运维和故障排查，涵盖了从基础到高级的各个方面。希望对您的 GPU 集群管理和面试准备有所帮助。

**延伸阅读：**
- [NVIDIA GPU Operator 文档](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/)
- [Volcano GPU Scheduling](https://volcano.sh/en/docs/gpu_scheduling/)
- [DCGM Metrics](https://docs.nvidia.com/datacenter/dcgm/)
