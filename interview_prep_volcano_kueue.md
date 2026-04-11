# Volcano 与 Kueue 面试准备文档

深入对比两大 Kubernetes 批处理调度系统：Volcano vs Kueue

---

## 一、Volcano 与 Kueue 概述

### 1. Volcano 和 Kueue 分别是什么？解决了什么问题？

**参考答案：**

**Volcano 简介：**

Volcano 是华为开源的基于 Kubernetes 的批处理调度系统，专为高性能计算（HPC）、AI/ML 训练、大数据等场景设计。

**核心特性：**
- **Gang Scheduling**（组调度）
- **Fair Sharing**（公平共享）
- **队列管理**
- **任务生命周期管理**
- **GPU 拓扑感知调度**
- **作业优先级和抢占**

**Kueue 简介：**

Kueue 是 Kubernetes SIG Scheduling 子项目，专注于资源配额管理和作业队列。

**核心特性：**
- **资源配额（Resource Quotas）**
- **多租户队列**
- **作业排队**
- **公平共享**
- **与原生 Job/CronJob 集成**
- **支持多种工作负载（Job, RayCluster, MPIJob）**

**对比表格：**

| 特性 | Volcano | Kueue | 说明 |
|------|---------|-------|------|
| **定位** | 批处理调度器 | 资源配额管理 | Volcano 更全面，Kueue 更轻量 |
| **Gang Scheduling** | ✅ 核心功能 | ⚠️ 通过 Pod Group 支持 | Volcano 原生支持更强 |
| **GPU 拓扑感知** | ✅ 支持 | ❌ 不支持 | Volcano 针对 AI 优化 |
| **队列管理** | ✅ Queue 资源 | ✅ ClusterQueue | 两者都支持 |
| **公平共享** | ✅ DRF 算法 | ✅ Fair Sharing | 算法不同 |
| **抢占** | ✅ 支持 | ✅ 支持 | Volcano 更灵活 |
| **与原生集成** | ⚠️ 需要 VolcanoJob | ✅ 直接支持 Job | Kueue 更兼容 |
| **学习曲线** | 陡 | 平缓 | Kueue 更简单 |
| **适用场景** | AI训练、HPC | 通用批处理 | - |

**Volcano 解决的问题：**

**问题 1：分布式训练的 Gang Scheduling**

```yaml
# PyTorch DDP 需要 4 个 Worker 同时启动
# 使用原生 Kubernetes：
# - Worker 1 启动，占用 GPU
# - Worker 2-4 资源不足 Pending
# - 训练无法开始，GPU 浪费

# Volcano 解决方案：
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: pytorch-training
spec:
  minAvailable: 4  # 4 个 Pod 同时就绪才启动
  schedulerName: volcano
  tasks:
  - replicas: 4
    name: worker
    template:
      spec:
        containers:
        - name: pytorch
          resources:
            limits:
              nvidia.com/gpu: 2
```

**问题 2：资源公平共享**

```yaml
# 团队 A 和团队 B 共享 GPU 集群
# 原生 Kubernetes：先到先得，团队 A 可能占满所有 GPU

# Volcano Queue + Fair Sharing：
---
apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: team-a-queue
spec:
  weight: 50  # 权重 50%
  capability:
    nvidia.com/gpu: 16
---
apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: team-b-queue
spec:
  weight: 50  # 权重 50%
  capability:
    nvidia.com/gpu: 16
```

**Kueue 解决的问题：**

**问题 1：多租户资源配额管理**

```yaml
# 企业有多个团队，需要限制资源使用

# Kueue ClusterQueue（全局资源池）
apiVersion: kueue.x-k8s.io/v1beta1
kind: ClusterQueue
metadata:
  name: cluster-total
spec:
  namespaceSelector: {}
  resourceGroups:
  - coveredResources: ["cpu", "memory", "nvidia.com/gpu"]
    flavors:
    - name: default-flavor
      resources:
      - name: "cpu"
        nominalQuota: 100
      - name: "memory"
        nominalQuota: 200Gi
      - name: "nvidia.com/gpu"
        nominalQuota: 32

---
# LocalQueue（团队队列）
apiVersion: kueue.x-k8s.io/v1beta1
kind: LocalQueue
metadata:
  name: team-a-queue
  namespace: team-a
spec:
  clusterQueue: cluster-total
```

**问题 2：作业排队和批量调度**

```yaml
# 提交 100 个训练作业
# 原生 Kubernetes：全部立即调度，资源不足全部 Pending

# Kueue：排队管理
apiVersion: batch/v1
kind: Job
metadata:
  name: training-job-1
  labels:
    kueue.x-k8s.io/queue-name: team-a-queue  # 关联队列
spec:
  suspend: true  # 初始挂起，Kueue 决定何时启动
  template:
    spec:
      containers:
      - name: trainer
        resources:
          requests:
            nvidia.com/gpu: 2
```

**我的理解：**

**Volcano：**
- **重型武器**：功能全面，专为 AI/HPC 设计
- **适合**：大规模分布式训练、需要 Gang Scheduling 的场景
- **劣势**：学习曲线陡，需要改造现有作业（VolcanoJob）

**Kueue：**
- **轻量级**：与原生 Kubernetes 集成好
- **适合**：多租户资源管理、批量作业排队
- **劣势**：Gang Scheduling 支持较弱，GPU 拓扑感知缺失

**选择建议：**
- **AI/ML 训练为主** → Volcano
- **多租户批处理** → Kueue
- **混合场景** → Volcano + Kueue 配合使用

---

## 二、Volcano 深入解析

### 2. Volcano 的核心架构是什么？如何使用？

**参考答案：**

**Volcano 架构：**

```
┌─────────────────────────────────────────────┐
│          Kubernetes API Server              │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐ ┌──────▼──────────────────────┐
│  Volcano    │ │   Volcano Scheduler         │
│ Controllers │ │  ┌──────────────────────┐   │
│             │ │  │  Scheduling          │   │
│ ┌─────────┐ │ │  │  Framework           │   │
│ │  Job    │ │ │  └──────────┬───────────┘   │
│ │  Ctrl   │ │ │             │               │
│ └─────────┘ │ │  ┌──────────▼───────────┐   │
│             │ │  │  Plugins:            │   │
│ ┌─────────┐ │ │  │  - gang              │   │
│ │ Queue   │ │ │  │  - drf (Fair Share)  │   │
│ │  Ctrl   │ │ │  │  - priority          │   │
│ └─────────┘ │ │  │  - binpack           │   │
│             │ │  │  - nodeorder         │   │
│ ┌─────────┐ │ │  │  - predicates        │   │
│ │PodGroup │ │ │  │  - proportion        │   │
│ │  Ctrl   │ │ │  │  - tdm               │   │
│ └─────────┘ │ │  └──────────────────────┘   │
└─────────────┘ └─────────────────────────────┘
```

**核心组件：**

**1. Volcano Controllers**

**Job Controller：**
管理 VolcanoJob 生命周期。

```yaml
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: mpi-job
spec:
  minAvailable: 3  # 最少同时运行的 Pod 数
  schedulerName: volcano
  queue: default
  
  # 任务优先级
  priorityClassName: high-priority
  
  # 任务策略
  policies:
  - event: PodEvicted
    action: RestartJob
  - event: TaskCompleted
    action: CompleteJob
  
  # 多角色任务
  tasks:
  - replicas: 1
    name: master
    template:
      spec:
        containers:
        - name: mpimaster
          image: mpioperator/mpi:latest
          command: ["mpirun"]
          resources:
            requests:
              cpu: 2
  
  - replicas: 2
    name: worker
    template:
      spec:
        containers:
        - name: mpiworker
          image: mpioperator/mpi:latest
          resources:
            requests:
              cpu: 4
              nvidia.com/gpu: 1
```

**Queue Controller：**
管理队列和资源配额。

```yaml
apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: ai-training-queue
spec:
  weight: 100  # 队列权重
  
  # 资源配额
  capability:
    cpu: "100"
    memory: "200Gi"
    nvidia.com/gpu: "32"
  
  # 队列状态（Open/Closed）
  state: Open
  
  # 资源回收策略
  reclaimable: true
```

**PodGroup Controller：**
管理 Gang Scheduling 的 Pod 组。

```yaml
apiVersion: scheduling.volcano.sh/v1beta1
kind: PodGroup
metadata:
  name: pytorch-podgroup
spec:
  minMember: 4  # 最少 4 个 Pod
  queue: ai-training-queue
  priorityClassName: high-priority
  
  # 超时时间
  minResources:
    cpu: "8"
    memory: "16Gi"
```

**2. Volcano Scheduler**

**调度插件（Plugins）：**

**Gang Plugin：**
实现 Gang Scheduling，确保所有 Pod 同时调度。

```
┌─────────────────────────────────────┐
│  Gang Scheduling 流程               │
├─────────────────────────────────────┤
│  1. 检查 PodGroup 所有 Pod 是否就绪 │
│  2. 如果不满足 minMember，全部等待  │
│  3. 如果资源充足，同时调度所有 Pod  │
│  4. 如果资源不足，全部 Pending      │
└─────────────────────────────────────┘
```

**DRF (Dominant Resource Fairness) Plugin：**
公平共享资源。

```
场景：
  Job A: 需要 CPU 密集型（10 CPU, 1GB Memory）
  Job B: 需要内存密集型（1 CPU, 10GB Memory）
  
DRF 算法：
  - 计算每个 Job 的主导资源（Dominant Resource）
  - Job A 主导资源：CPU
  - Job B 主导资源：Memory
  - 公平分配，避免单一资源维度的不公平
```

**Priority Plugin：**
基于优先级调度。

```yaml
# 定义 PriorityClass
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000
preemptionPolicy: PreemptLowerPriority

---
# Job 使用
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: important-job
spec:
  priorityClassName: high-priority
  # 可以抢占低优先级 Job
```

**Binpack Plugin：**
紧凑放置，提高资源利用率。

```
目标：将 Pod 尽量放置在少数节点上
好处：
  - 节省节点
  - 提高单节点资源利用率
  - 适合 Spot 实例场景
```

**NodeOrder Plugin：**
节点排序，支持自定义排序策略。

**GPU 拓扑感知：**
```yaml
# 优先选择 NVLink 连接的 GPU
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: gpu-job
spec:
  schedulerName: volcano
  plugins:
    env: []
    svc: []
  tasks:
  - replicas: 1
    template:
      spec:
        containers:
        - name: cuda
          resources:
            limits:
              nvidia.com/gpu: 8
        # Volcano 自动选择同一节点上 NVLink 连接的 8 个 GPU
```

**Volcano 使用示例：**

**示例 1：PyTorch DDP 训练**

```yaml
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: pytorch-ddp
spec:
  minAvailable: 4
  schedulerName: volcano
  queue: ai-training
  
  plugins:
    env: []  # 自动设置环境变量（RANK, WORLD_SIZE等）
    svc: []  # 自动创建 Headless Service
  
  tasks:
  - replicas: 4
    name: worker
    policies:
    - event: TaskCompleted
      action: CompleteJob
    template:
      spec:
        restartPolicy: OnFailure
        containers:
        - name: pytorch
          image: pytorch/pytorch:2.0.0-cuda11.8
          command:
          - sh
          - -c
          - |
            python -m torch.distributed.launch \
              --nproc_per_node=2 \
              --nnodes=4 \
              --node_rank=$VC_TASK_INDEX \
              --master_addr=$VC_TASK_0_HOSTNAME \
              --master_port=23456 \
              train.py
          resources:
            limits:
              nvidia.com/gpu: 2
              memory: 16Gi
              cpu: 8
          env:
          - name: NCCL_DEBUG
            value: INFO
```

**Volcano 自动注入的环境变量：**
```bash
VC_TASK_INDEX=0          # 当前 Task 索引
VC_TASK_0_HOSTNAME=...   # Task 0 的 Hostname（Master）
VC_TASK_1_HOSTNAME=...
VK_TASK_PORT_23456=23456
```

**示例 2：Horovod 分布式训练**

```yaml
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: horovod-training
spec:
  minAvailable: 5  # 1 launcher + 4 workers
  schedulerName: volcano
  queue: default
  
  plugins:
    ssh: []  # 自动配置 SSH
    svc: []
  
  tasks:
  # Launcher
  - replicas: 1
    name: launcher
    policies:
    - event: TaskCompleted
      action: CompleteJob
    template:
      spec:
        containers:
        - name: horovod
          image: horovod/horovod:latest
          command:
          - sh
          - -c
          - |
            horovodrun -np 4 \
              -H ${VC_WORKER_HOSTS} \
              python train.py
  
  # Workers
  - replicas: 4
    name: worker
    template:
      spec:
        containers:
        - name: horovod
          image: horovod/horovod:latest
          resources:
            limits:
              nvidia.com/gpu: 2
```

**示例 3：TensorFlow PS 架构**

```yaml
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: tensorflow-ps
spec:
  minAvailable: 6  # 2 PS + 4 Workers
  schedulerName: volcano
  
  tasks:
  # Parameter Server
  - replicas: 2
    name: ps
    template:
      spec:
        containers:
        - name: tensorflow
          image: tensorflow/tensorflow:2.12.0-gpu
          command: ["python", "train.py"]
          env:
          - name: JOB_NAME
            value: "ps"
          - name: TASK_INDEX
            value: "$VC_TASK_INDEX"
          resources:
            requests:
              cpu: 4
              memory: 8Gi
  
  # Workers
  - replicas: 4
    name: worker
    template:
      spec:
        containers:
        - name: tensorflow
          image: tensorflow/tensorflow:2.12.0-gpu
          command: ["python", "train.py"]
          env:
          - name: JOB_NAME
            value: "worker"
          - name: TASK_INDEX
            value: "$VC_TASK_INDEX"
          resources:
            limits:
              nvidia.com/gpu: 1
            requests:
              cpu: 4
              memory: 16Gi
```

**示例 4：Spark on Kubernetes**

```yaml
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: spark-job
spec:
  minAvailable: 5  # 1 driver + 4 executors
  schedulerName: volcano
  queue: data-processing
  
  tasks:
  - replicas: 1
    name: driver
    template:
      spec:
        containers:
        - name: spark-driver
          image: apache/spark:3.4.0
          command: ["/opt/spark/bin/spark-submit"]
          args:
          - --master
          - k8s://https://kubernetes.default.svc
          - --deploy-mode
          - client
          - --executor-memory
          - 4G
          - --num-executors
          - "4"
          - /app/job.py
  
  - replicas: 4
    name: executor
    template:
      spec:
        containers:
        - name: spark-executor
          image: apache/spark:3.4.0
```

**队列管理：**

```yaml
# 1. 创建多个队列
---
apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: prod-queue
spec:
  weight: 100
  capability:
    nvidia.com/gpu: "24"

---
apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: dev-queue
spec:
  weight: 20
  capability:
    nvidia.com/gpu: "8"

# 2. Job 指定队列
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: my-job
spec:
  queue: prod-queue  # 使用生产队列
```

**监控 Volcano：**

```bash
# 查看 Queue 状态
kubectl get queue

# 查看 Job 状态
kubectl get vcjob

# 查看 PodGroup 状态
kubectl get podgroup

# 查看 Job 详情
kubectl describe vcjob <job-name>

# 查看调度器日志
kubectl logs -n volcano-system -l app=volcano-scheduler
```

**我的实践经验：**

**Volcano 适用场景：**
1. **分布式训练**：PyTorch DDP, Horovod, DeepSpeed
2. **批处理作业**：Spark, Flink
3. **HPC 应用**：MPI 任务
4. **需要 Gang Scheduling** 的任何场景

**踩坑经验：**
1. **minAvailable 设置**：必须 ≤ 总副本数
2. **Queue 配额**：确保 Queue 资源充足
3. **调度器负载**：大规模场景下调度器可能成为瓶颈
4. **与 HPA 冲突**：不要同时使用 HPA 和 Volcano

---

## 三、Kueue 深入解析

### 3. Kueue 的核心架构是什么？如何使用？

**参考答案：**

**Kueue 架构：**

```
┌──────────────────────────────────────┐
│     Kubernetes API Server            │
└────────────┬─────────────────────────┘
             │
    ┌────────▼────────┐
    │  Kueue          │
    │  Controllers    │
    │  ┌───────────┐  │
    │  │ Workload  │  │
    │  │ Controller│  │
    │  └───────────┘  │
    │  ┌───────────┐  │
    │  │  Queue    │  │
    │  │ Controller│  │
    │  └───────────┘  │
    │  ┌───────────┐  │
    │  │  Admission│  │
    │  │  Webhook  │  │
    │  └───────────┘  │
    └─────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼───────┐  ┌──────▼──────┐
│ClusterQueue│  │ LocalQueue  │
│(全局资源池)│  │(命名空间队列)│
└───────────┘  └──────────────┘
```

**核心概念：**

**1. ClusterQueue（集群队列）**

全局资源池，定义可用资源。

```yaml
apiVersion: kueue.x-k8s.io/v1beta1
kind: ClusterQueue
metadata:
  name: cluster-total
spec:
  # 命名空间选择器（哪些命名空间可以使用）
  namespaceSelector: {}
  
  # 资源组
  resourceGroups:
  - coveredResources: ["cpu", "memory", "nvidia.com/gpu"]
    flavors:
    - name: default-flavor
      resources:
      - name: "cpu"
        nominalQuota: 100      # 名义配额
        borrowingLimit: 20     # 可借用配额
      - name: "memory"
        nominalQuota: 200Gi
      - name: "nvidia.com/gpu"
        nominalQuota: 32
        borrowingLimit: 8
  
  # 抢占策略
  preemption:
    reclaimWithinCohort: Any  # 在 Cohort 内抢占
    withinClusterQueue: LowerPriority  # 队列内抢占低优先级
```

**2. LocalQueue（本地队列）**

命名空间级别的队列，关联到 ClusterQueue。

```yaml
apiVersion: kueue.x-k8s.io/v1beta1
kind: LocalQueue
metadata:
  name: team-a-queue
  namespace: team-a
spec:
  clusterQueue: cluster-total
```

**3. Workload（工作负载）**

Kueue 的核心抽象，代表一个作业。

```yaml
# 通常由 Kueue 自动创建
apiVersion: kueue.x-k8s.io/v1beta1
kind: Workload
metadata:
  name: job-sample-workload
  namespace: default
spec:
  queueName: team-a-queue
  podSets:
  - count: 3
    name: main
    template:
      spec:
        containers:
        - name: worker
          image: gcr.io/k8s-staging-perf-tests/sleep:v0.1.0
          resources:
            requests:
              cpu: "1"
              memory: "200Mi"
```

**4. ResourceFlavor（资源类型）**

定义资源的特性（如节点类型）。

```yaml
apiVersion: kueue.x-k8s.io/v1beta1
kind: ResourceFlavor
metadata:
  name: spot-flavor
spec:
  nodeLabels:
    node-lifecycle: spot  # Spot 实例
    instance-type: m5.xlarge
  
  # Node Taints
  nodeTaints:
  - key: spot
    value: "true"
    effect: NoSchedule

---
apiVersion: kueue.x-k8s.io/v1beta1
kind: ResourceFlavor
metadata:
  name: on-demand-flavor
spec:
  nodeLabels:
    node-lifecycle: on-demand
    instance-type: m5.2xlarge
```

**5. Cohort（资源组）**

多个 ClusterQueue 组成 Cohort，可以互相借用资源。

```yaml
apiVersion: kueue.x-k8s.io/v1beta1
kind: ClusterQueue
metadata:
  name: team-a-cq
spec:
  cohort: engineering  # 属于 engineering Cohort
  resourceGroups:
  - coveredResources: ["cpu", "memory"]
    flavors:
    - name: default
      resources:
      - name: cpu
        nominalQuota: 50
        borrowingLimit: 25  # 可以从 Cohort 其他队列借用

---
apiVersion: kueue.x-k8s.io/v1beta1
kind: ClusterQueue
metadata:
  name: team-b-cq
spec:
  cohort: engineering  # 同一个 Cohort
  resourceGroups:
  - coveredResources: ["cpu", "memory"]
    flavors:
    - name: default
      resources:
      - name: cpu
        nominalQuota: 50
        borrowingLimit: 25
```

**Kueue 使用示例：**

**示例 1：批处理 Job**

```yaml
# 1. 创建 LocalQueue
apiVersion: kueue.x-k8s.io/v1beta1
kind: LocalQueue
metadata:
  name: user-queue
  namespace: default
spec:
  clusterQueue: cluster-queue

---
# 2. 创建 Job（添加标签）
apiVersion: batch/v1
kind: Job
metadata:
  name: sample-job
  labels:
    kueue.x-k8s.io/queue-name: user-queue  # 关联队列
spec:
  parallelism: 3
  completions: 3
  suspend: true  # 初始挂起，由 Kueue 控制启动
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: dummy-job
        image: gcr.io/k8s-staging-perf-tests/sleep:v0.1.0
        args: ["30s"]
        resources:
          requests:
            cpu: 1
            memory: 200Mi
```

**Kueue 工作流程：**
```
1. 用户创建 Job（suspend: true）
2. Kueue Admission Webhook 拦截
3. 创建 Workload 对象
4. Workload 进入队列排队
5. 资源可用时，Kueue 修改 Job（suspend: false）
6. Job 开始运行
7. Job 完成后，Kueue 删除 Workload，释放资源
```

**示例 2：优先级和抢占**

```yaml
# 1. 定义 WorkloadPriorityClass
apiVersion: kueue.x-k8s.io/v1beta1
kind: WorkloadPriorityClass
metadata:
  name: high-priority
value: 1000
description: "High priority workloads"

---
apiVersion: kueue.x-k8s.io/v1beta1
kind: WorkloadPriorityClass
metadata:
  name: low-priority
value: 100
description: "Low priority workloads"

---
# 2. Job 使用优先级
apiVersion: batch/v1
kind: Job
metadata:
  name: high-priority-job
  labels:
    kueue.x-k8s.io/queue-name: user-queue
    kueue.x-k8s.io/priority-class: high-priority  # 高优先级
spec:
  suspend: true
  template:
    spec:
      containers:
      - name: work
        resources:
          requests:
            cpu: 10  # 需要大量资源
```

**抢占场景：**
```
当前运行：
  - low-priority-job: 使用 10 CPU

提交：
  - high-priority-job: 需要 10 CPU

Kueue 行为：
  1. 检测到 high-priority-job 无法调度
  2. 检查是否有低优先级作业
  3. 抢占 low-priority-job（暂停或删除）
  4. 调度 high-priority-job
```

**示例 3：多资源类型（Flavor）**

```yaml
# 1. 定义多种资源类型
---
apiVersion: kueue.x-k8s.io/v1beta1
kind: ResourceFlavor
metadata:
  name: on-demand
spec:
  nodeLabels:
    node-lifecycle: on-demand

---
apiVersion: kueue.x-k8s.io/v1beta1
kind: ResourceFlavor
metadata:
  name: spot
spec:
  nodeLabels:
    node-lifecycle: spot

---
# 2. ClusterQueue 配置多 Flavor
apiVersion: kueue.x-k8s.io/v1beta1
kind: ClusterQueue
metadata:
  name: multi-flavor-cq
spec:
  resourceGroups:
  - coveredResources: ["cpu", "memory"]
    flavors:
    - name: spot  # 优先使用 Spot
      resources:
      - name: cpu
        nominalQuota: 100
      - name: memory
        nominalQuota: 200Gi
    - name: on-demand  # Spot 不足时使用 On-Demand
      resources:
      - name: cpu
        nominalQuota: 50
      - name: memory
        nominalQuota: 100Gi
```

**示例 4：与其他 Workload 集成**

**Kueue 支持的 Workload 类型：**
- Job
- CronJob (未来)
- MPIJob (Kubeflow)
- PyTorchJob (Kubeflow)
- TFJob (Kubeflow)
- RayCluster (Ray)
- JobSet (Google)

**PyTorchJob 示例：**
```yaml
apiVersion: kubeflow.org/v1
kind: PyTorchJob
metadata:
  name: pytorch-dist-job
  labels:
    kueue.x-k8s.io/queue-name: ml-queue  # 关联 Kueue 队列
spec:
  pytorchReplicaSpecs:
    Master:
      replicas: 1
      template:
        spec:
          containers:
          - name: pytorch
            image: pytorch/pytorch:2.0.0
            resources:
              requests:
                nvidia.com/gpu: 1
    Worker:
      replicas: 3
      template:
        spec:
          containers:
          - name: pytorch
            image: pytorch/pytorch:2.0.0
            resources:
              requests:
                nvidia.com/gpu: 1
```

**监控 Kueue：**

```bash
# 查看 ClusterQueue
kubectl get clusterqueue

# 查看 LocalQueue
kubectl get localqueue -A

# 查看 Workload
kubectl get workload -A

# 查看队列详情
kubectl describe clusterqueue cluster-total

# 查看 Workload 详情
kubectl describe workload <workload-name>
```

**Prometheus 指标：**
```promql
# 队列中等待的 Workload 数量
kueue_pending_workloads{cluster_queue="cluster-total"}

# 运行中的 Workload 数量
kueue_admitted_workloads_total{cluster_queue="cluster-total"}

# 资源使用情况
kueue_cluster_queue_resource_usage{cluster_queue="cluster-total",resource="cpu"}
```

**我的实践经验：**

**Kueue 适用场景：**
1. **多租户批处理**：严格的资源配额管理
2. **原生 Job 为主**：不想改造现有作业
3. **资源共享**：团队间借用资源
4. **简单部署**：轻量级，易于上手

**与 Volcano 对比：**
| 特性 | Kueue | Volcano |
|------|-------|---------|
| 学习曲线 | ✅ 简单 | ❌ 复杂 |
| Gang Scheduling | ⚠️ 基础支持 | ✅ 完整支持 |
| 原生集成 | ✅ 完美 | ❌ 需要 VolcanoJob |
| GPU 拓扑 | ❌ 不支持 | ✅ 支持 |
| 适合场景 | 通用批处理 | AI/ML 训练 |

**我的推荐：**
- **Start with Kueue**：简单场景先用 Kueue
- **Switch to Volcano**：需要高级调度时切换到 Volcano
- **Hybrid**：Kueue 管理配额 + Volcano 做调度（可能需要定制）

---

## 四、Volcano vs Kueue 实战对比

### 4. 相同场景下 Volcano 和 Kueue 如何实现？

**参考答案：**

**场景 1：分布式训练（4 Worker DDP）**

**Volcano 实现：**
```yaml
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: pytorch-ddp
spec:
  minAvailable: 4  # Gang Scheduling
  schedulerName: volcano
  queue: gpu-queue
  
  tasks:
  - replicas: 4
    name: worker
    template:
      spec:
        containers:
        - name: pytorch
          image: pytorch/pytorch:2.0.0
          command: ["python", "-m", "torch.distributed.launch"]
          args:
          - "--nproc_per_node=2"
          - "--nnodes=4"
          - "--node_rank=$(VC_TASK_INDEX)"
          - "--master_addr=$(VC_TASK_0_HOSTNAME)"
          - "train.py"
          resources:
            limits:
              nvidia.com/gpu: 2
```

**优势：**
- 原生 Gang Scheduling
- 自动注入环境变量
- 自动创建 Service

**Kueue 实现：**
```yaml
# 需要使用 JobSet + Kueue
apiVersion: jobset.x-k8s.io/v1alpha2
kind: JobSet
metadata:
  name: pytorch-ddp
  labels:
    kueue.x-k8s.io/queue-name: gpu-queue
spec:
  replicatedJobs:
  - name: worker
    replicas: 4
    template:
      spec:
        parallelism: 1
        completions: 1
        template:
          spec:
            containers:
            - name: pytorch
              image: pytorch/pytorch:2.0.0
              resources:
                requests:
                  nvidia.com/gpu: 2
  
  # Gang Scheduling via PodGroup
  successPolicy:
    operator: All
```

**优势：**
- 与原生 API 接近
- 配额管理更灵活

**劣势：**
- 需要额外安装 JobSet
- 环境变量需要手动配置

**场景 2：多队列资源管理**

**Volcano 实现：**
```yaml
---
apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: team-a
spec:
  weight: 60
  capability:
    cpu: "100"
    nvidia.com/gpu: "20"

---
apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: team-b
spec:
  weight: 40
  capability:
    cpu: "100"
    nvidia.com/gpu: "12"
```

**Kueue 实现：**
```yaml
---
apiVersion: kueue.x-k8s.io/v1beta1
kind: ClusterQueue
metadata:
  name: team-a-cq
spec:
  cohort: shared
  resourceGroups:
  - coveredResources: ["cpu", "nvidia.com/gpu"]
    flavors:
    - name: default
      resources:
      - name: cpu
        nominalQuota: 100
        borrowingLimit: 50  # 可借用
      - name: nvidia.com/gpu
        nominalQuota: 20
        borrowingLimit: 10

---
apiVersion: kueue.x-k8s.io/v1beta1
kind: ClusterQueue
metadata:
  name: team-b-cq
spec:
  cohort: shared
  resourceGroups:
  - coveredResources: ["cpu", "nvidia.com/gpu"]
    flavors:
    - name: default
      resources:
      - name: cpu
        nominalQuota: 100
        borrowingLimit: 50
      - name: nvidia.com/gpu
        nominalQuota: 12
        borrowingLimit: 10
```

**对比：**
- **Volcano**：固定配额，权重分配
- **Kueue**：名义配额 + 借用上限，更灵活

**场景 3：优先级和抢占**

**Volcano 实现：**
```yaml
# 高优先级 Job
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: prod-job
spec:
  priorityClassName: high-priority
  queue: prod-queue
  # ...

# 低优先级 Job
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: dev-job
spec:
  priorityClassName: low-priority
  queue: dev-queue
  # ...
```

**Kueue 实现：**
```yaml
# 高优先级 Job
apiVersion: batch/v1
kind: Job
metadata:
  name: prod-job
  labels:
    kueue.x-k8s.io/queue-name: prod-queue
    kueue.x-k8s.io/priority-class: high-priority
spec:
  suspend: true
  # ...

# 低优先级 Job
apiVersion: batch/v1
kind: Job
metadata:
  name: dev-job
  labels:
    kueue.x-k8s.io/queue-name: dev-queue
    kueue.x-k8s.io/priority-class: low-priority
spec:
  suspend: true
  # ...
```

**对比：**
- **抢占粒度**：Volcano 更细（Pod 级），Kueue 更粗（Job 级）
- **原生兼容**：Kueue 使用标签，Volcano 使用 CRD

**性能对比：**

| 指标 | Volcano | Kueue | 备注 |
|------|---------|-------|------|
| 调度延迟 | 100-200ms | 50-100ms | Kueue 更轻量 |
| 吞吐量 | 1000 Jobs/min | 2000 Jobs/min | Kueue 更高 |
| 资源占用 | 500Mi Memory | 200Mi Memory | Kueue 更小 |
| Gang 调度效率 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Volcano 更优 |

**我的选择建议：**

```
┌─────────────────────────────────────────┐
│  场景决策树                             │
├─────────────────────────────────────────┤
│                                         │
│  需要 Gang Scheduling?                  │
│    ├─ YES → 分布式训练?                 │
│    │         ├─ YES → Volcano ✅         │
│    │         └─ NO  → Kueue + JobSet    │
│    └─ NO  → 批处理?                     │
│              ├─ YES → Kueue ✅          │
│              └─ NO  → 默认调度器         │
│                                         │
│  需要 GPU 拓扑感知?                     │
│    ├─ YES → Volcano ✅                  │
│    └─ NO  → Kueue                       │
│                                         │
│  团队熟悉度?                            │
│    ├─ 新团队 → Kueue (易学)             │
│    └─ 有经验 → Volcano (强大)           │
└─────────────────────────────────────────┘
```

---

## 五、最佳实践与故障排查

### 5. 生产环境如何选型和运维？

**参考答案：**

**选型建议：**

**Volcano 适合：**
1. AI/ML 训练为主
2. 需要 Gang Scheduling
3. GPU 拓扑感知
4. HPC 工作负载

**Kueue 适合：**
1. 多租户配额管理
2. 通用批处理
3. 原生 Job 为主
4. 轻量级部署

**混合方案：**
```
Kueue (配额管理) + Volcano (Gang 调度)
├─ Kueue 管理队列和配额
├─ Volcano 处理需要 Gang 的任务
└─ 默认调度器处理其他任务
```

**生产环境配置：**

**Volcano 生产配置：**
```yaml
# Volcano Scheduler
resources:
  requests:
    cpu: 1000m
    memory: 2Gi
  limits:
    cpu: 4000m
    memory: 8Gi

replicas: 2  # 高可用

affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchLabels:
          app: volcano-scheduler
      topologyKey: kubernetes.io/hostname
```

**Kueue 生产配置：**
```yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 2Gi

replicas: 2

# 启用 Prometheus metrics
metrics:
  enableClusterQueueResources: true
```

**监控和告警：**

```yaml
# Prometheus Rules
groups:
- name: volcano
  rules:
  - alert: VolcanoQueueFull
    expr: volcano_queue_allocated / volcano_queue_capacity > 0.9
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Queue {{ $labels.queue }} nearly full"
  
  - alert: VolcanoJobPending
    expr: volcano_job_pending_time_seconds > 3600
    labels:
      severity: warning
    annotations:
      summary: "Job {{ $labels.job }} pending for 1 hour"

- name: kueue
  rules:
  - alert: KueueHighPending
    expr: kueue_pending_workloads{cluster_queue="cluster-total"} > 100
    for: 30m
    labels:
      severity: warning
    annotations:
      summary: "High number of pending workloads"
```

**常见问题排查：**

**Volcano 问题：**

**问题 1：Job 一直 Pending**
```bash
# 检查 Queue 配额
kubectl describe queue <queue-name>

# 检查 PodGroup 状态
kubectl get podgroup

# 检查调度器日志
kubectl logs -n volcano-system -l app=volcano-scheduler
```

**问题 2：Gang Scheduling 失败**
```bash
# 检查 minAvailable 设置
kubectl get vcjob <job-name> -o yaml

# 检查资源是否充足
kubectl describe nodes | grep Allocatable
```

**Kueue 问题：**

**问题 1：Workload 不被 admit**
```bash
# 检查 LocalQueue
kubectl describe localqueue <queue-name>

# 检查 ClusterQueue
kubectl describe clusterqueue <cq-name>

# 检查 Workload 状态
kubectl describe workload <workload-name>
```

**问题 2：优先级不生效**
```bash
# 检查 WorkloadPriorityClass
kubectl get workloadpriorityclass

# 检查 Job 标签
kubectl get job <job-name> -o yaml | grep priority
```

**我的生产实践：**

**部署策略：**
```
1. 先部署 Kueue（通用配额管理）
2. 对于 AI/ML 训练任务，额外部署 Volcano
3. 80% 任务使用 Kueue，20% 使用 Volcano
4. 定期评估，逐步迁移
```

**资源配额设计：**
```yaml
# 按部门分配
┌─────────────────────────────┐
│  Total GPU: 100             │
├─────────────────────────────┤
│  AI 部门:    60 GPU (60%)   │
│  数据部门:    30 GPU (30%)  │
│  开发测试:    10 GPU (10%)  │
└─────────────────────────────┘

# 使用 Cohort 共享
AI 部门闲时 → 数据部门可借用
数据部门闲时 → AI 部门可借用
```

---

## 致谢

本文档详细对比了 Volcano 和 Kueue 两大 Kubernetes 批处理调度系统，涵盖架构原理、使用方法、场景选择和最佳实践。希望帮助您在实际项目中做出正确选择。

**延伸阅读：**
- [Volcano 官方文档](https://volcano.sh/en/docs/)
- [Kueue 官方文档](https://kueue.sigs.k8s.io/)
- [Kubernetes Batch Working Group](https://github.com/kubernetes/community/tree/master/wg-batch)
