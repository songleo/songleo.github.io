# Kubernetes 平台工程师面试准备

基于 Kubernetes 技术栈的深度面试问题与参考答案

---

## 一、Kubernetes 架构与核心组件

### 1. 深入解释 Kubernetes 的架构设计，为什么采用这种架构？

**参考答案：**

**架构设计理念：**

Kubernetes 采用声明式 API + 控制循环的架构，核心理念是"期望状态管理"。

**架构图：**
```
┌─────────────────── Control Plane ───────────────────┐
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  API Server  │  │  Scheduler   │  │Controller │ │
│  │              │  │              │  │ Manager   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                 │       │
│         └─────────────────┴─────────────────┘       │
│                           │                         │
│                    ┌──────▼───────┐                 │
│                    │     etcd     │                 │
│                    └──────────────┘                 │
└──────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐ ┌───────▼────────┐ ┌──────▼────────┐
│   Worker Node  │ │   Worker Node  │ │  Worker Node  │
│                │ │                │ │               │
│  ┌──────────┐  │ │  ┌──────────┐  │ │ ┌──────────┐  │
│  │ kubelet  │  │ │  │ kubelet  │  │ │ │ kubelet  │  │
│  └────┬─────┘  │ │  └────┬─────┘  │ │ └────┬─────┘  │
│       │        │ │       │        │ │      │        │
│  ┌────▼─────┐  │ │  ┌────▼─────┐  │ │ ┌────▼─────┐  │
│  │Container │  │ │  │Container │  │ │ │Container │  │
│  │ Runtime  │  │ │  │ Runtime  │  │ │ │ Runtime  │  │
│  └──────────┘  │ │  └──────────┘  │ │ └──────────┘  │
│                │ │                │ │               │
│  ┌──────────┐  │ │  ┌──────────┐  │ │ ┌──────────┐  │
│  │kube-proxy│  │ │  │kube-proxy│  │ │ │kube-proxy│  │
│  └──────────┘  │ │  └──────────┘  │ │ └──────────┘  │
└────────────────┘ └────────────────┘ └───────────────┘
```

**核心组件详解：**

**1. kube-apiserver（API 服务器）：**
- 集群的统一入口，RESTful API
- 职责：
  - 认证（Authentication）：验证用户身份
  - 授权（Authorization）：RBAC、ABAC、Webhook
  - 准入控制（Admission Control）：Mutating/Validating Webhook
  - 与 etcd 交互，持久化数据
  - 提供 Watch 机制供组件监听资源变化
- 无状态，可水平扩展
- 所有组件都通过 API Server 交互，不直接访问 etcd

**2. etcd（分布式存储）：**
- 基于 Raft 协议的强一致性 KV 存储
- 存储集群所有状态数据（Pod、Service、ConfigMap 等）
- 提供 Watch 机制监听数据变化
- 高可用部署（通常 3 或 5 节点）
- 性能关键：需要 SSD、低延迟网络

**3. kube-scheduler（调度器）：**
- 负责 Pod 调度，将 Pod 绑定到节点
- 工作流程：
  1. Watch 未调度的 Pod（spec.nodeName 为空）
  2. 过滤（Filtering）：筛选满足条件的节点
  3. 打分（Scoring）：对节点评分
  4. 选择得分最高的节点
  5. 绑定（Binding）：更新 Pod 的 nodeName
- 支持多调度器、自定义调度器

**4. kube-controller-manager（控制器管理器）：**
- 运行各种控制器（Controller）
- 常见控制器：
  - **Node Controller**：监控节点健康，标记不可用节点
  - **Replication Controller**：维护 Pod 副本数
  - **Endpoints Controller**：填充 Endpoints 对象
  - **ServiceAccount & Token Controller**：为 Namespace 创建默认 SA 和 Token
  - **Deployment Controller**：管理 Deployment 和 ReplicaSet
  - **Job Controller**：运行一次性任务
- 通过 Leader Election 选主（防止脑裂）

**5. cloud-controller-manager（云控制器）：**
- 与云平台交互（AWS、Azure、GCP）
- 负责：
  - Node Controller：检测云中被删除的节点
  - Route Controller：配置云路由
  - Service Controller：创建云负载均衡器
  - Volume Controller：创建和挂载云存储卷

**6. kubelet（节点代理）：**
- 每个节点运行一个 kubelet
- 职责：
  - 监听 API Server，获取调度到本节点的 Pod
  - 与 Container Runtime 交互（CRI），管理容器生命周期
  - 执行健康检查（Liveness/Readiness Probe）
  - 上报节点和 Pod 状态
  - 管理 Volume 挂载
- 通过 CRI（Container Runtime Interface）与容器运行时交互

**7. kube-proxy（网络代理）：**
- 每个节点运行一个 kube-proxy
- 职责：
  - 实现 Service 的虚拟 IP
  - 维护网络规则（iptables/ipvs）
  - 负载均衡（轮询、最少连接等）
- 三种模式：
  - **userspace**：性能差，已弃用
  - **iptables**：默认，规则多时性能下降
  - **ipvs**：推荐，性能好，支持多种负载均衡算法

**8. Container Runtime（容器运行时）：**
- 负责镜像管理和容器运行
- 常见运行时：
  - **containerd**：CNCF 项目，轻量、高性能
  - **CRI-O**：专为 Kubernetes 设计
  - **Docker**（已弃用 dockershim）

**为什么采用这种架构？**

1. **解耦和模块化：**
   - 各组件职责单一，可独立演进
   - API Server 是唯一的数据访问入口，简化设计

2. **声明式 API：**
   - 用户描述期望状态，系统负责实现
   - 幂等性，可重复执行

3. **控制循环（Reconcile Loop）：**
   - 持续监控，自动修正偏差
   - 系统具备自愈能力

4. **可扩展性：**
   - 通过 CRD 扩展 API
   - 通过 Operator 扩展控制逻辑
   - 通过 Admission Webhook 扩展准入控制

5. **高可用：**
   - Control Plane 组件无状态，可水平扩展
   - etcd 集群提供数据可靠性
   - Leader Election 防止脑裂

**我的理解：**
这种架构体现了云原生的核心思想：通过声明式 API 和自动化控制循环，降低系统复杂度，提升可靠性和可扩展性。

### 2. 详细解释 Kubernetes 的调度过程，包括 Predicates 和 Priorities 算法

**参考答案：**

**调度流程：**

```
┌─────────────────────────────────────┐
│ 1. Watch 未调度的 Pod               │
│    (spec.nodeName == "")            │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│ 2. Filtering (Predicates)          │
│    过滤不满足条件的节点             │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│ 3. Scoring (Priorities)            │
│    对候选节点打分                   │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│ 4. Select                          │
│    选择得分最高的节点               │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│ 5. Bind                            │
│    绑定 Pod 到节点                  │
└─────────────────────────────────────┘
```

**阶段 1：Filtering（预选）**

过滤掉不满足条件的节点，常见 Predicate 算法：

1. **PodFitsResources：**
   - 检查节点资源是否充足（CPU、内存）
   - 计算：Allocatable = Capacity - Reserved - Allocated
   - Pod 的 Requests 必须 ≤ Allocatable

2. **PodFitsHost：**
   - 检查 Pod 是否指定了 nodeName
   - 如果指定，只能调度到该节点

3. **PodFitsHostPorts：**
   - 检查 Pod 请求的 hostPort 是否已被占用
   - 同一节点同一端口只能被一个 Pod 使用

4. **PodMatchNodeSelector：**
   - 检查节点标签是否匹配 Pod 的 nodeSelector
```yaml
spec:
  nodeSelector:
    disktype: ssd
```

5. **PodToleratesNodeTaints：**
   - 检查 Pod 是否容忍节点的 Taints
```yaml
spec:
  tolerations:
  - key: "key1"
    operator: "Equal"
    value: "value1"
    effect: "NoSchedule"
```

6. **CheckNodeMemoryPressure：**
   - 检查节点是否有内存压力
   - 如果有，拒绝 BestEffort 级别的 Pod

7. **CheckNodeDiskPressure：**
   - 检查节点是否有磁盘压力

8. **CheckVolumeBinding：**
   - 检查 Pod 的 PVC 是否能在该节点上绑定
   - 考虑 Volume 的拓扑约束

9. **NoDiskConflict：**
   - 检查 Pod 的 Volume 是否与节点已有 Volume 冲突

10. **NoVolumeZoneConflict：**
    - 检查 Volume 的 Zone 是否与节点匹配

11. **MaxPDVolumeCountPredicate：**
    - 检查节点挂载的 PD（Persistent Disk）数量是否超限

12. **CheckNodeCondition：**
    - 检查节点状态（Ready、DiskPressure、MemoryPressure）

13. **PodToleratesNodeNoExecuteTaints：**
    - 检查 Pod 是否容忍 NoExecute Taint

14. **CheckNodePIDPressure：**
    - 检查节点 PID 资源是否充足

**阶段 2：Scoring（优选）**

对剩余节点打分（0-100），常见 Priority 算法：

1. **LeastRequestedPriority：**
   - 优先选择资源使用率低的节点
   - 计算公式：`score = (capacity - requested) / capacity * 10`
   - 资源利用率越低，分数越高

2. **BalancedResourceAllocation：**
   - 优先选择 CPU 和内存使用均衡的节点
   - 计算公式：`score = 10 - abs(cpuFraction - memoryFraction) * 10`
   - 避免某种资源过度使用

3. **NodePreferAvoidPodsPriority：**
   - 避免调度到标记了 `scheduler.alpha.kubernetes.io/preferAvoidPods` 的节点
   - 分数：10（没有标记）或 0（有标记）

4. **TaintTolerationPriority：**
   - 根据 Pod 容忍的 Taint 数量打分
   - 容忍的 Taint 越多，分数越高

5. **SelectorSpreadPriority：**
   - 将相同 Service/RC 的 Pod 分散到不同节点
   - 提高可用性

6. **NodeAffinityPriority：**
   - 根据 Node Affinity 规则打分
```yaml
affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 1
      preference:
        matchExpressions:
        - key: disktype
          operator: In
          values:
          - ssd
```

7. **InterPodAffinityPriority：**
   - 根据 Pod 间亲和性/反亲和性打分
```yaml
affinity:
  podAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - cache
        topologyKey: kubernetes.io/hostname
```

8. **ImageLocalityPriority：**
   - 优先选择已有镜像的节点
   - 减少镜像拉取时间

9. **MostRequestedPriority：**
   - 优先选择资源使用率高的节点（bin packing）
   - 与 LeastRequestedPriority 相反
   - 用于提高资源利用率，适合云环境

**阶段 3：Select（选择）**

- 所有 Priority 函数的分数加权求和
- 选择得分最高的节点
- 如果有多个节点得分相同，随机选择

**阶段 4：Bind（绑定）**

- 更新 Pod 的 `spec.nodeName`
- API Server 持久化到 etcd
- kubelet watch 到 Pod，开始创建容器

**调度器扩展机制：**

1. **Scheduler Extender（调度器扩展）：**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: scheduler-config
data:
  config.yaml: |
    apiVersion: kubescheduler.config.k8s.io/v1
    kind: KubeSchedulerConfiguration
    extenders:
    - urlPrefix: "http://localhost:8888"
      filterVerb: "filter"
      prioritizeVerb: "prioritize"
      weight: 5
```

2. **Scheduler Framework（调度框架）：**

实现 Plugin 接口：
```go
type Plugin interface {
    Name() string
}

type FilterPlugin interface {
    Plugin
    Filter(ctx context.Context, state *CycleState, pod *v1.Pod, nodeInfo *NodeInfo) *Status
}

type ScorePlugin interface {
    Plugin
    Score(ctx context.Context, state *CycleState, pod *v1.Pod, nodeName string) (int64, *Status)
}
```

扩展点：
- **PreFilter**：预处理
- **Filter**：过滤节点
- **PostFilter**：过滤后处理
- **PreScore**：打分前处理
- **Score**：打分
- **Reserve**：预留资源
- **Permit**：允许或拒绝绑定
- **PreBind**：绑定前操作
- **Bind**：绑定
- **PostBind**：绑定后操作

3. **Multiple Schedulers（多调度器）：**

可以运行多个调度器，Pod 通过 `schedulerName` 指定：
```yaml
spec:
  schedulerName: my-scheduler
```

**我的实践经验：**
在 AI 作业调度平台中，实现了自定义调度器，优先将 GPU 作业调度到 GPU 节点，通过 NodeAffinity 和自定义 Priority 函数实现。

### 3. Kubernetes 网络模型详解，Service 的实现原理是什么？

**参考答案：**

**Kubernetes 网络模型要求：**

1. 所有 Pod 可以在不使用 NAT 的情况下与其他 Pod 通信
2. 所有节点可以在不使用 NAT 的情况下与所有 Pod 通信
3. Pod 看到的自己的 IP 与其他 Pod 看到的一致

**网络分层：**

```
┌────────────────────────────────────────┐
│  Service Network (ClusterIP)          │  虚拟网络
│  10.96.0.0/12                          │
└────────────────────────────────────────┘
           │
┌──────────▼─────────────────────────────┐
│  Pod Network (Overlay)                 │  容器网络
│  10.244.0.0/16                         │
└────────────────────────────────────────┘
           │
┌──────────▼─────────────────────────────┐
│  Node Network (Underlay)               │  物理网络
│  192.168.0.0/16                        │
└────────────────────────────────────────┘
```

**Pod 网络实现（CNI）：**

**1. Flannel（简单、稳定）：**

- **VXLAN 模式**：
  - Overlay 网络，封装 Pod 流量
  - 性能损耗约 10-30%
  - 工作原理：
```
Pod A (10.244.1.10) → Node1
    ↓ (封装 VXLAN)
Node1 (192.168.1.1) → Node2 (192.168.1.2)
    ↓ (解封装 VXLAN)
Pod B (10.244.2.10) ← Node2
```

- **Host-Gateway 模式**：
  - 使用节点路由表
  - 性能好，但要求节点在同一子网
  - 路由规则：`10.244.2.0/24 via 192.168.1.2`

**2. Calico（性能好、功能强）：**

- **BGP 模式**：
  - 使用 BGP 协议交换路由
  - 无需封装，性能最好
  - 支持 Network Policy

- **IPIP 模式**：
  - IP-in-IP 封装
  - 跨子网场景

- **VXLAN 模式**：
  - 类似 Flannel VXLAN

**Network Policy 示例**：
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
spec:
  podSelector: {}
  policyTypes:
  - Ingress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-same-namespace
spec:
  podSelector:
    matchLabels:
      app: myapp
  ingress:
  - from:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 8080
```

**3. Cilium（基于 eBPF）：**

- 使用 eBPF 技术，性能极佳
- 支持高级功能：L7 策略、服务网格

**Service 实现原理：**

**Service 类型：**

**1. ClusterIP（默认）：**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP
  clusterIP: 10.96.0.10  # 虚拟 IP（VIP）
```

**工作原理（iptables 模式）：**

1. **Endpoints Controller** 监听 Service 和 Pod，创建 Endpoints 对象：
```yaml
apiVersion: v1
kind: Endpoints
metadata:
  name: my-service
subsets:
- addresses:
  - ip: 10.244.1.10  # Pod IP
  - ip: 10.244.2.20
  ports:
  - port: 8080
```

2. **kube-proxy** 监听 Service 和 Endpoints，创建 iptables 规则：

```bash
# NAT 表
-A PREROUTING -j KUBE-SERVICES

# Service 入口规则
-A KUBE-SERVICES -d 10.96.0.10/32 -p tcp -m tcp --dport 80 -j KUBE-SVC-XXX

# 负载均衡规则（随机）
-A KUBE-SVC-XXX -m statistic --mode random --probability 0.5 -j KUBE-SEP-AAA
-A KUBE-SVC-XXX -j KUBE-SEP-BBB

# 后端 Pod 规则
-A KUBE-SEP-AAA -p tcp -m tcp -j DNAT --to-destination 10.244.1.10:8080
-A KUBE-SEP-BBB -p tcp -m tcp -j DNAT --to-destination 10.244.2.20:8080
```

3. **流量路径：**
```
Client (10.244.1.5) 
  → DNAT (10.96.0.10:80 → 10.244.1.10:8080)
  → Pod (10.244.1.10:8080)
  → Response
  → SNAT (10.244.1.10:8080 → 10.96.0.10:80)
  → Client
```

**IPVS 模式（推荐）：**

1. 使用内核 IPVS 模块，性能更好
2. 支持更多负载均衡算法：
   - **rr**（轮询）
   - **lc**（最少连接）
   - **dh**（目标哈希）
   - **sh**（源哈希）

3. IPVS 规则：
```bash
ipvsadm -ln
TCP  10.96.0.10:80 rr
  -> 10.244.1.10:8080        Masq    1      0          0
  -> 10.244.2.20:8080        Masq    1      0          0
```

**2. NodePort：**
```yaml
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080  # 30000-32767
```

- 在每个节点上开放端口 30080
- 流量：`Client → NodeIP:30080 → Service ClusterIP:80 → Pod`

**3. LoadBalancer：**
```yaml
spec:
  type: LoadBalancer
```

- 依赖云厂商创建外部 LB
- 流量：`External LB → NodePort → ClusterIP → Pod`

**4. ExternalName：**
```yaml
spec:
  type: ExternalName
  externalName: my.database.example.com
```

- 返回 CNAME 记录
- 用于引用外部服务

**Headless Service：**
```yaml
spec:
  clusterIP: None
```

- 不分配 ClusterIP
- DNS 直接返回 Pod IP 列表
- 用于 StatefulSet

**Service DNS：**

CoreDNS 提供服务发现：
```
<service>.<namespace>.svc.cluster.local
```

示例：
```bash
nslookup my-service.default.svc.cluster.local
# 返回：10.96.0.10
```

**我的实践经验：**
生产环境使用 Calico BGP 模式提供高性能网络，kube-proxy 使用 IPVS 模式支持大规模 Service（10000+ Endpoints）。

### 4. 解释 Kubernetes 的存储架构，PV、PVC、StorageClass 的关系是什么？

**参考答案：**

**存储架构：**

```
┌────────────────────────────────────────┐
│  Pod                                   │
│  ┌──────────────────────────────────┐  │
│  │  Container                       │  │
│  │  ┌────────────┐                  │  │
│  │  │ VolumeMount│                  │  │
│  │  └─────┬──────┘                  │  │
│  └────────┼─────────────────────────┘  │
└───────────┼────────────────────────────┘
            │
┌───────────▼────────────────────────────┐
│  Volume (Pod Spec)                     │
│  - emptyDir                            │
│  - hostPath                            │
│  - persistentVolumeClaim (PVC)         │
└───────────┬────────────────────────────┘
            │
┌───────────▼────────────────────────────┐
│  PersistentVolumeClaim (PVC)           │
│  - 用户的存储请求                       │
│  - 指定大小、访问模式、StorageClass     │
└───────────┬────────────────────────────┘
            │ (Binding)
┌───────────▼────────────────────────────┐
│  PersistentVolume (PV)                 │
│  - 管理员预置的存储资源                 │
│  - 或 StorageClass 动态创建             │
└───────────┬────────────────────────────┘
            │
┌───────────▼────────────────────────────┐
│  StorageClass                          │
│  - 存储类型定义                         │
│  - 动态 Provisioner                     │
└───────────┬────────────────────────────┘
            │
┌───────────▼────────────────────────────┐
│  CSI Plugin / Volume Plugin            │
│  - 与存储系统交互                       │
│  - 创建、挂载、卸载卷                   │
└───────────┬────────────────────────────┘
            │
┌───────────▼────────────────────────────┐
│  Storage Backend                       │
│  - NFS, Ceph, AWS EBS, Azure Disk ...  │
└────────────────────────────────────────┘
```

**核心概念：**

**1. PersistentVolume (PV)：**

集群级别的存储资源，由管理员预置或动态创建。

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nfs
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: nfs
  nfs:
    server: nfs-server.example.com
    path: "/exports/data"
```

**PV 属性：**
- **Capacity**：存储容量
- **Access Modes**：
  - **ReadWriteOnce (RWO)**：单节点读写
  - **ReadOnlyMany (ROX)**：多节点只读
  - **ReadWriteMany (RWX)**：多节点读写
- **Reclaim Policy**（回收策略）：
  - **Retain**：保留（手动删除）
  - **Delete**：删除（动态 PV 默认）
  - **Recycle**：回收（已废弃）
- **StorageClassName**：存储类名
- **VolumeMode**：
  - **Filesystem**：文件系统（默认）
  - **Block**：块设备

**2. PersistentVolumeClaim (PVC)：**

用户的存储请求，类似 Pod 请求资源。

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-nfs
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 5Gi
  storageClassName: nfs
```

**PVC 绑定过程：**

1. 用户创建 PVC
2. PV Controller 查找匹配的 PV：
   - StorageClass 匹配
   - Capacity 满足（PV >= PVC）
   - Access Mode 匹配
3. 绑定 PVC 和 PV（1:1 关系）
4. Pod 使用 PVC

**3. StorageClass：**

存储类型定义，支持动态 Provisioning。

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs  # CSI Driver
parameters:
  type: gp3
  iops: "3000"
  encrypted: "true"
allowVolumeExpansion: true
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

**属性：**
- **Provisioner**：存储提供者（CSI Driver）
- **Parameters**：传递给 Provisioner 的参数
- **ReclaimPolicy**：默认回收策略
- **VolumeBindingMode**：
  - **Immediate**：立即绑定（PVC 创建时）
  - **WaitForFirstConsumer**：延迟绑定（Pod 调度时）
- **AllowVolumeExpansion**：是否支持扩容

**动态 Provisioning 流程：**

1. 创建 PVC，指定 StorageClass
2. PV Controller 调用 Provisioner 创建 PV
3. 自动绑定 PVC 和 PV
4. Pod 使用 PVC

**4. CSI (Container Storage Interface)：**

统一的存储接口标准。

**CSI 组件：**
- **CSI Driver**：实现 CSI 接口的插件
- **External Provisioner**：监听 PVC，调用 CreateVolume
- **External Attacher**：处理 VolumeAttachment
- **External Snapshotter**：支持快照
- **Node Plugin**：在节点上挂载卷

**CSI Driver 示例（AWS EBS）：**
```yaml
apiVersion: storage.k8s.io/v1
kind: CSIDriver
metadata:
  name: ebs.csi.aws.com
spec:
  attachRequired: true
  podInfoOnMount: false
  volumeLifecycleModes:
  - Persistent
```

**常见存储类型：**

**1. NFS：**
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nfs
spec:
  nfs:
    server: nfs-server
    path: /exports/data
```

**2. AWS EBS：**
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: aws-ebs
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
```

**3. Ceph RBD：**
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ceph-rbd
provisioner: rbd.csi.ceph.com
parameters:
  pool: kubernetes
  imageFormat: "2"
```

**4. Local Path：**
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-path
provisioner: rancher.io/local-path
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

**Pod 使用 PVC：**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: pvc-nfs
```

**Volume Snapshot（快照）：**

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: my-snapshot
spec:
  volumeSnapshotClassName: csi-snapclass
  source:
    persistentVolumeClaimName: pvc-nfs
```

从快照恢复：
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-from-snapshot
spec:
  dataSource:
    name: my-snapshot
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

**我的实践经验：**
生产环境使用 AWS EBS CSI Driver 提供动态 PV，配置 VolumeBindingMode 为 WaitForFirstConsumer 确保 PV 和 Pod 在同一可用区，避免跨 AZ 挂载失败。

---

## 二、Kubernetes Operator 与扩展开发

### 5. 详细解释 Kubernetes Operator 模式，如何从零开发一个 Operator？

**参考答案：**

**Operator 模式：**

Operator = CRD + Controller，用于自动化管理复杂应用。

**核心理念：**
- 将运维知识代码化
- 通过控制循环自动化管理应用
- 声明式 API，用户描述期望状态，Operator 负责实现

**Operator 成熟度模型：**

1. **Level 1 - Basic Install**：自动化部署
2. **Level 2 - Seamless Upgrades**：无缝升级
3. **Level 3 - Full Lifecycle**：全生命周期管理（备份、恢复）
4. **Level 4 - Deep Insights**：监控、告警、日志
5. **Level 5 - Auto Pilot**：自动调优、自动扩缩容

**开发 Operator 的步骤：**

**步骤 1：设计 API（CRD）**

定义自定义资源，描述应用的期望状态。

示例：管理一个应用（Application）：
```go
// api/v1/application_types.go
package v1

import (
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// ApplicationSpec 定义期望状态
type ApplicationSpec struct {
    // Replicas 副本数
    Replicas int32 `json:"replicas"`
    
    // Image 镜像
    Image string `json:"image"`
    
    // Port 端口
    Port int32 `json:"port"`
    
    // Resources 资源
    Resources *ResourceRequirements `json:"resources,omitempty"`
}

// ApplicationStatus 定义观测状态
type ApplicationStatus struct {
    // ReadyReplicas 就绪副本数
    ReadyReplicas int32 `json:"readyReplicas"`
    
    // Conditions 状态条件
    Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Replicas",type=integer,JSONPath=`.spec.replicas`
// +kubebuilder:printcolumn:name="Ready",type=integer,JSONPath=`.status.readyReplicas`
type Application struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`

    Spec   ApplicationSpec   `json:"spec,omitempty"`
    Status ApplicationStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
type ApplicationList struct {
    metav1.TypeMeta `json:",inline"`
    metav1.ListMeta `json:"metadata,omitempty"`
    Items           []Application `json:"items"`
}

func init() {
    SchemeBuilder.Register(&Application{}, &ApplicationList{})
}
```

**步骤 2：生成代码**

使用 controller-gen 生成代码：
```bash
make generate  # 生成 DeepCopy 方法
make manifests # 生成 CRD YAML
```

生成的 CRD：
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: applications.example.com
spec:
  group: example.com
  names:
    kind: Application
    listKind: ApplicationList
    plural: applications
    singular: application
  scope: Namespaced
  versions:
  - name: v1
    schema:
      openAPIV3Schema:
        properties:
          spec:
            properties:
              replicas:
                format: int32
                type: integer
              image:
                type: string
              port:
                format: int32
                type: integer
    served: true
    storage: true
    subresources:
      status: {}
```

**步骤 3：实现 Controller**

```go
// controllers/application_controller.go
package controllers

import (
    "context"
    
    appsv1 "k8s.io/api/apps/v1"
    corev1 "k8s.io/api/core/v1"
    "k8s.io/apimachinery/pkg/api/errors"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/runtime"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
    "sigs.k8s.io/controller-runtime/pkg/log"
    
    examplev1 "github.com/myorg/myoperator/api/v1"
)

type ApplicationReconciler struct {
    client.Client
    Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=example.com,resources=applications,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=example.com,resources=applications/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core,resources=services,verbs=get;list;watch;create;update;patch;delete

func (r *ApplicationReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    log := log.FromContext(ctx)

    // 1. 获取 Application 对象
    app := &examplev1.Application{}
    if err := r.Get(ctx, req.NamespacedName, app); err != nil {
        if errors.IsNotFound(err) {
            // 对象被删除
            return ctrl.Result{}, nil
        }
        return ctrl.Result{}, err
    }

    // 2. 处理删除（Finalizer）
    finalizerName := "application.example.com/finalizer"
    if app.ObjectMeta.DeletionTimestamp.IsZero() {
        // 对象未被删除，添加 Finalizer
        if !controllerutil.ContainsFinalizer(app, finalizerName) {
            controllerutil.AddFinalizer(app, finalizerName)
            if err := r.Update(ctx, app); err != nil {
                return ctrl.Result{}, err
            }
        }
    } else {
        // 对象正在被删除
        if controllerutil.ContainsFinalizer(app, finalizerName) {
            // 执行清理逻辑
            if err := r.cleanup(ctx, app); err != nil {
                return ctrl.Result{}, err
            }
            
            // 移除 Finalizer
            controllerutil.RemoveFinalizer(app, finalizerName)
            if err := r.Update(ctx, app); err != nil {
                return ctrl.Result{}, err
            }
        }
        return ctrl.Result{}, nil
    }

    // 3. 创建或更新 Deployment
    deployment := r.constructDeployment(app)
    if err := controllerutil.SetControllerReference(app, deployment, r.Scheme); err != nil {
        return ctrl.Result{}, err
    }
    
    foundDeployment := &appsv1.Deployment{}
    err := r.Get(ctx, client.ObjectKeyFromObject(deployment), foundDeployment)
    if err != nil && errors.IsNotFound(err) {
        log.Info("Creating Deployment", "deployment", deployment.Name)
        if err := r.Create(ctx, deployment); err != nil {
            return ctrl.Result{}, err
        }
    } else if err != nil {
        return ctrl.Result{}, err
    } else {
        // 更新 Deployment
        if foundDeployment.Spec.Replicas != &app.Spec.Replicas ||
           foundDeployment.Spec.Template.Spec.Containers[0].Image != app.Spec.Image {
            foundDeployment.Spec.Replicas = &app.Spec.Replicas
            foundDeployment.Spec.Template.Spec.Containers[0].Image = app.Spec.Image
            if err := r.Update(ctx, foundDeployment); err != nil {
                return ctrl.Result{}, err
            }
        }
    }

    // 4. 创建或更新 Service
    service := r.constructService(app)
    if err := controllerutil.SetControllerReference(app, service, r.Scheme); err != nil {
        return ctrl.Result{}, err
    }
    
    foundService := &corev1.Service{}
    err = r.Get(ctx, client.ObjectKeyFromObject(service), foundService)
    if err != nil && errors.IsNotFound(err) {
        log.Info("Creating Service", "service", service.Name)
        if err := r.Create(ctx, service); err != nil {
            return ctrl.Result{}, err
        }
    } else if err != nil {
        return ctrl.Result{}, err
    }

    // 5. 更新 Status
    app.Status.ReadyReplicas = foundDeployment.Status.ReadyReplicas
    if err := r.Status().Update(ctx, app); err != nil {
        return ctrl.Result{}, err
    }

    return ctrl.Result{}, nil
}

func (r *ApplicationReconciler) constructDeployment(app *examplev1.Application) *appsv1.Deployment {
    labels := map[string]string{
        "app": app.Name,
    }
    
    return &appsv1.Deployment{
        ObjectMeta: metav1.ObjectMeta{
            Name:      app.Name,
            Namespace: app.Namespace,
        },
        Spec: appsv1.DeploymentSpec{
            Replicas: &app.Spec.Replicas,
            Selector: &metav1.LabelSelector{
                MatchLabels: labels,
            },
            Template: corev1.PodTemplateSpec{
                ObjectMeta: metav1.ObjectMeta{
                    Labels: labels,
                },
                Spec: corev1.PodSpec{
                    Containers: []corev1.Container{
                        {
                            Name:  "app",
                            Image: app.Spec.Image,
                            Ports: []corev1.ContainerPort{
                                {
                                    ContainerPort: app.Spec.Port,
                                },
                            },
                        },
                    },
                },
            },
        },
    }
}

func (r *ApplicationReconciler) constructService(app *examplev1.Application) *corev1.Service {
    labels := map[string]string{
        "app": app.Name,
    }
    
    return &corev1.Service{
        ObjectMeta: metav1.ObjectMeta{
            Name:      app.Name,
            Namespace: app.Namespace,
        },
        Spec: corev1.ServiceSpec{
            Selector: labels,
            Ports: []corev1.ServicePort{
                {
                    Port:       80,
                    TargetPort: intstr.FromInt(int(app.Spec.Port)),
                },
            },
        },
    }
}

func (r *ApplicationReconciler) cleanup(ctx context.Context, app *examplev1.Application) error {
    // 执行清理逻辑（如删除外部资源）
    log := log.FromContext(ctx)
    log.Info("Cleaning up Application", "name", app.Name)
    return nil
}

func (r *ApplicationReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&examplev1.Application{}).
        Owns(&appsv1.Deployment{}).
        Owns(&corev1.Service{}).
        Complete(r)
}
```

**步骤 4：注册 Controller**

```go
// main.go
package main

import (
    "flag"
    "os"

    "k8s.io/apimachinery/pkg/runtime"
    utilruntime "k8s.io/apimachinery/pkg/util/runtime"
    clientgoscheme "k8s.io/client-go/kubernetes/scheme"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/log/zap"

    examplev1 "github.com/myorg/myoperator/api/v1"
    "github.com/myorg/myoperator/controllers"
)

var (
    scheme   = runtime.NewScheme()
    setupLog = ctrl.Log.WithName("setup")
)

func init() {
    utilruntime.Must(clientgoscheme.AddToScheme(scheme))
    utilruntime.Must(examplev1.AddToScheme(scheme))
}

func main() {
    var metricsAddr string
    var enableLeaderElection bool
    
    flag.StringVar(&metricsAddr, "metrics-bind-address", ":8080", "The address the metric endpoint binds to.")
    flag.BoolVar(&enableLeaderElection, "leader-elect", false, "Enable leader election for controller manager.")
    flag.Parse()

    ctrl.SetLogger(zap.New(zap.UseDevMode(true)))

    mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
        Scheme:             scheme,
        MetricsBindAddress: metricsAddr,
        Port:               9443,
        LeaderElection:     enableLeaderElection,
        LeaderElectionID:   "application.example.com",
    })
    if err != nil {
        setupLog.Error(err, "unable to start manager")
        os.Exit(1)
    }

    if err = (&controllers.ApplicationReconciler{
        Client: mgr.GetClient(),
        Scheme: mgr.GetScheme(),
    }).SetupWithManager(mgr); err != nil {
        setupLog.Error(err, "unable to create controller", "controller", "Application")
        os.Exit(1)
    }

    setupLog.Info("starting manager")
    if err := mgr.Start(ctrl.SetupSignalHandler()); err != nil {
        setupLog.Error(err, "problem running manager")
        os.Exit(1)
    }
}
```

**步骤 5：部署和测试**

1. **部署 CRD：**
```bash
make install  # 安装 CRD
```

2. **运行 Operator：**
```bash
make run  # 本地运行
# 或
make docker-build docker-push IMG=myregistry/myoperator:v1
make deploy IMG=myregistry/myoperator:v1  # 部署到集群
```

3. **创建 CR（Custom Resource）：**
```yaml
apiVersion: example.com/v1
kind: Application
metadata:
  name: my-app
spec:
  replicas: 3
  image: nginx:1.21
  port: 80
```

4. **验证：**
```bash
kubectl get applications
kubectl get deployments
kubectl get services
kubectl describe application my-app
```

**Operator 最佳实践：**

1. **使用 Status 子资源：**
   - 避免 Spec 和 Status 更新冲突
   - 提高性能

2. **实现 Finalizer：**
   - 确保资源删除前执行清理
   - 避免资源泄露

3. **使用 Owner Reference：**
   - 建立资源层级关系
   - 级联删除

4. **处理错误和重试：**
   - 使用 `ctrl.Result{Requeue: true}` 重试
   - 使用指数退避避免频繁重试

5. **幂等性：**
   - Reconcile 逻辑必须幂等
   - 多次调用结果相同

6. **避免无限循环：**
   - 检查 Generation 判断 Spec 是否变化
   - 只在必要时更新 Status

7. **编写单元测试和 E2E 测试：**
```go
func TestReconcile(t *testing.T) {
    // 使用 envtest 测试
}
```

**我的实践经验：**
开发了监控 Operator 管理 Prometheus、ServiceMonitor 等资源，使用 Finalizer 确保删除时清理外部资源，通过 Owner Reference 实现级联删除。

### 6. 如何实现 Admission Webhook？有哪些应用场景？

**参考答案：**

**Admission Webhook 类型：**

1. **MutatingAdmissionWebhook**：修改资源
2. **ValidatingAdmissionWebhook**：验证资源

**执行顺序：**
```
API Request 
  → Authentication 
  → Authorization 
  → MutatingAdmissionWebhook 
  → Schema Validation 
  → ValidatingAdmissionWebhook 
  → Persist to etcd
```

**实现 Mutating Webhook：**

**场景：自动注入 Sidecar 容器**

**步骤 1：实现 Webhook Server**

```go
// webhook/mutating.go
package webhook

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"

    admissionv1 "k8s.io/api/admission/v1"
    corev1 "k8s.io/api/core/v1"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/runtime"
    "k8s.io/apimachinery/pkg/runtime/serializer"
)

var (
    runtimeScheme = runtime.NewScheme()
    codecs        = serializer.NewCodecFactory(runtimeScheme)
    deserializer  = codecs.UniversalDeserializer()
)

type WebhookServer struct {
    sidecarConfig *corev1.Container
}

func (ws *WebhookServer) ServeMutate(w http.ResponseWriter, r *http.Request) {
    // 1. 读取请求
    body, err := ioutil.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "could not read request body", http.StatusBadRequest)
        return
    }

    // 2. 解析 AdmissionReview
    admissionReview := admissionv1.AdmissionReview{}
    if err := json.Unmarshal(body, &admissionReview); err != nil {
        http.Error(w, "could not unmarshal request", http.StatusBadRequest)
        return
    }

    // 3. 解析 Pod 对象
    req := admissionReview.Request
    pod := corev1.Pod{}
    if err := json.Unmarshal(req.Object.Raw, &pod); err != nil {
        http.Error(w, "could not unmarshal pod", http.StatusBadRequest)
        return
    }

    // 4. 检查是否需要注入
    if pod.Annotations == nil || pod.Annotations["sidecar-injector"] != "enabled" {
        // 不需要注入，直接允许
        admissionReview.Response = &admissionv1.AdmissionResponse{
            Allowed: true,
            UID:     req.UID,
        }
    } else {
        // 5. 生成 Patch
        patch := ws.createPatch(&pod)
        patchBytes, _ := json.Marshal(patch)

        // 6. 返回 AdmissionResponse
        admissionReview.Response = &admissionv1.AdmissionResponse{
            Allowed: true,
            UID:     req.UID,
            Patch:   patchBytes,
            PatchType: func() *admissionv1.PatchType {
                pt := admissionv1.PatchTypeJSONPatch
                return &pt
            }(),
        }
    }

    // 7. 返回响应
    resp, err := json.Marshal(admissionReview)
    if err != nil {
        http.Error(w, fmt.Sprintf("could not marshal response: %v", err), http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.Write(resp)
}

func (ws *WebhookServer) createPatch(pod *corev1.Pod) []map[string]interface{} {
    var patch []map[string]interface{}

    // 添加 Sidecar 容器
    patch = append(patch, map[string]interface{}{
        "op":   "add",
        "path": "/spec/containers/-",
        "value": map[string]interface{}{
            "name":  "sidecar",
            "image": "istio/proxyv2:1.12.0",
            "ports": []map[string]interface{}{
                {
                    "containerPort": 15001,
                },
            },
        },
    })

    // 添加 Volume
    patch = append(patch, map[string]interface{}{
        "op":   "add",
        "path": "/spec/volumes/-",
        "value": map[string]interface{}{
            "name": "sidecar-config",
            "configMap": map[string]interface{}{
                "name": "sidecar-config",
            },
        },
    })

    return patch
}

func main() {
    ws := &WebhookServer{}
    
    http.HandleFunc("/mutate", ws.ServeMutate)
    
    server := &http.Server{
        Addr:      ":8443",
        TLSConfig: tlsConfig,  // 需要配置 TLS
    }
    
    server.ListenAndServeTLS("", "")
}
```

**步骤 2：生成证书**

Webhook 必须使用 HTTPS，需要生成证书：

```bash
# 生成 CA
openssl genrsa -out ca.key 2048
openssl req -new -x509 -days 365 -key ca.key -subj "/CN=webhook-ca" -out ca.crt

# 生成 Server 证书
openssl genrsa -out server.key 2048
openssl req -new -key server.key -subj "/CN=webhook-service.default.svc" -out server.csr

# 签名
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 365

# 创建 Secret
kubectl create secret tls webhook-certs \
  --cert=server.crt \
  --key=server.key \
  -n default
```

**步骤 3：部署 Webhook Server**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webhook-server
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: webhook-server
  template:
    metadata:
      labels:
        app: webhook-server
    spec:
      containers:
      - name: webhook
        image: myregistry/webhook-server:v1
        ports:
        - containerPort: 8443
        volumeMounts:
        - name: certs
          mountPath: /certs
          readOnly: true
      volumes:
      - name: certs
        secret:
          secretName: webhook-certs
---
apiVersion: v1
kind: Service
metadata:
  name: webhook-service
  namespace: default
spec:
  selector:
    app: webhook-server
  ports:
  - port: 443
    targetPort: 8443
```

**步骤 4：注册 Webhook**

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  name: sidecar-injector-webhook
webhooks:
- name: sidecar-injector.example.com
  clientConfig:
    service:
      name: webhook-service
      namespace: default
      path: "/mutate"
    caBundle: LS0tLS...  # base64(ca.crt)
  rules:
  - operations: ["CREATE"]
    apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["pods"]
  admissionReviewVersions: ["v1"]
  sideEffects: None
  failurePolicy: Fail  # Fail or Ignore
  namespaceSelector:
    matchLabels:
      sidecar-injection: enabled
```

**实现 Validating Webhook：**

**场景：验证 Deployment 配置**

```go
func (ws *WebhookServer) ServeValidate(w http.ResponseWriter, r *http.Request) {
    // 解析请求
    body, _ := ioutil.ReadAll(r.Body)
    admissionReview := admissionv1.AdmissionReview{}
    json.Unmarshal(body, &admissionReview)

    // 解析 Deployment
    deployment := appsv1.Deployment{}
    json.Unmarshal(admissionReview.Request.Object.Raw, &deployment)

    // 验证逻辑
    allowed := true
    var message string

    // 1. 检查 Replicas
    if *deployment.Spec.Replicas < 2 {
        allowed = false
        message = "Deployment replicas must be >= 2 for high availability"
    }

    // 2. 检查资源限制
    for _, container := range deployment.Spec.Template.Spec.Containers {
        if container.Resources.Limits == nil {
            allowed = false
            message = "Container must have resource limits"
        }
    }

    // 3. 检查健康检查
    for _, container := range deployment.Spec.Template.Spec.Containers {
        if container.LivenessProbe == nil {
            allowed = false
            message = "Container must have liveness probe"
        }
    }

    // 返回响应
    admissionReview.Response = &admissionv1.AdmissionResponse{
        Allowed: allowed,
        UID:     admissionReview.Request.UID,
        Result: &metav1.Status{
            Message: message,
        },
    }

    resp, _ := json.Marshal(admissionReview)
    w.Header().Set("Content-Type", "application/json")
    w.Write(resp)
}
```

**注册 Validating Webhook：**

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: deployment-validator
webhooks:
- name: deployment-validator.example.com
  clientConfig:
    service:
      name: webhook-service
      namespace: default
      path: "/validate"
    caBundle: LS0tLS...
  rules:
  - operations: ["CREATE", "UPDATE"]
    apiGroups: ["apps"]
    apiVersions: ["v1"]
    resources: ["deployments"]
  admissionReviewVersions: ["v1"]
  sideEffects: None
  failurePolicy: Fail
```

**应用场景：**

1. **Sidecar 注入**（Istio）
2. **资源配置验证**（ResourceQuota、安全策略）
3. **镜像扫描和准入**（只允许来自可信仓库的镜像）
4. **自动添加标签和注解**
5. **PodSecurityPolicy 替代**（Pod Security Admission）
6. **自定义准入策略**（OPA Gatekeeper）

**最佳实践：**

1. **设置合理的 failurePolicy**：
   - `Fail`：Webhook 失败时拒绝请求（推荐生产）
   - `Ignore`：Webhook 失败时允许请求（测试）

2. **使用 namespaceSelector/objectSelector**：
   - 避免 Webhook 影响系统命名空间
   - 减少不必要的调用

3. **性能优化**：
   - Webhook 要快速响应（< 100ms）
   - 避免复杂计算和外部调用
   - 使用缓存

4. **高可用**：
   - 部署多个副本
   - 配置 PodDisruptionBudget

5. **测试**：
   - 单元测试
   - E2E 测试（模拟 AdmissionReview）

**我的实践经验：**
实现了 Validating Webhook 验证 ServiceMonitor 配置，确保监控配置正确，避免监控失效。使用 namespaceSelector 限制只在特定命名空间生效。

---

## 三、Kubernetes 高级调度与资源管理

### 7. Kubernetes 的 QoS 类别有哪些？如何影响调度和驱逐？

**参考答案：**

**QoS (Quality of Service) 类别：**

Kubernetes 根据 Pod 的资源配置自动分配 QoS 类别。

**三种 QoS 类别：**

**1. Guaranteed（保证型）：**

**条件：**
- 每个容器都设置了 CPU 和内存的 Requests 和 Limits
- Requests == Limits

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: guaranteed-pod
spec:
  containers:
  - name: app
    image: nginx
    resources:
      requests:
        memory: "1Gi"
        cpu: "1000m"
      limits:
        memory: "1Gi"  # 等于 requests
        cpu: "1000m"   # 等于 requests
```

**特点：**
- 最高优先级
- 最后被驱逐
- 资源保证

**2. Burstable（突发型）：**

**条件：**
- 至少一个容器设置了 Requests 或 Limits
- 不满足 Guaranteed 条件

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: burstable-pod
spec:
  containers:
  - name: app
    image: nginx
    resources:
      requests:
        memory: "512Mi"
        cpu: "500m"
      limits:
        memory: "1Gi"   # 大于 requests
        cpu: "1000m"
```

**特点：**
- 中等优先级
- 可以使用超过 Requests 的资源（burst）
- 节点资源不足时优先驱逐

**3. BestEffort（尽力而为型）：**

**条件：**
- 所有容器都没有设置 Requests 和 Limits

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: besteffort-pod
spec:
  containers:
  - name: app
    image: nginx
    # 没有 resources 配置
```

**特点：**
- 最低优先级
- 最先被驱逐
- 可以使用节点所有剩余资源

**QoS 对调度的影响：**

1. **调度时只考虑 Requests：**
   - Scheduler 检查节点 Allocatable 是否 >= Pod Requests
   - Limits 不影响调度决策

2. **节点资源计算：**
```
Allocatable = Capacity - Reserved - Sum(Pod Requests)
```

**QoS 对驱逐的影响：**

**节点资源不足时的驱逐顺序：**

1. **BestEffort Pods** - 最先驱逐
2. **Burstable Pods** - 超过 Requests 的优先驱逐
3. **Guaranteed Pods** - 最后驱逐（仅在节点内存不足时）

**驱逐信号（Eviction Signals）：**

kubelet 监控节点资源，触发驱逐：

```yaml
# kubelet 配置
evictionHard:
  memory.available: "100Mi"
  nodefs.available: "10%"
  nodefs.inodesFree: "5%"
evictionSoft:
  memory.available: "200Mi"
  nodefs.available: "15%"
evictionSoftGracePeriod:
  memory.available: "1m30s"
  nodefs.available: "2m"
```

**驱逐策略：**

1. **Hard Eviction（硬驱逐）：**
   - 达到阈值立即驱逐
   - 无 GracePeriod

2. **Soft Eviction（软驱逐）：**
   - 达到阈值后等待 GracePeriod
   - 如果仍未恢复则驱逐

**驱逐选择算法：**

```
同 QoS 类别内按以下顺序驱逐：
1. 优先驱逐超过 Requests 最多的 Pod
2. 优先驱逐 Priority 低的 Pod
3. 优先驱逐使用资源最多的 Pod
```

**OOMKilled（内存溢出）：**

当 Pod 使用内存超过 Limits 时：
```
OOM Score = 1000 * (Pod Memory Usage / Node Memory Capacity) + OOM Score Adj

OOM Score Adj:
- Guaranteed: -998
- Burstable: min(max(2, 1000 - (1000 * memoryRequestBytes) / machineMemoryCapacityBytes), 999)
- BestEffort: 1000
```

**实践建议：**

1. **生产环境：**
   - 核心服务使用 Guaranteed
   - 一般服务使用 Burstable（设置合理的 Requests）
   - 避免使用 BestEffort

2. **资源配置：**
```yaml
resources:
  requests:
    memory: "1Gi"    # 平均使用量
    cpu: "500m"      # 平均使用量
  limits:
    memory: "2Gi"    # 峰值使用量（2倍 requests）
    cpu: "2000m"     # CPU 可以不设 limits（允许 burst）
```

3. **监控和调优：**
   - 使用 Prometheus 监控实际资源使用
   - 使用 VPA 自动调整 Requests

**我的实践经验：**
生产集群核心服务配置 Guaranteed QoS，通过 VPA 动态调整 Requests，避免资源浪费。监控节点资源使用率，提前扩容避免驱逐。

### 8. 如何实现 Kubernetes 的自定义调度器？

**参考答案：**

**自定义调度器实现方式：**

**方式 1：Scheduler Framework（推荐）**

通过实现 Plugin 接口扩展调度器。

**示例：GPU 亲和性调度插件**

```go
// pkg/plugins/gpuaffinity/gpuaffinity.go
package gpuaffinity

import (
    "context"
    "fmt"

    v1 "k8s.io/api/core/v1"
    "k8s.io/apimachinery/pkg/runtime"
    "k8s.io/kubernetes/pkg/scheduler/framework"
)

const Name = "GPUAffinity"

type GPUAffinity struct {
    handle framework.Handle
}

var _ framework.FilterPlugin = &GPUAffinity{}
var _ framework.ScorePlugin = &GPUAffinity{}

func New(obj runtime.Object, h framework.Handle) (framework.Plugin, error) {
    return &GPUAffinity{handle: h}, nil
}

func (ga *GPUAffinity) Name() string {
    return Name
}

// Filter 过滤没有 GPU 的节点
func (ga *GPUAffinity) Filter(ctx context.Context, state *framework.CycleState, pod *v1.Pod, nodeInfo *framework.NodeInfo) *framework.Status {
    // 检查 Pod 是否需要 GPU
    needsGPU := false
    for _, container := range pod.Spec.Containers {
        if _, ok := container.Resources.Limits["nvidia.com/gpu"]; ok {
            needsGPU = true
            break
        }
    }

    if !needsGPU {
        // Pod 不需要 GPU，允许调度到任何节点
        return nil
    }

    // 检查节点是否有 GPU
    node := nodeInfo.Node()
    if gpuCount, ok := node.Status.Capacity["nvidia.com/gpu"]; !ok || gpuCount.IsZero() {
        return framework.NewStatus(framework.Unschedulable, "node has no GPU")
    }

    return nil
}

// Score 给有更多可用 GPU 的节点更高分数
func (ga *GPUAffinity) Score(ctx context.Context, state *framework.CycleState, pod *v1.Pod, nodeName string) (int64, *framework.Status) {
    nodeInfo, err := ga.handle.SnapshotSharedLister().NodeInfos().Get(nodeName)
    if err != nil {
        return 0, framework.NewStatus(framework.Error, fmt.Sprintf("getting node %q: %v", nodeName, err))
    }

    node := nodeInfo.Node()
    gpuCapacity := node.Status.Capacity["nvidia.com/gpu"]
    gpuAllocatable := node.Status.Allocatable["nvidia.com/gpu"]

    if gpuCapacity.IsZero() {
        return 0, nil
    }

    // 计算 GPU 使用率
    allocated := gpuCapacity.Value() - gpuAllocatable.Value()
    utilization := float64(allocated) / float64(gpuCapacity.Value())

    // 使用率越低，分数越高
    score := int64((1 - utilization) * 100)

    return score, nil
}

func (ga *GPUAffinity) ScoreExtensions() framework.ScoreExtensions {
    return nil
}
```

**注册插件：**

```go
// pkg/plugins/registry.go
package plugins

import (
    "k8s.io/kubernetes/pkg/scheduler/framework/runtime"
    
    "github.com/myorg/scheduler-plugins/pkg/plugins/gpuaffinity"
)

func NewInTreeRegistry() runtime.Registry {
    return runtime.Registry{
        gpuaffinity.Name: gpuaffinity.New,
    }
}
```

**配置调度器：**

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
- schedulerName: gpu-scheduler
  plugins:
    filter:
      enabled:
      - name: GPUAffinity
    score:
      enabled:
      - name: GPUAffinity
        weight: 10
```

**部署自定义调度器：**

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: gpu-scheduler
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: gpu-scheduler
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:kube-scheduler
subjects:
- kind: ServiceAccount
  name: gpu-scheduler
  namespace: kube-system
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gpu-scheduler
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      component: gpu-scheduler
  template:
    metadata:
      labels:
        component: gpu-scheduler
    spec:
      serviceAccountName: gpu-scheduler
      containers:
      - name: scheduler
        image: myregistry/gpu-scheduler:v1
        command:
        - /scheduler
        - --config=/config/scheduler-config.yaml
        volumeMounts:
        - name: config
          mountPath: /config
      volumes:
      - name: config
        configMap:
          name: gpu-scheduler-config
```

**Pod 使用自定义调度器：**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  schedulerName: gpu-scheduler  # 指定调度器
  containers:
  - name: cuda-app
    image: nvidia/cuda:11.0-base
    resources:
      limits:
        nvidia.com/gpu: 2
```

**方式 2：Scheduler Extender**

通过 HTTP Webhook 扩展调度器。

**实现 Extender Server：**

```go
package main

import (
    "encoding/json"
    "net/http"

    schedulerapi "k8s.io/kube-scheduler/extender/v1"
)

type SchedulerExtender struct{}

func (se *SchedulerExtender) Filter(w http.ResponseWriter, r *http.Request) {
    var args schedulerapi.ExtenderArgs
    json.NewDecoder(r.Body).Decode(&args)

    filteredNodes := []string{}
    failedNodes := make(map[string]string)

    for _, node := range args.Nodes.Items {
        // 自定义过滤逻辑
        if se.canSchedule(&args.Pod, &node) {
            filteredNodes = append(filteredNodes, node.Name)
        } else {
            failedNodes[node.Name] = "custom filter failed"
        }
    }

    result := &schedulerapi.ExtenderFilterResult{
        Nodes: &corev1.NodeList{
            Items: filteredNodes,
        },
        FailedNodes: failedNodes,
    }

    json.NewEncoder(w).Encode(result)
}

func (se *SchedulerExtender) Prioritize(w http.ResponseWriter, r *http.Request) {
    var args schedulerapi.ExtenderArgs
    json.NewDecoder(r.Body).Decode(&args)

    hostPriorities := []schedulerapi.HostPriority{}

    for _, node := range args.Nodes.Items {
        score := se.calculateScore(&args.Pod, &node)
        hostPriorities = append(hostPriorities, schedulerapi.HostPriority{
            Host:  node.Name,
            Score: score,
        })
    }

    json.NewEncoder(w).Encode(hostPriorities)
}

func main() {
    extender := &SchedulerExtender{}
    
    http.HandleFunc("/filter", extender.Filter)
    http.HandleFunc("/prioritize", extender.Prioritize)
    
    http.ListenAndServe(":8888", nil)
}
```

**配置 Extender：**

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
extenders:
- urlPrefix: "http://scheduler-extender:8888"
  filterVerb: "filter"
  prioritizeVerb: "prioritize"
  weight: 5
  nodeCacheCapable: false
  ignorable: false
```

**方式 3：独立调度器**

完全自定义调度逻辑。

```go
package main

import (
    "context"
    
    corev1 "k8s.io/api/core/v1"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/client-go/kubernetes"
    "k8s.io/client-go/rest"
)

type CustomScheduler struct {
    clientset *kubernetes.Clientset
}

func (cs *CustomScheduler) Run() {
    for {
        // 1. 获取未调度的 Pod
        pods, _ := cs.clientset.CoreV1().Pods("").List(context.TODO(), metav1.ListOptions{
            FieldSelector: "spec.nodeName=",
            LabelSelector: "scheduler=custom",
        })

        for _, pod := range pods.Items {
            // 2. 获取节点列表
            nodes, _ := cs.clientset.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})

            // 3. 过滤节点
            feasibleNodes := cs.filter(&pod, nodes.Items)

            // 4. 打分
            scores := cs.score(&pod, feasibleNodes)

            // 5. 选择最佳节点
            bestNode := cs.selectBestNode(scores)

            // 6. 绑定 Pod 到节点
            cs.bind(&pod, bestNode)
        }

        time.Sleep(1 * time.Second)
    }
}

func (cs *CustomScheduler) bind(pod *corev1.Pod, nodeName string) error {
    binding := &corev1.Binding{
        ObjectMeta: metav1.ObjectMeta{
            Name:      pod.Name,
            Namespace: pod.Namespace,
        },
        Target: corev1.ObjectReference{
            Kind: "Node",
            Name: nodeName,
        },
    }

    return cs.clientset.CoreV1().Pods(pod.Namespace).Bind(context.TODO(), binding, metav1.CreateOptions{})
}
```

**自定义调度器应用场景：**

1. **GPU 调度**：优先调度到 GPU 节点
2. **数据本地性**：调度到数据所在节点
3. **拓扑感知**：考虑 NUMA、网络拓扑
4. **成本优化**：优先使用便宜的 Spot 实例
5. **批处理调度**：Gang Scheduling（批量调度）

**我的实践经验：**
在 AI 作业调度平台中实现了自定义调度器，支持 GPU 拓扑感知调度，将需要 GPU 的作业优先调度到 GPU 节点，并考虑 GPU 间的 NVLink 连接。

---

## 四、Kubernetes 故障排查与调试

### 9. 如何排查 Pod 处于 CrashLoopBackOff 状态？

**参考答案：**

**CrashLoopBackOff 原因分析：**

Pod 启动后立即退出，Kubernetes 会重启容器，经过指数退避（1s、2s、4s... 最大 5分钟）后继续重试。

**排查步骤：**

**1. 查看 Pod 状态：**
```bash
kubectl get pod <pod-name> -n <namespace>
kubectl describe pod <pod-name> -n <namespace>
```

查看 Events 部分的错误信息：
```
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  2m                 default-scheduler  Successfully assigned default/myapp to node1
  Normal   Pulled     1m (x5 over 2m)    kubelet            Container image "nginx:1.21" already present
  Normal   Created    1m (x5 over 2m)    kubelet            Created container app
  Normal   Started    1m (x5 over 2m)    kubelet            Started container app
  Warning  BackOff    30s (x10 over 2m)  kubelet            Back-off restarting failed container
```

**2. 查看容器日志：**
```bash
# 查看当前容器日志
kubectl logs <pod-name> -n <namespace>

# 查看之前容器日志（容器已重启）
kubectl logs <pod-name> -n <namespace> --previous

# 多容器 Pod 指定容器名
kubectl logs <pod-name> -c <container-name> --previous

# 实时查看日志
kubectl logs -f <pod-name>
```

**3. 进入容器调试（如果容器能运行足够长时间）：**
```bash
kubectl exec -it <pod-name> -- /bin/bash
# 或
kubectl exec -it <pod-name> -- sh
```

**4. 使用 Debug 容器（Ephemeral Container）：**
```bash
kubectl debug <pod-name> -it --image=busybox --target=<container-name>
```

**常见原因及解决方法：**

**1. 应用程序错误：**
- **现象**：日志显示应用崩溃、panic、uncaught exception
- **解决**：修复应用代码

**2. 配置错误：**
- **现象**：缺少配置文件、环境变量
```yaml
spec:
  containers:
  - name: app
    image: myapp:v1
    env:
    - name: DATABASE_URL
      value: "postgres://..."  # 确保配置正确
```

**3. 健康检查配置不当：**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30  # 应用启动时间不足
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```
- **解决**：增加 initialDelaySeconds，确保应用有足够时间启动

**4. 依赖服务不可用：**
- **现象**：无法连接数据库、缓存等
- **解决**：
  - 检查 Service 是否存在
  - 检查网络策略
  - 使用 init 容器等待依赖就绪：
```yaml
spec:
  initContainers:
  - name: wait-for-db
    image: busybox
    command: ['sh', '-c', 'until nc -z postgres 5432; do sleep 1; done']
```

**5. 权限问题：**
```yaml
spec:
  securityContext:
    runAsUser: 1000
    fsGroup: 1000
  containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
```
- **解决**：调整 securityContext 或文件权限

**6. 资源限制：**
```yaml
resources:
  limits:
    memory: "128Mi"  # 太小，OOMKilled
```
- **解决**：增加资源限制

**7. 命令错误：**
```yaml
spec:
  containers:
  - name: app
    image: nginx
    command: ["/usr/sbin/nginx"]
    args: ["-g", "daemon off;"]  # 必须前台运行
```

**调试技巧：**

**1. 临时禁用健康检查：**
```yaml
# 注释掉 livenessProbe
# livenessProbe:
#   httpGet:
#     path: /health
```

**2. 修改启动命令让容器保持运行：**
```yaml
command: ["/bin/sh"]
args: ["-c", "sleep 3600"]  # 保持运行 1 小时
```

**3. 使用 kubectl run 测试镜像：**
```bash
kubectl run test --image=myapp:v1 --command -- sleep 3600
kubectl exec -it test -- /bin/bash
```

**4. 检查资源限制：**
```bash
kubectl top pod <pod-name>
kubectl top node
```

**5. 查看 kubelet 日志：**
```bash
# 节点上
journalctl -u kubelet -f
```

**我的实践经验：**
遇到 CrashLoopBackOff 时，首先查看 `kubectl logs --previous` 获取崩溃前的日志，大多数情况能直接定位问题。对于复杂问题，使用 ephemeral container 进入 Pod 网络命名空间调试。

### 10. 如何排查 Pod 处于 Pending 状态？

**参考答案：**

**Pending 状态原因：**

Pod 已创建但未被调度到节点，或调度成功但容器未启动。

**排查步骤：**

**1. 查看 Pod 详情：**
```bash
kubectl describe pod <pod-name> -n <namespace>
```

查看 Events 部分的调度失败原因。

**常见原因及解决方法：**

**1. 资源不足：**

**现象：**
```
Events:
  Type     Reason            Message
  ----     ------            -------
  Warning  FailedScheduling  0/3 nodes are available: 3 Insufficient cpu.
```

**解决：**
- 降低 Pod 资源请求
- 扩容集群（增加节点）
- 删除不必要的 Pod 释放资源

```bash
# 查看节点资源
kubectl describe nodes
kubectl top nodes

# 查看 Pod 资源请求
kubectl get pods -A -o custom-columns=NAME:.metadata.name,CPU_REQ:.spec.containers[*].resources.requests.cpu,MEM_REQ:.spec.containers[*].resources.requests.memory
```

**2. 节点亲和性/反亲和性：**

**现象：**
```
Events:
  Warning  FailedScheduling  0/3 nodes are available: 3 node(s) didn't match node selector.
```

**原因：**
```yaml
spec:
  nodeSelector:
    disktype: ssd  # 没有节点有这个标签
```

**解决：**
- 检查节点标签：`kubectl get nodes --show-labels`
- 修改 nodeSelector 或给节点打标签：
```bash
kubectl label nodes <node-name> disktype=ssd
```

**3. Taint 和 Toleration：**

**现象：**
```
Events:
  Warning  FailedScheduling  0/3 nodes are available: 3 node(s) had taint {key: value}, that the pod didn't tolerate.
```

**解决：**
- 添加 Toleration：
```yaml
spec:
  tolerations:
  - key: "key"
    operator: "Equal"
    value: "value"
    effect: "NoSchedule"
```

- 或移除节点 Taint：
```bash
kubectl taint nodes <node-name> key:NoSchedule-
```

**4. PVC 绑定失败：**

**现象：**
```
Events:
  Warning  FailedScheduling  0/3 nodes are available: 3 persistentvolumeclaim "myclaim" not found.
```

**解决：**
```bash
# 检查 PVC 状态
kubectl get pvc -n <namespace>

# 如果 PVC Pending，检查 PV 或 StorageClass
kubectl get pv
kubectl get storageclass
```

**5. Pod 亲和性/反亲和性：**

**现象：**
```
Events:
  Warning  FailedScheduling  0/3 nodes are available: 3 node(s) didn't match pod affinity rules.
```

**解决：**
检查 podAffinity/podAntiAffinity 配置是否过于严格：
```yaml
affinity:
  podAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:  # 改为 preferred
    - labelSelector:
        matchExpressions:
        - key: app
          operator: In
          values:
          - cache
      topologyKey: kubernetes.io/hostname
```

**6. 拓扑约束：**

**现象：**
```
Events:
  Warning  FailedScheduling  0/3 nodes are available: 3 node(s) didn't match pod topology spread constraints.
```

**解决：**
调整 topologySpreadConstraints：
```yaml
topologySpreadConstraints:
- maxSkew: 2  # 增大允许的倾斜度
  topologyKey: zone
  whenUnsatisfiable: ScheduleAnyway  # 改为尽力而为
  labelSelector:
    matchLabels:
      app: myapp
```

**7. 节点 NotReady：**

```bash
kubectl get nodes
# 如果节点 NotReady，检查节点问题
kubectl describe node <node-name>
```

**8. 调度器问题：**

```bash
# 检查调度器是否运行
kubectl get pods -n kube-system | grep scheduler

# 查看调度器日志
kubectl logs -n kube-system kube-scheduler-<node-name>
```

**9. ResourceQuota 限制：**

**现象：**
```
Error creating: pods "mypod" is forbidden: exceeded quota: compute-quota
```

**解决：**
```bash
# 查看 ResourceQuota
kubectl get resourcequota -n <namespace>
kubectl describe resourcequota <quota-name> -n <namespace>

# 删除不必要的 Pod 或增加 quota
```

**10. LimitRange 限制：**

```bash
kubectl get limitrange -n <namespace>
kubectl describe limitrange <limit-name> -n <namespace>
```

**调试命令汇总：**

```bash
# 查看 Pod 调度事件
kubectl get events --sort-by=.metadata.creationTimestamp -n <namespace>

# 查看节点可用资源
kubectl describe nodes | grep -A 5 "Allocated resources"

# 模拟调度（dry-run）
kubectl apply -f pod.yaml --dry-run=server

# 查看调度器日志
kubectl logs -n kube-system -l component=kube-scheduler --tail=100
```

**我的实践经验：**
遇到 Pending 时，90% 的情况是资源不足或 nodeSelector/affinity 配置问题。快速诊断方法是先 `kubectl describe pod` 查看 Events，然后 `kubectl describe nodes` 查看资源。

### 11. 如何排查 Kubernetes 网络问题？

**参考答案：**

**网络问题分类：**

1. **Pod 间无法通信**
2. **Service 无法访问**
3. **Ingress 无法访问**
4. **Pod 无法访问外部**
5. **DNS 解析失败**

**排查工具：**

**1. 网络调试 Pod：**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: netshoot
spec:
  containers:
  - name: netshoot
    image: nicolaka/netshoot
    command: ["/bin/bash"]
    args: ["-c", "sleep 3600"]
```

```bash
kubectl run netshoot --image=nicolaka/netshoot -- sleep 3600
kubectl exec -it netshoot -- bash
```

**2. 基础调试命令：**
```bash
# Ping 测试
ping <ip>

# DNS 解析
nslookup <service-name>
dig <service-name>

# 端口连通性
telnet <ip> <port>
nc -zv <ip> <port>
curl -v http://<service>:<port>

# 路由跟踪
traceroute <ip>

# 网络抓包
tcpdump -i any -nn port 80
```

**排查场景：**

**场景 1：Pod 间无法通信**

**步骤：**

1. **检查 Pod IP：**
```bash
kubectl get pods -o wide
```

2. **从一个 Pod ping 另一个 Pod：**
```bash
kubectl exec <pod1> -- ping <pod2-ip>
```

3. **检查 CNI 插件：**
```bash
# 查看 CNI 配置
cat /etc/cni/net.d/*.conf

# 查看 CNI 日志
journalctl -u kubelet | grep -i cni
```

4. **检查 Network Policy：**
```bash
kubectl get networkpolicy -A
kubectl describe networkpolicy <policy-name> -n <namespace>
```

如果配置了默认 deny-all 策略，需要显式允许：
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-pod-to-pod
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector: {}
  egress:
  - to:
    - podSelector: {}
```

5. **检查节点防火墙/安全组：**
- 云环境：检查安全组规则
- 本地：检查 iptables 规则

**场景 2：Service 无法访问**

**步骤：**

1. **检查 Service：**
```bash
kubectl get svc <service-name> -n <namespace>
kubectl describe svc <service-name> -n <namespace>
```

2. **检查 Endpoints：**
```bash
kubectl get endpoints <service-name> -n <namespace>
```

如果 Endpoints 为空：
- 检查 Pod 的 labels 是否匹配 Service 的 selector
- 检查 Pod 是否 Ready

3. **从 Pod 访问 Service：**
```bash
# ClusterIP
kubectl exec <pod> -- curl <service-name>:<port>

# DNS
kubectl exec <pod> -- nslookup <service-name>.<namespace>.svc.cluster.local
```

4. **检查 kube-proxy：**
```bash
# 查看 kube-proxy 是否运行
kubectl get pods -n kube-system | grep kube-proxy

# 查看 kube-proxy 日志
kubectl logs -n kube-system -l k8s-app=kube-proxy

# 检查 kube-proxy 模式
kubectl logs -n kube-system kube-proxy-<pod> | grep "Using"
```

5. **检查 iptables/ipvs 规则：**

**iptables 模式：**
```bash
# 在节点上
iptables -t nat -L -n | grep <service-name>
```

**ipvs 模式：**
```bash
ipvsadm -ln
```

6. **测试端口转发：**
```bash
kubectl port-forward svc/<service-name> 8080:80
curl localhost:8080
```

**场景 3：DNS 解析失败**

**步骤：**

1. **检查 CoreDNS：**
```bash
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns
```

2. **测试 DNS 解析：**
```bash
kubectl run dnstest --image=busybox:1.28 --rm -it -- nslookup kubernetes.default
```

期望输出：
```
Server:    10.96.0.10
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local

Name:      kubernetes.default
Address 1: 10.96.0.1 kubernetes.default.svc.cluster.local
```

3. **检查 CoreDNS ConfigMap：**
```bash
kubectl get configmap -n kube-system coredns -o yaml
```

4. **检查 Pod DNS 配置：**
```bash
kubectl exec <pod> -- cat /etc/resolv.conf
```

期望：
```
nameserver 10.96.0.10
search <namespace>.svc.cluster.local svc.cluster.local cluster.local
options ndots:5
```

5. **常见 DNS 问题：**

- **CoreDNS 资源不足：**
```bash
kubectl top pods -n kube-system -l k8s-app=kube-dns
```

- **CoreDNS 配置错误：**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns
  namespace: kube-system
data:
  Corefile: |
    .:53 {
        errors
        health {
           lameduck 5s
        }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {
           pods insecure
           fallthrough in-addr.arpa ip6.arpa
           ttl 30
        }
        prometheus :9153
        forward . /etc/resolv.conf {
           max_concurrent 1000
        }
        cache 30
        loop
        reload
        loadbalance
    }
```

**场景 4：Pod 无法访问外部网络**

**步骤：**

1. **测试外部连接：**
```bash
kubectl exec <pod> -- curl -v https://www.google.com
kubectl exec <pod> -- ping 8.8.8.8
```

2. **检查 Network Policy egress 规则：**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-external
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
        - 169.254.169.254/32  # 阻止访问元数据服务
```

3. **检查节点 NAT：**
```bash
# 在节点上
iptables -t nat -L -n | grep MASQUERADE
```

4. **检查 CNI 配置：**
某些 CNI（如 Calico）需要配置 IP Pool 的 natOutgoing：
```yaml
apiVersion: crd.projectcalico.org/v1
kind: IPPool
metadata:
  name: default-ipv4-ippool
spec:
  cidr: 10.244.0.0/16
  natOutgoing: true  # 启用 NAT
```

**场景 5：Ingress 无法访问**

**步骤：**

1. **检查 Ingress 资源：**
```bash
kubectl get ingress -n <namespace>
kubectl describe ingress <ingress-name> -n <namespace>
```

2. **检查 Ingress Controller：**
```bash
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

3. **检查 Ingress 后端 Service：**
```bash
kubectl get svc <backend-service> -n <namespace>
kubectl get endpoints <backend-service> -n <namespace>
```

4. **测试 Ingress Controller Service：**
```bash
# NodePort 方式
curl http://<node-ip>:<nodeport> -H "Host: myapp.example.com"

# LoadBalancer 方式
curl http://<lb-ip> -H "Host: myapp.example.com"
```

5. **查看 NGINX 配置：**
```bash
kubectl exec -n ingress-nginx <ingress-controller-pod> -- cat /etc/nginx/nginx.conf | grep <host>
```

**网络调试最佳实践：**

1. **分层调试：**
   - L2（链路层）→ L3（网络层）→ L4（传输层）→ L7（应用层）

2. **抓包分析：**
```bash
# Pod 内抓包
kubectl exec <pod> -- tcpdump -i any -w /tmp/capture.pcap
kubectl cp <pod>:/tmp/capture.pcap ./capture.pcap

# 节点上抓包
tcpdump -i <interface> -w capture.pcap host <pod-ip>
```

3. **持久化调试 Pod：**
在每个命名空间部署一个调试 Pod，方便随时测试网络。

**我的实践经验：**
网络问题排查遵循"由内到外、由下到上"的原则：先检查 Pod 网络，再检查 Service，最后检查 Ingress。使用 netshoot 镜像极大提高了调试效率，包含了所有常用网络工具。

---

## 五、Kubernetes 最佳实践与性能优化

### 12. Kubernetes 生产环境的最佳实践有哪些？

**参考答案：**

**1. 资源管理最佳实践**

**设置合理的 Requests 和 Limits：**
```yaml
resources:
  requests:
    memory: "1Gi"    # 基于实际使用的 P50
    cpu: "500m"      # 基于实际使用的 P50
  limits:
    memory: "2Gi"    # 基于实际使用的 P95-P99
    cpu: "2000m"     # 可选，避免 CPU throttling
```

**使用 ResourceQuota 限制命名空间资源：**
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: production
spec:
  hard:
    requests.cpu: "100"
    requests.memory: "200Gi"
    limits.cpu: "200"
    limits.memory: "400Gi"
    persistentvolumeclaims: "20"
    pods: "50"
```

**使用 LimitRange 设置默认值：**
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: production
spec:
  limits:
  - default:
      memory: "512Mi"
      cpu: "500m"
    defaultRequest:
      memory: "256Mi"
      cpu: "250m"
    max:
      memory: "4Gi"
      cpu: "4"
    min:
      memory: "128Mi"
      cpu: "100m"
    type: Container
```

**2. 高可用性最佳实践**

**多副本部署：**
```yaml
spec:
  replicas: 3  # 至少 3 个副本
```

**配置 PodDisruptionBudget：**
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp-pdb
spec:
  minAvailable: 2
  # 或 maxUnavailable: 1
  selector:
    matchLabels:
      app: myapp
```

**使用 Pod 反亲和性分散部署：**
```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - myapp
        topologyKey: kubernetes.io/hostname
```

**跨可用区部署：**
```yaml
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector:
    matchLabels:
      app: myapp
```

**配置健康检查：**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

startupProbe:  # 慢启动应用
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 0
  periodSeconds: 10
  failureThreshold: 30  # 最多等待 5 分钟
```

**3. 安全最佳实践**

**使用 RBAC 最小权限原则：**
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-role
  namespace: production
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
```

**配置 Pod Security Standards：**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

**设置 SecurityContext：**
```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
```

**使用 Network Policy 隔离：**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app-network-policy
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
  - to:  # 允许 DNS
    - namespaceSelector:
        matchLabels:
          name: kube-system
    - podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
```

**使用 Secret 管理敏感信息：**
```yaml
# 使用 External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: app-secrets
  data:
  - secretKey: password
    remoteRef:
      key: prod/app/db-password
```

**镜像安全：**
```yaml
spec:
  containers:
  - name: app
    image: myregistry.io/myapp:v1.2.3  # 使用 digest 更安全
    # image: myregistry.io/myapp@sha256:abc123...
    imagePullPolicy: Always
```

**4. 配置管理最佳实践**

**分离配置和代码：**
```yaml
# ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  app.properties: |
    server.port=8080
    log.level=INFO

---
# 挂载配置
spec:
  containers:
  - name: app
    volumeMounts:
    - name: config
      mountPath: /config
  volumes:
  - name: config
    configMap:
      name: app-config
```

**使用 Kustomize 管理多环境：**
```bash
kustomize/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   └── patch.yaml
│   ├── staging/
│   └── production/
```

**5. 可观测性最佳实践**

**日志收集：**
- 使用 stdout/stderr 输出日志
- 部署日志收集器（Fluent Bit、Fluentd）
- 集中式日志存储（Elasticsearch、Splunk）

**监控：**
```yaml
# Prometheus ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: app-metrics
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
  - port: metrics
    interval: 30s
```

**追踪：**
- 使用 OpenTelemetry 实现分布式追踪
- 集成 Jaeger 或 Zipkin

**6. 更新策略最佳实践**

**滚动更新：**
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 最多超出期望副本数
      maxUnavailable: 0  # 始终保持可用
```

**金丝雀发布：**
```yaml
# 使用 Flagger 或 ArgoCD Rollouts
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: myapp
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  service:
    port: 8080
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
```

**7. 备份和灾难恢复**

**使用 Velero 备份：**
```bash
# 备份整个命名空间
velero backup create myapp-backup --include-namespaces production

# 定期备份
velero schedule create daily-backup --schedule="0 2 * * *" --include-namespaces production
```

**8. 成本优化**

**使用 Spot/Preemptible 实例：**
```yaml
nodeSelector:
  node.kubernetes.io/instance-type: spot

tolerations:
- key: node.kubernetes.io/instance-type
  operator: Equal
  value: spot
  effect: NoSchedule
```

**使用 VPA 自动调整资源：**
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: myapp-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  updatePolicy:
    updateMode: "Auto"
```

**使用 HPA 自动扩缩容：**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

**我的实践经验：**
生产环境遵循"安全第一、稳定第二、成本第三"的原则。核心服务配置 PDB、多副本、跨 AZ 部署确保高可用；使用 RBAC、Network Policy、Pod Security 实现纵深防御；通过 HPA/VPA 优化资源使用降低成本。

### 13. 如何优化 Kubernetes 集群性能？

**参考答案：**

**1. API Server 优化**

**水平扩展：**
```yaml
# 部署多个 API Server 实例
replicas: 3

# 负载均衡器配置
```

**优化参数：**
```bash
kube-apiserver \
  --max-requests-inflight=400 \          # 增加并发请求数
  --max-mutating-requests-inflight=200 \ # 增加写请求并发数
  --watch-cache-sizes=pods#1000,nodes#100 # 增加 watch cache
```

**使用 Priority and Fairness：**
```yaml
apiVersion: flowcontrol.apiserver.k8s.io/v1beta2
kind: FlowSchema
metadata:
  name: high-priority-apps
spec:
  priorityLevelConfiguration:
    name: high-priority
  matchingPrecedence: 100
  distinguisherMethod:
    type: ByUser
  rules:
  - subjects:
    - kind: ServiceAccount
      serviceAccount:
        name: app-sa
        namespace: production
    resourceRules:
    - verbs: ["*"]
      apiGroups: ["*"]
      resources: ["*"]
```

**2. etcd 优化**

**硬件要求：**
- SSD 存储（IOPS > 3000）
- 低延迟网络（< 1ms）
- 独立部署（不与其他组件混部）

**参数优化：**
```bash
etcd \
  --snapshot-count=10000 \           # 增加快照间隔
  --heartbeat-interval=100 \         # 心跳间隔
  --election-timeout=1000 \          # 选举超时
  --quota-backend-bytes=8589934592   # 8GB 存储配额
```

**定期压缩和碎片整理：**
```bash
# 查看 etcd 状态
etcdctl endpoint status --write-out=table

# 压缩历史版本
etcdctl compact $(etcdctl endpoint status --write-out="json" | jq -r '.[0].Status.header.revision')

# 碎片整理
etcdctl defrag --cluster

# 检查告警
etcdctl alarm list
```

**3. kubelet 优化**

**优化参数：**
```yaml
# kubelet 配置
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
maxPods: 110  # 默认 110，根据节点资源调整
podsPerCore: 10
imageGCHighThresholdPercent: 85
imageGCLowThresholdPercent: 80
evictionHard:
  memory.available: "100Mi"
  nodefs.available: "10%"
evictionSoft:
  memory.available: "200Mi"
evictionSoftGracePeriod:
  memory.available: "1m30s"
systemReserved:
  cpu: "1000m"
  memory: "2Gi"
kubeReserved:
  cpu: "500m"
  memory: "1Gi"
```

**4. kube-proxy 优化**

**使用 IPVS 模式：**
```yaml
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
mode: "ipvs"
ipvs:
  scheduler: "rr"  # rr, lc, dh, sh
  syncPeriod: 30s
  minSyncPeriod: 2s
```

**对比：**
| 模式      | 性能 | 规则数限制 | 负载均衡算法   |
|----------|------|----------|--------------|
| iptables | 中   | 5000-10k | 随机         |
| ipvs     | 高   | 100k+    | rr/lc/dh/sh  |

**5. 调度器优化**

**优化参数：**
```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
- schedulerName: default-scheduler
  percentageOfNodesToScore: 50  # 只对 50% 节点打分（大集群）
```

**6. DNS 优化**

**CoreDNS 优化：**
```yaml
# 增加副本数
kubectl scale deployment coredns -n kube-system --replicas=5

# 配置资源
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "1000m"
    memory: "512Mi"

# 优化配置
Corefile: |
  .:53 {
      errors
      health
      ready
      kubernetes cluster.local in-addr.arpa ip6.arpa {
         pods insecure
         fallthrough in-addr.arpa ip6.arpa
         ttl 30
      }
      prometheus :9153
      forward . /etc/resolv.conf {
         max_concurrent 1000
      }
      cache 300  # 增加缓存时间
      reload
      loadbalance round_robin
  }
```

**NodeLocal DNSCache：**
```yaml
# 在每个节点部署 DNS 缓存
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-local-dns
spec:
  template:
    spec:
      containers:
      - name: node-cache
        image: k8s.gcr.io/dns/k8s-dns-node-cache:1.21.1
```

**7. 容器运行时优化**

**使用 containerd：**
- 比 Docker 更轻量
- 减少资源开销
- 更快的镜像拉取

**8. 网络优化**

**选择高性能 CNI：**
- **Calico（BGP 模式）**：性能好，支持 Network Policy
- **Cilium（eBPF）**：极致性能
- **Flannel（host-gw）**：简单快速

**优化 MTU：**
```bash
# 根据网络环境调整 MTU
# VXLAN: MTU = 1450
# 直接路由: MTU = 1500
```

**9. 存储优化**

**使用高性能存储：**
- SSD 或 NVMe
- 高 IOPS 云盘

**使用本地存储（性能敏感应用）：**
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
```

**10. 应用层优化**

**使用 Readiness Gate：**
```yaml
spec:
  readinessGates:
  - conditionType: "www.example.com/feature-1"
```

**优化镜像：**
- 使用多阶段构建减小镜像大小
- 使用镜像缓存加速拉取
- 使用私有镜像仓库

**使用本地镜像缓存：**
```yaml
# 部署 Docker Registry 作为 Pull-Through Cache
```

**11. 监控和调优**

**关键指标：**
```promql
# API Server 延迟
histogram_quantile(0.99, sum(rate(apiserver_request_duration_seconds_bucket[5m])) by (le))

# etcd 延迟
histogram_quantile(0.99, sum(rate(etcd_disk_backend_commit_duration_seconds_bucket[5m])) by (le))

# Scheduler 延迟
histogram_quantile(0.99, sum(rate(scheduler_scheduling_duration_seconds_bucket[5m])) by (le))

# kubelet Pod 启动时间
histogram_quantile(0.99, sum(rate(kubelet_pod_start_duration_seconds_bucket[5m])) by (le))
```

**性能测试：**
```bash
# 使用 kube-burner 压测
kube-burner init -c config.yaml

# 使用 kubectl 压测
kubectl run --generator=run-pod/v1 perf-test --image=nginx --replicas=1000
```

**我的实践经验：**
大规模集群（1000+ 节点）性能优化重点：
1. etcd 使用 SSD + 定期压缩和碎片整理
2. kube-proxy 使用 IPVS 模式
3. CoreDNS 水平扩展 + NodeLocal DNSCache
4. 调度器降低 percentageOfNodesToScore
5. 网络使用 Calico BGP 或 Cilium eBPF

---

## 六、场景设计与系统架构题

### 14. 如何设计一个多租户 Kubernetes 平台？

**参考答案：**

**多租户隔离级别：**

1. **Soft Multi-Tenancy（软隔离）**：租户间信任，主要通过 RBAC 隔离
2. **Hard Multi-Tenancy（硬隔离）**：租户间不信任，需要强隔离

**设计方案：**

**方案 1：Namespace 级别隔离（软隔离）**

**架构：**
```
┌───────────────────────────────────────┐
│         Kubernetes Cluster            │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ Namespace:   │  │ Namespace:   │   │
│  │  tenant-a    │  │  tenant-b    │   │
│  │              │  │              │   │
│  │ ┌─────────┐  │  │ ┌─────────┐  │   │
│  │ │  Pods   │  │  │ │  Pods   │  │   │
│  │ └─────────┘  │  │ └─────────┘  │   │
│  └──────────────┘  └──────────────┘   │
└───────────────────────────────────────┘
```

**实现：**

**1. 命名空间隔离：**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-a
  labels:
    tenant: tenant-a
```

**2. ResourceQuota 限制资源：**
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-a-quota
  namespace: tenant-a
spec:
  hard:
    requests.cpu: "50"
    requests.memory: "100Gi"
    limits.cpu: "100"
    limits.memory: "200Gi"
    pods: "100"
    services: "20"
    persistentvolumeclaims: "50"
    requests.storage: "500Gi"
```

**3. NetworkPolicy 网络隔离：**
```yaml
# 默认拒绝所有流量
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

---
# 允许同命名空间内通信
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector: {}
  egress:
  - to:
    - podSelector: {}
  - to:  # 允许 DNS
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
```

**4. RBAC 权限隔离：**
```yaml
# 租户管理员角色
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tenant-admin
  namespace: tenant-a
rules:
- apiGroups: ["", "apps", "batch"]
  resources: ["*"]
  verbs: ["*"]

---
# 绑定到用户
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-a-admin-binding
  namespace: tenant-a
subjects:
- kind: User
  name: admin@tenant-a.com
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: tenant-admin
  apiGroup: rbac.authorization.k8s.io

---
# 限制跨命名空间权限
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: tenant-user
rules:
- apiGroups: [""]
  resources: ["namespaces"]
  verbs: ["get", "list"]
  resourceNames: ["tenant-a"]  # 只能访问自己的命名空间
```

**5. Pod Security 强制安全策略：**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-a
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

**6. LimitRange 设置默认值：**
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: tenant-a-limits
  namespace: tenant-a
spec:
  limits:
  - max:
      memory: "4Gi"
      cpu: "4"
    min:
      memory: "128Mi"
      cpu: "100m"
    default:
      memory: "512Mi"
      cpu: "500m"
    defaultRequest:
      memory: "256Mi"
      cpu: "250m"
    type: Container
```

**方案 2：Virtual Cluster（虚拟集群，强隔离）**

**使用 vcluster：**
```yaml
# 每个租户一个虚拟集群
apiVersion: v1
kind: Namespace
metadata:
  name: vcluster-tenant-a

---
# 部署 vcluster
helm install tenant-a vcluster \
  --namespace vcluster-tenant-a \
  --set syncer.extraArgs[0]=--out-kube-config-server=https://tenant-a.example.com
```

**优势：**
- 完全的 API 隔离
- 每个租户独立的 CRD
- 更好的安全性

**方案 3：Cluster-per-Tenant（每租户一个集群，最强隔离）**

**架构：**
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Cluster    │  │  Cluster    │  │  Cluster    │
│  Tenant A   │  │  Tenant B   │  │  Tenant C   │
└─────────────┘  └─────────────┘  └─────────────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
              ┌─────────▼─────────┐
              │  Management        │
              │  Plane             │
              │  (ACM/Rancher)     │
              └────────────────────┘
```

**实现（使用 Cluster API）：**
```yaml
apiVersion: cluster.x-k8s.io/v1beta1
kind: Cluster
metadata:
  name: tenant-a-cluster
  namespace: tenants
spec:
  clusterNetwork:
    pods:
      cidrBlocks:
      - 10.100.0.0/16
    services:
      cidrBlocks:
      - 10.101.0.0/16
  controlPlaneRef:
    apiVersion: controlplane.cluster.x-k8s.io/v1beta1
    kind: KubeadmControlPlane
    name: tenant-a-control-plane
  infrastructureRef:
    apiVersion: infrastructure.cluster.x-k8s.io/v1beta1
    kind: AWSCluster
    name: tenant-a-aws
```

**多租户平台功能：**

**1. 租户自助服务（Portal）：**
```go
// API: 创建租户
POST /api/v1/tenants
{
  "name": "tenant-a",
  "quota": {
    "cpu": "100",
    "memory": "200Gi"
  }
}

// 自动创建：
// - Namespace
// - ResourceQuota
// - NetworkPolicy
// - RBAC
```

**2. 计量和计费：**
```yaml
# 使用 Prometheus 收集资源使用
sum(
  rate(container_cpu_usage_seconds_total{namespace="tenant-a"}[5m])
) * on(pod) group_left(label_cost_center) kube_pod_labels

sum(
  container_memory_usage_bytes{namespace="tenant-a"}
) * on(pod) group_left(label_cost_center) kube_pod_labels
```

**3. 审计日志：**
```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: RequestResponse
  namespaces: ["tenant-a", "tenant-b"]
  verbs: ["create", "update", "patch", "delete"]
```

**4. 多租户 Ingress：**
```yaml
# Tenant A Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tenant-a-ingress
  namespace: tenant-a
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: tenant-a.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app
            port:
              number: 80
```

**5. 多租户存储：**
```yaml
# 每个租户独立的 StorageClass
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: tenant-a-storage
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  encrypted: "true"
  kmsKeyId: "arn:aws:kms:us-east-1:123456789:key/tenant-a-key"
allowedTopologies:
- matchLabelExpressions:
  - key: topology.kubernetes.io/zone
    values:
    - us-east-1a
    - us-east-1b
```

**安全加固：**

**1. 使用 OPA Gatekeeper 强制策略：**
```yaml
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: tenantlabels
spec:
  crd:
    spec:
      names:
        kind: TenantLabels
  targets:
  - target: admission.k8s.gatekeeper.sh
    rego: |
      package tenantlabels
      violation[{"msg": msg}] {
        not input.review.object.metadata.labels.tenant
        msg := "All resources must have a tenant label"
      }
```

**2. 限制 Privilege Escalation：**
```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: tenant-security
webhooks:
- name: validate-tenant-security.example.com
  rules:
  - operations: ["CREATE", "UPDATE"]
    apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["pods"]
  clientConfig:
    service:
      name: security-webhook
      namespace: platform
```

**我的实践经验：**
根据租户信任度选择方案：
- **内部团队**：Namespace 隔离 + RBAC + NetworkPolicy
- **外部客户（中等隔离）**：vcluster
- **外部客户（强隔离）**：独立集群

核心要点：
1. 最小权限原则
2. 默认拒绝网络策略
3. 强制资源配额
4. 审计所有操作
5. 定期安全扫描

### 15. 设计一个 Kubernetes 平台的灾难恢复方案

**参考答案：**

**灾难恢复级别：**

**RTO (Recovery Time Objective)：恢复时间目标**
**RPO (Recovery Point Objective)：恢复点目标（数据丢失容忍度）**

| 级别     | RTO        | RPO        | 成本 |
|---------|------------|------------|------|
| Tier 1  | < 1 小时   | < 5 分钟   | 高   |
| Tier 2  | < 4 小时   | < 1 小时   | 中   |
| Tier 3  | < 24 小时  | < 24 小时  | 低   |

**灾难恢复架构：**

**1. 多区域（Multi-Region）高可用**

**架构：**
```
┌──────────── Region A (Primary) ─────────────┐
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │  AZ-1   │  │  AZ-2   │  │  AZ-3   │     │
│  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │     │
│  │ │ K8s │ │  │ │ K8s │ │  │ │ K8s │ │     │
│  │ └─────┘ │  │ └─────┘ │  │ └─────┘ │     │
│  └─────────┘  └─────────┘  └─────────┘     │
└──────────────────┬───────────────────────────┘
                   │
        Replication/Failover
                   │
┌──────────── Region B (DR) ──────────────────┐
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │  AZ-1   │  │  AZ-2   │  │  AZ-3   │     │
│  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │     │
│  │ │ K8s │ │  │ │ K8s │ │  │ │ K8s │ │     │
│  │ └─────┘ │  │ └─────┘ │  │ └─────┘ │     │
│  └─────────┘  └─────────┘  └─────────┘     │
└──────────────────────────────────────────────┘
```

**2. 关键组件备份策略**

**etcd 备份：**

**方法 1：快照备份**
```bash
#!/bin/bash
# etcd-backup.sh

ETCDCTL_API=3 etcdctl \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  snapshot save /backup/etcd-snapshot-$(date +%Y%m%d-%H%M%S).db

# 上传到对象存储
aws s3 cp /backup/etcd-snapshot-*.db s3://k8s-backups/etcd/

# 清理旧备份（保留 7 天）
find /backup -name "etcd-snapshot-*.db" -mtime +7 -delete
```

**定时任务：**
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: etcd-backup
  namespace: kube-system
spec:
  schedule: "0 */2 * * *"  # 每 2 小时
  jobTemplate:
    spec:
      template:
        spec:
          hostNetwork: true
          containers:
          - name: backup
            image: k8s.gcr.io/etcd:3.5.0
            command:
            - /bin/sh
            - -c
            - |
              ETCDCTL_API=3 etcdctl \
                --endpoints=https://127.0.0.1:2379 \
                --cacert=/etc/kubernetes/pki/etcd/ca.crt \
                --cert=/etc/kubernetes/pki/etcd/server.crt \
                --key=/etc/kubernetes/pki/etcd/server.key \
                snapshot save /backup/snapshot.db
              
              aws s3 cp /backup/snapshot.db s3://k8s-backups/etcd/snapshot-$(date +%Y%m%d-%H%M%S).db
            volumeMounts:
            - name: etcd-certs
              mountPath: /etc/kubernetes/pki/etcd
            - name: backup
              mountPath: /backup
          volumes:
          - name: etcd-certs
            hostPath:
              path: /etc/kubernetes/pki/etcd
          - name: backup
            emptyDir: {}
          restartPolicy: OnFailure
```

**etcd 恢复：**
```bash
# 停止 API Server
systemctl stop kube-apiserver

# 停止 etcd
systemctl stop etcd

# 恢复快照
ETCDCTL_API=3 etcdctl snapshot restore /backup/snapshot.db \
  --data-dir=/var/lib/etcd-restore \
  --name=etcd-1 \
  --initial-cluster=etcd-1=https://192.168.1.10:2380,etcd-2=https://192.168.1.11:2380,etcd-3=https://192.168.1.12:2380 \
  --initial-advertise-peer-urls=https://192.168.1.10:2380

# 更新 etcd 数据目录
mv /var/lib/etcd /var/lib/etcd-old
mv /var/lib/etcd-restore /var/lib/etcd

# 启动 etcd
systemctl start etcd

# 启动 API Server
systemctl start kube-apiserver
```

**使用 Velero 备份应用：**

**安装 Velero：**
```bash
# AWS
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.5.0 \
  --bucket k8s-backups \
  --secret-file ./credentials-velero \
  --backup-location-config region=us-east-1 \
  --snapshot-location-config region=us-east-1
```

**备份策略：**
```yaml
# 每日全量备份
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"
  template:
    includedNamespaces:
    - production
    - staging
    excludedResources:
    - events
    - events.events.k8s.io
    ttl: 720h  # 30 天
    snapshotVolumes: true
    
---
# 每小时增量备份（仅 PV）
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: hourly-pv-backup
  namespace: velero
spec:
  schedule: "0 * * * *"
  template:
    includedNamespaces:
    - production
    includedResources:
    - persistentvolumes
    - persistentvolumeclaims
    ttl: 168h  # 7 天
    snapshotVolumes: true
```

**应用级别备份：**
```yaml
# 备份特定应用
velero backup create myapp-backup \
  --selector app=myapp \
  --include-namespaces production \
  --snapshot-volumes

# 定期备份
velero schedule create myapp-schedule \
  --schedule="0 */6 * * *" \
  --selector app=myapp \
  --ttl 168h
```

**恢复流程：**

**场景 1：单个应用恢复**
```bash
# 列出备份
velero backup get

# 恢复到新命名空间
velero restore create --from-backup myapp-backup \
  --namespace-mappings production:production-restore

# 验证
kubectl get all -n production-restore
```

**场景 2：整个集群恢复**
```bash
# 1. 创建新集群

# 2. 安装 Velero（配置相同的备份存储）

# 3. 恢复所有备份
velero restore create --from-backup daily-backup-20241210

# 4. 验证恢复
velero restore describe <restore-name>
velero restore logs <restore-name>
```

**场景 3：跨区域 DR**

**主区域配置：**
```yaml
apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: primary
  namespace: velero
spec:
  provider: aws
  objectStorage:
    bucket: k8s-backups-us-east-1
    prefix: velero
  config:
    region: us-east-1
    
---
# DR 区域
apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: dr
  namespace: velero
spec:
  provider: aws
  objectStorage:
    bucket: k8s-backups-us-west-2
    prefix: velero
  config:
    region: us-west-2
```

**备份同步：**
```bash
# S3 跨区域复制
aws s3api put-bucket-replication \
  --bucket k8s-backups-us-east-1 \
  --replication-configuration '{
    "Role": "arn:aws:iam::123456789:role/s3-replication",
    "Rules": [{
      "Status": "Enabled",
      "Priority": 1,
      "DeleteMarkerReplication": { "Status": "Disabled" },
      "Filter" : {},
      "Destination": {
        "Bucket": "arn:aws:s3:::k8s-backups-us-west-2",
        "ReplicationTime": {
          "Status": "Enabled",
          "Time": {
            "Minutes": 15
          }
        }
      }
    }]
  }'
```

**3. 数据库灾难恢复**

**PostgreSQL（使用 Postgres Operator）：**
```yaml
apiVersion: acid.zalan.do/v1
kind: postgresql
metadata:
  name: prod-db
spec:
  teamId: "production"
  volume:
    size: 100Gi
  numberOfInstances: 3
  enableWalArchiving: true
  standby:
    standby_host: "prod-db-replica.us-west-2.rds.amazonaws.com"
    standby_port: "5432"
```

**4. GitOps 灾难恢复**

**使用 Flux/ArgoCD：**
```yaml
# Git 作为唯一真实来源
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: GitRepository
metadata:
  name: platform-config
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/myorg/platform-config
  ref:
    branch: main
  secretRef:
    name: git-credentials

---
# 自动恢复
apiVersion: kustomize.toolkit.fluxcd.io/v1beta2
kind: Kustomization
metadata:
  name: platform
  namespace: flux-system
spec:
  interval: 10m
  sourceRef:
    kind: GitRepository
    name: platform-config
  path: ./clusters/production
  prune: true
  wait: true
```

**优势：**
- Git 即备份
- 快速重建集群
- 声明式配置

**5. 灾难恢复演练**

**定期演练计划：**
```yaml
# 每季度 DR 演练
Schedule:
  - Q1: 单应用恢复演练
  - Q2: 全集群恢复演练
  - Q3: 跨区域 Failover 演练
  - Q4: 全场景综合演练

Checklist:
  - [ ] etcd 快照恢复
  - [ ] Velero 备份恢复
  - [ ] 数据库恢复
  - [ ] 网络配置验证
  - [ ] 存储挂载验证
  - [ ] 应用功能测试
  - [ ] 性能测试
  - [ ] 回切到主区域
```

**自动化 DR 测试：**
```bash
#!/bin/bash
# dr-test.sh

# 1. 在 DR 集群创建测试命名空间
kubectl create namespace dr-test

# 2. 恢复最新备份
LATEST_BACKUP=$(velero backup get --output json | jq -r '.items[0].metadata.name')
velero restore create dr-test-restore \
  --from-backup $LATEST_BACKUP \
  --namespace-mappings production:dr-test

# 3. 等待恢复完成
velero restore wait dr-test-restore

# 4. 运行验证测试
kubectl exec -n dr-test deployment/myapp -- /app/healthcheck

# 5. 清理
kubectl delete namespace dr-test
```

**我的实践经验：**
灾难恢复三板斧：
1. **备份自动化**：etcd 每 2 小时，应用每天，PV 每小时
2. **定期演练**：每季度至少一次完整 DR 演练
3. **GitOps**：所有配置存 Git，集群可随时重建

关键指标：
- etcd 备份成功率 > 99.9%
- 备份验证通过率 > 99%
- DR 演练成功率 100%
- 单应用 RTO < 30 分钟
- 全集群 RTO < 4 小时

---

## 致谢

感谢您阅读本面试准备文档。这些问题和答案基于真实的 Kubernetes 生产环境经验总结，涵盖了架构原理、开发实践、运维调试、性能优化和系统设计等多个方面。

**持续学习建议：**
1. 定期阅读 Kubernetes 官方文档和 CHANGELOG
2. 参与开源社区，贡献代码或文档
3. 搭建实验环境，动手实践各种场景
4. 关注 CNCF 生态，了解最新技术趋势
5. 分享经验，通过博客或演讲输出知识

祝面试顺利！