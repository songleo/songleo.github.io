# 算力平台软件开发工程师面试准备

基于 resume_zte.md 生成的面试问题与参考答案

---

## 一、Kubernetes 核心原理篇

### 1. 请详细介绍 Kubernetes 的架构，以及各组件的作用？

**参考答案：**

Kubernetes 采用 Master-Worker 架构：

**Master 节点组件：**
- **kube-apiserver**：集群的统一入口，所有操作都通过 API Server。提供 RESTful API，负责认证、授权、准入控制
- **etcd**：分布式 KV 存储，保存集群所有状态数据。使用 Raft 协议保证一致性
- **kube-scheduler**：负责 Pod 调度，根据资源需求、亲和性、污点容忍等策略选择合适的节点
- **kube-controller-manager**：运行各种控制器，如 Deployment Controller、ReplicaSet Controller 等，负责维护集群期望状态

**Worker 节点组件：**
- **kubelet**：节点代理，负责 Pod 生命周期管理，与容器运行时交互
- **kube-proxy**：负责服务发现和负载均衡，维护 iptables/ipvs 规则
- **Container Runtime**：容器运行时，如 containerd、CRI-O，负责镜像管理和容器运行

**工作流程：**
1. 用户通过 kubectl 向 API Server 提交 Pod 创建请求
2. API Server 验证请求后写入 etcd
3. Scheduler 监听到未调度的 Pod，选择合适节点，更新 Pod 的 nodeName
4. 目标节点的 kubelet 监听到调度给自己的 Pod，调用容器运行时创建容器
5. Controller Manager 持续监控 Pod 状态，确保实际状态与期望状态一致

### 2. 请解释 Kubernetes 的调度器（Scheduler）工作原理，以及调度算法有哪些？

**参考答案：**

**调度流程：**

1. **Filtering（预选）**：过滤掉不满足条件的节点
   - PodFitsResources：检查节点资源（CPU、内存）是否充足
   - PodFitsHost：检查 Pod 是否指定了 nodeName
   - PodMatchNodeSelector：检查节点标签是否匹配
   - PodToleratesNodeTaints：检查 Pod 是否容忍节点污点
   - CheckNodeMemoryPressure/DiskPressure：检查节点压力状态

2. **Scoring（优选）**：对剩余节点打分
   - LeastRequestedPriority：优先选择资源使用率低的节点（(capacity - requested) / capacity）
   - BalancedResourceAllocation：优先选择 CPU 和内存使用均衡的节点
   - NodeAffinityPriority：节点亲和性权重
   - InterPodAffinityPriority：Pod 间亲和性/反亲和性
   - ImageLocalityPriority：优先选择已有镜像的节点

3. **Binding（绑定）**：选择得分最高的节点，更新 Pod 的 spec.nodeName

**自定义调度策略：**
- **Extender**：通过 HTTP 回调扩展调度器
- **Scheduler Framework**：实现 Plugin 接口，注入调度逻辑
- **Custom Scheduler**：开发独立的调度器，通过 schedulerName 指定

**我的项目经验：**
在 AI 作业调度平台中，实现了 FairShare 调度算法，按用户历史资源使用量动态调整优先级，并支持 GPU 亲和性调度。

### 3. 解释 Kubernetes Controller 的工作原理，Reconciliation Loop 是什么？

**参考答案：**

**Controller 核心概念：**

Controller 通过"控制循环"持续监控资源状态，确保实际状态与期望状态一致。

**Reconciliation Loop（调谐循环）：**

```go
for {
  desired := getDesiredState()
  current := getCurrentState()
  
  if current != desired {
    makeChanges(current, desired)
  }
  
  sleep(interval)
}
```

**工作流程：**

1. **Watch**：通过 Informer 监听 API Server 的资源变化事件（Add/Update/Delete）
2. **Queue**：将变化事件放入 WorkQueue
3. **Reconcile**：从队列取出事件，执行调谐逻辑
   - 获取当前状态（从 API Server）
   - 比较期望状态和当前状态
   - 执行必要的操作（创建、更新、删除资源）
4. **Requeue**：如果调谐失败或需要延迟处理，重新入队

**Level-triggered vs Edge-triggered：**
- Kubernetes 采用 Level-triggered（水平触发），Controller 基于当前完整状态做决策
- 好处是即使错过某些事件，也能通过定期 resync 恢复

**我的实现经验：**
在开发 Kubernetes Operator 时，使用 controller-runtime 框架，实现了 Reconcile 方法：
- 使用 Owner Reference 建立资源父子关系
- 通过 Finalizer 实现资源删除前的清理逻辑
- 使用 Status 子资源记录 Reconcile 结果

### 4. 什么是 Kubernetes CRD？如何开发一个 Operator？

**参考答案：**

**CRD (Custom Resource Definition)：**

CRD 允许用户扩展 Kubernetes API，定义自己的资源类型。

**示例 CRD：**
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: applications.example.com
spec:
  group: example.com
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                replicas:
                  type: integer
                image:
                  type: string
  scope: Namespaced
  names:
    plural: applications
    singular: application
    kind: Application
```

**Operator 开发步骤：**

1. **定义 API（CRD）**：
```go
type Application struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`
    Spec   ApplicationSpec   `json:"spec,omitempty"`
    Status ApplicationStatus `json:"status,omitempty"`
}
```

2. **实现 Controller**：
```go
func (r *ApplicationReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // 1. 获取 Application 对象
    app := &examplev1.Application{}
    if err := r.Get(ctx, req.NamespacedName, app); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }
    
    // 2. 创建或更新 Deployment
    deployment := constructDeployment(app)
    if err := r.Create(ctx, deployment); err != nil {
        return ctrl.Result{}, err
    }
    
    // 3. 更新 Status
    app.Status.Ready = true
    if err := r.Status().Update(ctx, app); err != nil {
        return ctrl.Result{}, err
    }
    
    return ctrl.Result{}, nil
}
```

3. **注册 Controller**：
```go
func main() {
    mgr, _ := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{})
    
    ctrl.NewControllerManagedBy(mgr).
        For(&examplev1.Application{}).
        Owns(&appsv1.Deployment{}).
        Complete(&ApplicationReconciler{})
    
    mgr.Start(ctrl.SetupSignalHandler())
}
```

**我的项目经验：**
- 使用 Operator SDK 开发了监控 Operator，管理 Prometheus、ServiceMonitor 等资源
- 实现了 Admission Webhook 进行资源验证和变更
- 使用 Owner Reference 实现资源级联删除

### 5. Kubernetes 中的网络模型是怎样的？Service 如何实现负载均衡？

**参考答案：**

**Kubernetes 网络模型（CNI）：**

Kubernetes 要求：
1. 所有 Pod 可以在不使用 NAT 的情况下与其他 Pod 通信
2. 所有节点可以在不使用 NAT 的情况下与所有 Pod 通信
3. Pod 看到的自己的 IP 与其他 Pod 看到的一致

**网络实现：**
- **Overlay 网络**：Flannel (VXLAN)、Calico (IPIP/VXLAN)
- **路由方案**：Calico (BGP)、Cilium (eBPF)

**Service 类型：**

1. **ClusterIP**（默认）：
   - 分配一个虚拟 IP（VIP）
   - kube-proxy 通过 iptables/ipvs 规则实现负载均衡
   - 只能在集群内部访问

2. **NodePort**：
   - 在每个节点上开放一个端口（30000-32767）
   - 外部流量通过 NodeIP:NodePort 访问

3. **LoadBalancer**：
   - 依赖云厂商创建外部负载均衡器
   - 流量通过 LB -> NodePort -> ClusterIP -> Pod

4. **ExternalName**：
   - 返回 CNAME 记录，用于访问外部服务

**kube-proxy 模式：**

- **iptables 模式**（默认）：
  - 为每个 Service 创建 iptables 规则
  - 使用随机算法选择后端 Pod
  - 性能瓶颈：规则数量多时性能下降

- **ipvs 模式**（推荐）：
  - 使用内核 IPVS 模块
  - 支持更多负载均衡算法（rr、lc、dh、sh）
  - 性能更好，支持更大规模集群

**Service 发现：**
- DNS：CoreDNS 提供服务名解析（<service>.<namespace>.svc.cluster.local）
- 环境变量：Pod 启动时注入 Service 的 IP 和端口

### 6. 什么是 Admission Controller？有哪些类型？如何实现自定义 Admission Webhook？

**参考答案：**

**Admission Controller：**

在对象持久化到 etcd 之前，对 API 请求进行拦截和修改的插件。

**执行顺序：**
1. 认证（Authentication）
2. 授权（Authorization）
3. **Admission Control**
4. 持久化到 etcd

**内置 Admission Controllers：**

- **NamespaceLifecycle**：防止在不存在或正在删除的 namespace 中创建对象
- **LimitRanger**：强制执行 LimitRange 限制
- **ResourceQuota**：强制执行 ResourceQuota 限制
- **ServiceAccount**：自动为 Pod 添加 ServiceAccount
- **PodSecurityPolicy**：执行 Pod 安全策略（已废弃，使用 Pod Security Standards）
- **MutatingAdmissionWebhook**：调用外部 webhook 修改对象
- **ValidatingAdmissionWebhook**：调用外部 webhook 验证对象

**自定义 Admission Webhook：**

1. **开发 Webhook Server：**
```go
func serveMutate(w http.ResponseWriter, r *http.Request) {
    // 1. 解析 AdmissionReview 请求
    admissionReview := &admissionv1.AdmissionReview{}
    json.NewDecoder(r.Body).Decode(admissionReview)
    
    // 2. 获取 Pod 对象
    pod := &corev1.Pod{}
    json.Unmarshal(admissionReview.Request.Object.Raw, pod)
    
    // 3. 修改 Pod（添加 sidecar）
    patch := []map[string]interface{}{
        {
            "op": "add",
            "path": "/spec/containers/-",
            "value": sidecarContainer,
        },
    }
    patchBytes, _ := json.Marshal(patch)
    
    // 4. 返回 AdmissionResponse
    admissionReview.Response = &admissionv1.AdmissionResponse{
        Allowed: true,
        Patch: patchBytes,
        PatchType: func() *admissionv1.PatchType {
            pt := admissionv1.PatchTypeJSONPatch
            return &pt
        }(),
    }
    
    json.NewEncoder(w).Encode(admissionReview)
}
```

2. **部署 Webhook：**
   - 创建 Service 暴露 Webhook Server
   - 生成 TLS 证书（API Server 要求 HTTPS）

3. **注册 Webhook：**
```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  name: pod-mutate-webhook
webhooks:
  - name: mutate.example.com
    clientConfig:
      service:
        name: webhook-service
        namespace: default
        path: "/mutate"
      caBundle: <base64-encoded-ca-cert>
    rules:
      - operations: ["CREATE"]
        apiGroups: [""]
        apiVersions: ["v1"]
        resources: ["pods"]
```

**我的实现经验：**
在监控平台项目中，实现了 ValidatingWebhook 验证 ServiceMonitor 配置的合法性，避免错误配置导致监控失效。

---

## 二、Go 语言开发篇

### 7. Go 语言的并发模型是什么？Goroutine 和 Channel 如何使用？

**参考答案：**

**Goroutine：**

Go 的轻量级线程，由 Go runtime 调度，而非操作系统。

**特点：**
- 栈大小初始只有 2KB，动态增长
- 创建和销毁开销极小
- 调度由 GMP 模型实现（G: Goroutine, M: Machine/OS Thread, P: Processor/Context）

**Channel：**

Goroutine 之间的通信机制，遵循 CSP（Communicating Sequential Processes）模型。

**类型：**
```go
// 无缓冲 channel（同步）
ch := make(chan int)

// 有缓冲 channel（异步）
ch := make(chan int, 10)

// 单向 channel
ch := make(chan<- int)  // 只写
ch := make(<-chan int)  // 只读
```

**常用模式：**

1. **Worker Pool：**
```go
func workerPool(jobs <-chan int, results chan<- int) {
    for i := 0; i < 10; i++ {
        go func() {
            for job := range jobs {
                results <- process(job)
            }
        }()
    }
}
```

2. **Select 多路复用：**
```go
select {
case msg := <-ch1:
    fmt.Println("Received from ch1:", msg)
case msg := <-ch2:
    fmt.Println("Received from ch2:", msg)
case <-time.After(time.Second):
    fmt.Println("Timeout")
default:
    fmt.Println("No message")
}
```

3. **Context 超时控制：**
```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

select {
case <-ctx.Done():
    return ctx.Err()
case result := <-ch:
    return result
}
```

**我的项目经验：**
在 AI 作业调度平台中，使用 Goroutine 池处理并发调度请求，通过 Channel 实现任务队列，使用 Context 实现超时和取消控制。

### 8. Go 语言如何进行性能优化？常见的优化技巧有哪些？

**参考答案：**

**性能优化技巧：**

1. **字符串拼接：**
```go
// 低效：使用 + 拼接
s := ""
for i := 0; i < 1000; i++ {
    s += "a"  // 每次都会分配新内存
}

// 高效：使用 strings.Builder
var builder strings.Builder
for i := 0; i < 1000; i++ {
    builder.WriteString("a")
}
s := builder.String()
```

2. **切片预分配：**
```go
// 低效
var s []int
for i := 0; i < 1000; i++ {
    s = append(s, i)  // 多次扩容
}

// 高效
s := make([]int, 0, 1000)
for i := 0; i < 1000; i++ {
    s = append(s, i)  // 只分配一次
}
```

3. **Map 并发访问：**
```go
// 方案1：使用 sync.Map（读多写少）
var m sync.Map
m.Store("key", "value")
v, ok := m.Load("key")

// 方案2：使用 RWMutex（读写都多）
var (
    m  = make(map[string]string)
    mu sync.RWMutex
)
mu.RLock()
v := m["key"]
mu.RUnlock()
```

4. **避免不必要的内存分配：**
```go
// 使用对象池
var pool = sync.Pool{
    New: func() interface{} {
        return new(MyObject)
    },
}

obj := pool.Get().(*MyObject)
defer pool.Put(obj)
```

5. **使用指针传递大结构体：**
```go
// 低效：复制整个结构体
func process(data LargeStruct) {}

// 高效：传递指针
func process(data *LargeStruct) {}
```

**性能分析工具：**

1. **pprof：**
```go
import _ "net/http/pprof"

go func() {
    log.Println(http.ListenAndServe("localhost:6060", nil))
}()
```

访问 http://localhost:6060/debug/pprof/

2. **Benchmark 测试：**
```go
func BenchmarkStringConcat(b *testing.B) {
    for i := 0; i < b.N; i++ {
        _ = "hello" + "world"
    }
}
```

运行：`go test -bench=. -benchmem`

3. **trace：**
```bash
go test -trace=trace.out
go tool trace trace.out
```

**我的优化经验：**
在 Operator 开发中，通过预分配切片、使用 sync.Map 缓存对象、减少不必要的 API 调用，将 Reconcile 时间从秒级降低到毫秒级。

### 9. 如何在 Go 中进行单元测试？有哪些测试最佳实践？

**参考答案：**

**基础测试：**

```go
// math.go
func Add(a, b int) int {
    return a + b
}

// math_test.go
func TestAdd(t *testing.T) {
    result := Add(1, 2)
    expected := 3
    if result != expected {
        t.Errorf("Add(1, 2) = %d; want %d", result, expected)
    }
}
```

**表驱动测试（Table-Driven Tests）：**

```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 1, 2, 3},
        {"negative", -1, -2, -3},
        {"zero", 0, 0, 0},
        {"mixed", -1, 1, 0},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d", 
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}
```

**Mock 测试：**

```go
// 定义接口
type Database interface {
    Get(key string) (string, error)
}

// Mock 实现
type MockDatabase struct {
    data map[string]string
}

func (m *MockDatabase) Get(key string) (string, error) {
    if v, ok := m.data[key]; ok {
        return v, nil
    }
    return "", errors.New("not found")
}

// 测试
func TestGetUser(t *testing.T) {
    mockDB := &MockDatabase{
        data: map[string]string{"user1": "Alice"},
    }
    
    user, err := GetUser(mockDB, "user1")
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
    if user != "Alice" {
        t.Errorf("got %s, want Alice", user)
    }
}
```

**测试覆盖率：**

```bash
go test -cover
go test -coverprofile=coverage.out
go tool cover -html=coverage.out
```

**Kubernetes Controller 测试（使用 envtest）：**

```go
func TestReconcile(t *testing.T) {
    // 启动测试环境
    testEnv := &envtest.Environment{
        CRDDirectoryPaths: []string{filepath.Join("..", "config", "crd", "bases")},
    }
    cfg, err := testEnv.Start()
    defer testEnv.Stop()
    
    // 创建测试客户端
    k8sClient, _ := client.New(cfg, client.Options{})
    
    // 创建测试对象
    app := &examplev1.Application{
        ObjectMeta: metav1.ObjectMeta{
            Name:      "test-app",
            Namespace: "default",
        },
        Spec: examplev1.ApplicationSpec{
            Replicas: 3,
        },
    }
    k8sClient.Create(context.Background(), app)
    
    // 执行 Reconcile
    reconciler := &ApplicationReconciler{Client: k8sClient}
    _, err = reconciler.Reconcile(context.Background(), 
        reconcile.Request{NamespacedName: types.NamespacedName{Name: "test-app", Namespace: "default"}})
    
    // 验证结果
    assert.NoError(t, err)
}
```

**测试最佳实践：**
1. 遵循 AAA 模式（Arrange, Act, Assert）
2. 使用表驱动测试覆盖多种场景
3. 测试函数命名清晰（Test<Function>_<Scenario>）
4. 使用 Mock 隔离外部依赖
5. 测试边界条件和异常情况
6. 保持测试代码简洁易读

---

## 三、项目经验深挖篇

### 10. 请详细介绍你开发的 AI 作业调度平台，技术架构是怎样的？

**参考答案：**

**项目背景：**
公司需要一个高可用的 AI 作业调度平台，支持多种 AI 算法的资源调度和管理。

**技术架构：**

```
┌─────────────┐
│   CLI/UI    │
└──────┬──────┘
       │ REST API / gRPC
┌──────▼──────────────────────┐
│   API Gateway (Go)          │
│   - 认证/授权               │
│   - 请求路由                │
└──────┬──────────────────────┘
       │
┌──────▼──────────────────────┐
│   Scheduler (Go)            │
│   - 调度算法引擎            │
│   - 资源管理                │
│   - 优先级队列              │
└──────┬──────────────────────┘
       │
┌──────▼──────────────────────┐
│   Task Queue (RabbitMQ)     │
│   - 任务队列                │
│   - 消息持久化              │
└──────┬──────────────────────┘
       │
┌──────▼──────────────────────┐
│   Worker Nodes (Python)     │
│   - 执行 AI 算法            │
│   - 上报状态                │
└──────┬──────────────────────┘
       │
┌──────▼──────────────────────┐
│   State Store (etcd)        │
│   - 作业状态                │
│   - 配置管理                │
└─────────────────────────────┘
       │
┌──────▼──────────────────────┐
│   Monitoring (Prometheus)   │
│   - 指标采集                │
│   - 告警                    │
└─────────────────────────────┘
```

**核心功能：**

1. **调度策略：**
   - **FIFO**：先进先出
   - **Priority**：基于优先级
   - **FairShare**：基于历史使用量的公平调度
   - **Preemption**：高优先级作业抢占低优先级作业

2. **FairShare 算法实现：**
```go
type FairShareScheduler struct {
    users map[string]*UserUsage
}

type UserUsage struct {
    userID       string
    totalUsage   float64  // 历史总使用量
    currentUsage float64  // 当前使用量
    priority     float64  // 动态优先级
}

func (s *FairShareScheduler) calculatePriority(user *UserUsage) float64 {
    // 优先级 = 配额 / (历史使用量 + 1)
    return user.quota / (user.totalUsage + 1)
}

func (s *FairShareScheduler) Schedule(jobs []*Job) *Job {
    // 更新所有用户的优先级
    for _, user := range s.users {
        user.priority = s.calculatePriority(user)
    }
    
    // 选择优先级最高的作业
    var selectedJob *Job
    maxPriority := 0.0
    
    for _, job := range jobs {
        user := s.users[job.UserID]
        if user.priority > maxPriority {
            maxPriority = user.priority
            selectedJob = job
        }
    }
    
    return selectedJob
}
```

3. **资源管理：**
```go
type ResourceManager struct {
    nodes map[string]*Node
}

type Node struct {
    nodeID       string
    totalCPU     int
    totalMemory  int64
    totalGPU     int
    usedCPU      int
    usedMemory   int64
    usedGPU      int
}

func (rm *ResourceManager) FindSuitableNode(job *Job) (*Node, error) {
    for _, node := range rm.nodes {
        if node.totalCPU-node.usedCPU >= job.RequiredCPU &&
           node.totalMemory-node.usedMemory >= job.RequiredMemory &&
           node.totalGPU-node.usedGPU >= job.RequiredGPU {
            return node, nil
        }
    }
    return nil, errors.New("no suitable node found")
}
```

4. **高可用设计：**
   - **API Gateway**：多实例部署 + 负载均衡
   - **Scheduler**：主备模式，通过 etcd 选主
   - **etcd**：3 节点集群，Raft 协议保证一致性
   - **RabbitMQ**：镜像队列，消息持久化

5. **监控和可观测性：**
```go
// 暴露 Prometheus 指标
var (
    jobsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "scheduler_jobs_total",
            Help: "Total number of jobs",
        },
        []string{"status", "user"},
    )
    
    schedulingDuration = prometheus.NewHistogram(
        prometheus.HistogramOpts{
            Name: "scheduler_duration_seconds",
            Help: "Scheduling duration in seconds",
            Buckets: prometheus.DefBuckets,
        },
    )
)

func init() {
    prometheus.MustRegister(jobsTotal)
    prometheus.MustRegister(schedulingDuration)
}
```

**性能优化：**
- 使用 Goroutine 池并发处理调度请求
- 使用 Redis 缓存节点状态，减少 etcd 读取
- 使用优先级队列（heap）优化调度算法，时间复杂度 O(log n)
- 批量处理任务，减少网络开销

**成果：**
- 支持 100+ 个并发作业
- 调度延迟 < 100ms
- 资源利用率提升 30%+
- 支持 GPU、CPU、内存等多维度资源调度

### 11. 在 Kubernetes Operator 开发中遇到过哪些挑战？如何解决的？

**参考答案：**

**挑战1：Reconcile 循环死锁**

**问题：**
Operator 更新资源后，触发新的 Reconcile，导致无限循环。

**解决方案：**
1. 使用 Generation 字段判断 Spec 是否真正变化：
```go
if app.Generation == app.Status.ObservedGeneration {
    return ctrl.Result{}, nil
}
```

2. 更新 Status 时使用 Status 子资源：
```go
// 错误：会触发新的 Reconcile
r.Update(ctx, app)

// 正确：只更新 Status，不触发 Reconcile
r.Status().Update(ctx, app)
```

**挑战2：资源级联删除**

**问题：**
删除 Application 时，需要同时删除关联的 Deployment、Service 等资源。

**解决方案：**
使用 Owner Reference：
```go
deployment := &appsv1.Deployment{
    ObjectMeta: metav1.ObjectMeta{
        Name:      app.Name,
        Namespace: app.Namespace,
        OwnerReferences: []metav1.OwnerReference{
            *metav1.NewControllerRef(app, schema.GroupVersionKind{
                Group:   examplev1.GroupVersion.Group,
                Version: examplev1.GroupVersion.Version,
                Kind:    "Application",
            }),
        },
    },
}
```

当 Application 被删除时，Kubernetes GC 会自动删除所有 Owned 资源。

**挑战3：资源删除前的清理工作**

**问题：**
删除资源前需要执行清理操作（如释放外部资源）。

**解决方案：**
使用 Finalizer：
```go
const finalizerName = "application.example.com/finalizer"

func (r *ApplicationReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    app := &examplev1.Application{}
    r.Get(ctx, req.NamespacedName, app)
    
    // 资源正在被删除
    if !app.DeletionTimestamp.IsZero() {
        if controllerutil.ContainsFinalizer(app, finalizerName) {
            // 执行清理逻辑
            if err := r.cleanup(ctx, app); err != nil {
                return ctrl.Result{}, err
            }
            
            // 移除 Finalizer
            controllerutil.RemoveFinalizer(app, finalizerName)
            r.Update(ctx, app)
        }
        return ctrl.Result{}, nil
    }
    
    // 添加 Finalizer
    if !controllerutil.ContainsFinalizer(app, finalizerName) {
        controllerutil.AddFinalizer(app, finalizerName)
        r.Update(ctx, app)
    }
    
    // 正常 Reconcile 逻辑
    ...
}
```

**挑战4：处理大规模资源**

**问题：**
监控数千个资源时，Informer 内存占用过大。

**解决方案：**
1. 使用 Selector 过滤资源：
```go
ctrl.NewControllerManagedBy(mgr).
    For(&corev1.Pod{}).
    WithEventFilter(predicate.NewPredicateFuncs(func(object client.Object) bool {
        return object.GetLabels()["app"] == "myapp"
    })).
    Complete(r)
```

2. 使用分页 List：
```go
continueToken := ""
for {
    podList := &corev1.PodList{}
    err := r.List(ctx, podList, 
        client.InNamespace("default"),
        client.Limit(500),
        client.Continue(continueToken))
    
    // 处理 podList
    
    continueToken = podList.Continue
    if continueToken == "" {
        break
    }
}
```

**挑战5：并发控制**

**问题：**
多个 Reconcile goroutine 同时修改同一资源，导致冲突。

**解决方案：**
1. controller-runtime 默认使用 WorkQueue，保证同一资源不会并发 Reconcile
2. 使用乐观锁（ResourceVersion）处理冲突：
```go
err := r.Update(ctx, app)
if apierrors.IsConflict(err) {
    // 重新获取最新版本
    r.Get(ctx, req.NamespacedName, app)
    // 重试更新
    return ctrl.Result{Requeue: true}, nil
}
```

### 12. 如何设计和实现一个高可用的 Kubernetes 集群？

**参考答案：**

**高可用架构：**

```
┌─────────────────────────────────────┐
│         Load Balancer (VIP)         │
│         (HAProxy / Keepalived)      │
└────────┬─────────┬──────────┬───────┘
         │         │          │
    ┌────▼────┐┌───▼────┐┌───▼────┐
    │ Master1 ││ Master2││ Master3│
    │         ││        ││        │
    │ API     ││ API    ││ API    │
    │ Sched   ││ Sched  ││ Sched  │
    │ Ctrl    ││ Ctrl   ││ Ctrl   │
    └────┬────┘└────┬───┘└────┬───┘
         │          │         │
    ┌────▼──────────▼─────────▼────┐
    │      etcd Cluster (3 nodes)  │
    └──────────────────────────────┘
```

**关键设计：**

1. **Master 节点高可用：**
   - 至少 3 个 Master 节点
   - API Server 前置 Load Balancer（HAProxy + Keepalived 实现 VIP）
   - Scheduler 和 Controller Manager 使用 Leader Election

2. **etcd 高可用：**
   - 3 或 5 个 etcd 节点（奇数个，Raft 协议）
   - 独立部署（不与 Master 混部）
   - 定期备份（snapshot）
   - 使用 SSD 磁盘，优化 IOPS

3. **Worker 节点高可用：**
   - 多个 Worker 节点跨可用区部署
   - 使用 PodDisruptionBudget 保证应用可用性：
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: myapp
```

4. **网络高可用：**
   - 使用 Calico/Cilium 等高性能 CNI
   - 配置 Network Policy 实现网络隔离
   - 使用 MetalLB 或云厂商 LB 提供 LoadBalancer Service

5. **存储高可用：**
   - 使用分布式存储（Ceph、Longhorn）
   - 配置 StorageClass 支持动态 PV
   - 使用 VolumeSnapshot 备份数据

6. **监控和告警：**
   - 部署 Prometheus + Grafana 监控集群
   - 配置告警规则（节点宕机、Pod 异常、资源不足）
   - 使用 Alertmanager 发送告警通知

7. **灾难恢复：**
   - 定期备份 etcd 数据：
```bash
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snapshot.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```
   - 备份关键资源定义（使用 Velero）
   - 制定恢复流程和演练

**我的实践经验：**
管理的生产集群采用 3 Master + 5 Worker 架构，etcd 独立 3 节点部署，使用 HAProxy + Keepalived 实现 API Server 高可用，集群整体可用性达到 99.9%。

---

## 四、算力平台特定问题

### 13. 如何在 Kubernetes 上调度 GPU 工作负载？

**参考答案：**

**GPU 调度方案：**

1. **NVIDIA GPU Operator：**
   - 自动安装 GPU 驱动
   - 部署 NVIDIA Device Plugin
   - 配置 GPU Monitoring

2. **Device Plugin 工作原理：**
```
kubelet → Device Plugin (gRPC) → 发现 GPU 设备
                                → 上报可用 GPU 数量
                                → 分配 GPU 给 Pod
```

3. **使用 GPU 的 Pod：**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  containers:
  - name: cuda-container
    image: nvidia/cuda:11.0-base
    resources:
      limits:
        nvidia.com/gpu: 2  # 请求 2 个 GPU
```

4. **GPU 共享（vGPU）：**

使用 NVIDIA MIG（Multi-Instance GPU）或第三方方案（如 GPUShare）：
```yaml
resources:
  limits:
    nvidia.com/gpu-memory: 4096  # 4GB 显存
```

5. **GPU 拓扑感知调度：**

使用 Topology Manager 保证 GPU 和 CPU 在同一 NUMA 节点：
```yaml
# kubelet 配置
topologyManagerPolicy: best-effort
```

6. **GPU 监控：**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dcgm-exporter
  namespace: gpu-operator
data:
  metrics: |
    DCGM_FI_DEV_GPU_UTIL
    DCGM_FI_DEV_MEM_COPY_UTIL
    DCGM_FI_DEV_POWER_USAGE
```

通过 DCGM Exporter 暴露 GPU 指标给 Prometheus。

**我的实现：**
在 AI 作业调度平台中，通过 Device Plugin 识别 GPU 节点，实现 GPU 亲和性调度，优先将需要 GPU 的作业调度到 GPU 节点上。

### 14. 如何优化大规模集群的资源利用率？

**参考答案：**

**资源利用率优化策略：**

1. **资源请求和限制（Requests/Limits）：**
```yaml
resources:
  requests:  # 调度依据
    cpu: "500m"
    memory: "512Mi"
  limits:    # 运行时限制
    cpu: "1000m"
    memory: "1Gi"
```

最佳实践：
- Requests 设置为平均使用量
- Limits 设置为峰值使用量
- CPU Limits 可以不设置（允许 burst）

2. **Vertical Pod Autoscaler (VPA)：**

自动调整 Pod 的 Requests/Limits：
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: myapp-vpa
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: myapp
  updatePolicy:
    updateMode: "Auto"  # 自动更新
```

3. **Horizontal Pod Autoscaler (HPA)：**

基于指标自动扩缩容：
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
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
```

4. **Cluster Autoscaler：**

自动增加/减少节点数量：
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-autoscaler-config
data:
  min-nodes: "3"
  max-nodes: "20"
  scale-down-delay: "10m"
  scale-down-unneeded-time: "10m"
```

5. **Pod Priority 和 Preemption：**

```yaml
# 定义 PriorityClass
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000
globalDefault: false
description: "High priority class"

# Pod 使用 PriorityClass
spec:
  priorityClassName: high-priority
```

高优先级 Pod 可以抢占低优先级 Pod 的资源。

6. **资源配额（ResourceQuota）：**

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: myapp
spec:
  hard:
    requests.cpu: "100"
    requests.memory: "100Gi"
    limits.cpu: "200"
    limits.memory: "200Gi"
    pods: "100"
```

7. **LimitRange：**

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: cpu-limit-range
  namespace: myapp
spec:
  limits:
  - default:
      cpu: "1"
      memory: "1Gi"
    defaultRequest:
      cpu: "500m"
      memory: "512Mi"
    type: Container
```

8. **节点亲和性和反亲和性：**

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: node-type
          operator: In
          values:
          - high-memory
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

**监控和分析：**
- 使用 Prometheus 监控节点和 Pod 资源使用率
- 分析资源浪费情况（Requests 远高于实际使用）
- 定期审查和调整资源配置

**我的优化成果：**
通过设置合理的 Requests/Limits、启用 HPA、使用 Pod Priority，将集群资源利用率从 40% 提升到 70%+。

### 15. 如何设计一个任务调度系统，支持优先级、依赖关系和重试机制？

**参考答案：**

**系统设计：**

1. **数据模型：**
```go
type Task struct {
    ID           string
    Name         string
    Priority     int        // 优先级（数字越大越高）
    Dependencies []string   // 依赖的任务 ID
    Status       TaskStatus // Pending/Running/Success/Failed
    Retries      int        // 重试次数
    MaxRetries   int        // 最大重试次数
    CreatedAt    time.Time
    StartedAt    *time.Time
    FinishedAt   *time.Time
    Error        string
}

type TaskStatus string
const (
    StatusPending TaskStatus = "Pending"
    StatusRunning TaskStatus = "Running"
    StatusSuccess TaskStatus = "Success"
    StatusFailed  TaskStatus = "Failed"
)
```

2. **调度器设计：**
```go
type Scheduler struct {
    taskQueue   *PriorityQueue
    taskStore   *TaskStore
    workerPool  *WorkerPool
    depGraph    *DependencyGraph
}

func (s *Scheduler) Schedule() {
    for {
        // 1. 从优先级队列获取任务
        task := s.taskQueue.Pop()
        
        // 2. 检查依赖是否满足
        if !s.depGraph.CanExecute(task.ID) {
            s.taskQueue.Push(task)  // 依赖未满足，重新入队
            continue
        }
        
        // 3. 分配给 Worker 执行
        s.workerPool.Submit(task)
    }
}
```

3. **优先级队列实现：**
```go
type PriorityQueue struct {
    items []*Task
    mu    sync.Mutex
}

func (pq *PriorityQueue) Push(task *Task) {
    pq.mu.Lock()
    defer pq.mu.Unlock()
    
    pq.items = append(pq.items, task)
    heap.Fix(pq, len(pq.items)-1)
}

func (pq *PriorityQueue) Pop() *Task {
    pq.mu.Lock()
    defer pq.mu.Unlock()
    
    if len(pq.items) == 0 {
        return nil
    }
    
    task := heap.Pop(pq).(*Task)
    return task
}

// 实现 heap.Interface
func (pq *PriorityQueue) Less(i, j int) bool {
    return pq.items[i].Priority > pq.items[j].Priority
}
```

4. **依赖关系管理：**
```go
type DependencyGraph struct {
    graph map[string][]string  // taskID -> dependencies
    mu    sync.RWMutex
}

func (dg *DependencyGraph) AddDependency(taskID string, deps []string) {
    dg.mu.Lock()
    defer dg.mu.Unlock()
    dg.graph[taskID] = deps
}

func (dg *DependencyGraph) CanExecute(taskID string) bool {
    dg.mu.RLock()
    defer dg.mu.RUnlock()
    
    deps := dg.graph[taskID]
    for _, depID := range deps {
        depTask := s.taskStore.Get(depID)
        if depTask.Status != StatusSuccess {
            return false
        }
    }
    return true
}

// 拓扑排序检测循环依赖
func (dg *DependencyGraph) DetectCycle() bool {
    visited := make(map[string]bool)
    recStack := make(map[string]bool)
    
    for taskID := range dg.graph {
        if dg.hasCycle(taskID, visited, recStack) {
            return true
        }
    }
    return false
}
```

5. **重试机制：**
```go
func (w *Worker) Execute(task *Task) {
    defer func() {
        if r := recover(); r != nil {
            task.Error = fmt.Sprintf("panic: %v", r)
            w.handleFailure(task)
        }
    }()
    
    task.Status = StatusRunning
    task.StartedAt = &now
    
    err := w.run(task)
    
    if err != nil {
        task.Error = err.Error()
        w.handleFailure(task)
    } else {
        task.Status = StatusSuccess
        task.FinishedAt = &now
    }
}

func (w *Worker) handleFailure(task *Task) {
    task.Retries++
    
    if task.Retries < task.MaxRetries {
        // 指数退避重试
        delay := time.Duration(math.Pow(2, float64(task.Retries))) * time.Second
        time.AfterFunc(delay, func() {
            task.Status = StatusPending
            w.scheduler.taskQueue.Push(task)
        })
    } else {
        task.Status = StatusFailed
        task.FinishedAt = &now
    }
}
```

6. **Worker Pool：**
```go
type WorkerPool struct {
    workers   []*Worker
    taskChan  chan *Task
    wg        sync.WaitGroup
}

func NewWorkerPool(size int) *WorkerPool {
    wp := &WorkerPool{
        workers:  make([]*Worker, size),
        taskChan: make(chan *Task, size*2),
    }
    
    for i := 0; i < size; i++ {
        wp.workers[i] = NewWorker(wp.taskChan)
        wp.wg.Add(1)
        go wp.workers[i].Start(&wp.wg)
    }
    
    return wp
}

func (wp *WorkerPool) Submit(task *Task) {
    wp.taskChan <- task
}
```

7. **任务状态持久化：**
```go
type TaskStore struct {
    db *gorm.DB  // 或使用 etcd
}

func (ts *TaskStore) Save(task *Task) error {
    return ts.db.Save(task).Error
}

func (ts *TaskStore) Get(taskID string) (*Task, error) {
    var task Task
    err := ts.db.Where("id = ?", taskID).First(&task).Error
    return &task, err
}

func (ts *TaskStore) List(status TaskStatus) ([]*Task, error) {
    var tasks []*Task
    err := ts.db.Where("status = ?", status).Find(&tasks).Error
    return tasks, err
}
```

**高级特性：**

1. **DAG（有向无环图）调度：**
```go
// 支持复杂的任务依赖关系
// A -> B -> D
//  \-> C ->/
```

2. **超时控制：**
```go
ctx, cancel := context.WithTimeout(context.Background(), task.Timeout)
defer cancel()

select {
case <-ctx.Done():
    return errors.New("task timeout")
case result := <-resultChan:
    return result
}
```

3. **资源限制：**
```go
type Task struct {
    RequiredCPU    int
    RequiredMemory int64
}

// 只在资源充足时调度
if node.AvailableCPU >= task.RequiredCPU {
    executeTask(task, node)
}
```

**我的实现经验：**
AI 作业调度平台支持优先级队列（使用 heap）、依赖关系检测（拓扑排序）、指数退避重试机制，实现了高可靠的任务调度。

---

## 五、场景设计题

### 16. 如何设计一个多租户的 Kubernetes 平台？

**参考答案：**

**多租户隔离方案：**

1. **Namespace 级别隔离（软隔离）：**

适用于同一组织内不同团队，信任度较高。

- 每个租户一个 Namespace
- 使用 ResourceQuota 限制资源
- 使用 NetworkPolicy 网络隔离
- RBAC 权限控制

```yaml
# Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-a

# ResourceQuota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-a-quota
  namespace: tenant-a
spec:
  hard:
    requests.cpu: "100"
    requests.memory: "100Gi"
    pods: "100"

# NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-from-other-namespaces
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector: {}  # 只允许同 namespace 的 Pod

# RBAC
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-a-admin
  namespace: tenant-a
subjects:
- kind: User
  name: user-a
roleRef:
  kind: ClusterRole
  name: admin
  apiGroup: rbac.authorization.k8s.io
```

2. **Node 级别隔离（硬隔离）：**

适用于不同组织，安全要求高。

- 每个租户独立节点
- 使用 Taints 和 Tolerations 调度

```yaml
# 节点打污点
kubectl taint nodes node1 tenant=tenant-a:NoSchedule

# Pod 容忍污点
spec:
  tolerations:
  - key: "tenant"
    operator: "Equal"
    value: "tenant-a"
    effect: "NoSchedule"
  nodeSelector:
    tenant: tenant-a
```

3. **虚拟集群（vCluster）：**

每个租户一个虚拟 Kubernetes 集群。

```bash
# 安装 vCluster
vcluster create tenant-a --namespace tenant-a

# 连接到虚拟集群
vcluster connect tenant-a
```

优点：
- 完全的 API 隔离
- 租户可以创建 CRD、Namespace 等集群级资源
- 互不影响

4. **资源配额分层：**

```yaml
# 集群级别配额
apiVersion: v1
kind: ResourceQuota
metadata:
  name: cluster-quota
spec:
  hard:
    requests.cpu: "1000"
    requests.memory: "1Ti"

# 租户级别配额（Namespace）
# 各租户配额总和 ≤ 集群配额
```

5. **网络隔离策略：**

```yaml
# 默认拒绝所有流量
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

# 允许特定流量
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-specific
  namespace: tenant-a
spec:
  podSelector:
    matchLabels:
      app: web
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          tenant: tenant-a
    ports:
    - protocol: TCP
      port: 80
```

6. **存储隔离：**

```yaml
# 每个租户独立 StorageClass
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: tenant-a-storage
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2
  encrypted: "true"
allowVolumeExpansion: true
```

7. **监控和审计：**

- 使用 Tenant 标签标记资源：
```yaml
metadata:
  labels:
    tenant: tenant-a
```

- Prometheus 按租户查询：
```promql
sum(container_cpu_usage_seconds_total{namespace="tenant-a"})
```

- 启用审计日志审计租户操作：
```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: RequestResponse
  users: ["user-a"]
  namespaces: ["tenant-a"]
```

8. **租户自服务平台：**

开发租户管理界面，允许租户：
- 查看资源配额和使用情况
- 部署应用（通过 Helm/Kustomize）
- 查看日志和监控
- 管理成员权限

**最佳实践：**
- 使用 Namespace + ResourceQuota + NetworkPolicy 实现基础隔离
- 敏感租户使用独立节点或虚拟集群
- 实施严格的 RBAC 权限控制
- 监控和审计所有租户操作
- 定期安全扫描和漏洞修复

### 17. 生产环境出现 Pod 频繁重启，如何排查和解决？

**参考答案：**

**排查步骤：**

1. **查看 Pod 状态和事件：**
```bash
kubectl get pods -n <namespace>
kubectl describe pod <pod-name> -n <namespace>
```

关注：
- RestartCount：重启次数
- Events：最近事件（OOMKilled、CrashLoopBackOff、ImagePullBackOff）
- Last State：上次终止原因

2. **查看 Pod 日志：**
```bash
# 当前日志
kubectl logs <pod-name> -n <namespace>

# 上一个容器日志（重启前）
kubectl logs <pod-name> -n <namespace> --previous

# 实时查看
kubectl logs -f <pod-name> -n <namespace>

# 多容器 Pod
kubectl logs <pod-name> -c <container-name> -n <namespace>
```

3. **检查资源限制：**
```bash
kubectl top pod <pod-name> -n <namespace>
kubectl top node
```

**常见原因和解决方案：**

**1. OOMKilled（内存溢出）：**

**现象：**
```
Last State:     Terminated
  Reason:       OOMKilled
  Exit Code:    137
```

**解决：**
```yaml
resources:
  limits:
    memory: "2Gi"  # 增加内存限制
  requests:
    memory: "1Gi"
```

或优化应用内存使用（如 JVM -Xmx 参数）。

**2. 应用崩溃（Exit Code 非 0）：**

**排查：**
```bash
kubectl logs <pod-name> --previous
```

查看错误日志，修复应用 bug。

**3. 健康检查失败：**

**现象：**
```
Liveness probe failed: Get http://10.0.0.1:8080/health: dial tcp 10.0.0.1:8080: connect: connection refused
```

**解决：**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30  # 增加启动延迟
  periodSeconds: 10
  failureThreshold: 3      # 增加容忍次数
```

或修复健康检查接口。

**4. 配置错误：**

**排查：**
```bash
kubectl get configmap <configmap-name> -o yaml
kubectl get secret <secret-name> -o yaml
```

检查 ConfigMap/Secret 是否正确，环境变量是否配置正确。

**5. 依赖服务不可用：**

应用依赖数据库、Redis 等服务，服务不可用导致启动失败。

**解决：**
- 增加重试逻辑和超时设置
- 使用 Init Container 等待依赖服务就绪：
```yaml
initContainers:
- name: wait-for-db
  image: busybox
  command: ['sh', '-c', 'until nc -z db-service 3306; do sleep 1; done']
```

**6. 镜像问题：**

**现象：**
```
Failed to pull image: rpc error: code = Unknown desc = Error response from daemon: manifest not found
```

**解决：**
- 检查镜像名称和标签是否正确
- 检查镜像仓库凭证（imagePullSecrets）
- 使用 `kubectl run` 测试镜像是否可拉取

**7. 磁盘空间不足：**

**排查：**
```bash
kubectl exec -it <pod-name> -- df -h
```

**解决：**
- 清理日志文件
- 增加磁盘空间
- 配置日志轮转

**8. 节点资源不足：**

**现象：**
```
0/5 nodes are available: 5 Insufficient cpu.
```

**解决：**
- 降低 Pod 资源请求
- 增加节点
- 清理不必要的 Pod

**防范措施：**

1. **合理设置资源 Requests 和 Limits**
2. **配置合理的健康检查**
3. **使用 PodDisruptionBudget 防止过度驱逐**
4. **监控和告警（内存、CPU、重启次数）**
5. **日志集中收集和分析**
6. **定期演练故障恢复**

**我的排查经验：**
曾遇到 Pod 因 OOMKilled 频繁重启，通过 `kubectl top` 发现内存使用持续增长，最终定位到应用内存泄漏，修复后通过增加内存限制解决。

---

## 六、软技能和沟通

### 18. 你如何推动技术改进和最佳实践落地？

**参考答案：**

**我的做法：**

1. **建立技术分享机制：**
   - 定期组织技术分享会（每周/双周）
   - 分享新技术、踩坑经验、最佳实践
   - 撰写技术博客（300+ 篇），团队内部共享

2. **Code Review 文化：**
   - 所有代码必须经过 Review 才能合并
   - Review 重点关注：代码质量、安全性、性能、可维护性
   - 建立 Review Checklist

3. **建立技术规范文档：**
   - Kubernetes 部署规范（资源配置、健康检查、标签规范）
   - Go 代码规范（命名、错误处理、并发安全）
   - Git 工作流规范（分支策略、commit message）

4. **自动化工具和流程：**
   - CI/CD 流程集成 Linting、单元测试、安全扫描
   - 使用 pre-commit hook 强制代码格式化
   - GitOps 流程自动化部署

5. **技术债务管理：**
   - 定期 review 技术债务清单
   - 分配时间偿还技术债（如重构、升级依赖）
   - 在 Sprint 中预留 20% 时间处理技术债务

6. **知识库建设：**
   - 维护 Wiki 文档（架构设计、故障处理手册、FAQ）
   - 记录决策过程（ADR - Architecture Decision Records）
   - Runbook（操作手册、故障恢复流程）

7. **实践项目推动：**
   - 先在小范围试点新技术/最佳实践
   - 总结经验后推广到团队
   - 提供培训和支持

**案例：**

在团队推广 GitOps 时：
1. 选择一个小项目试点 Flux CD
2. 验证效果后撰写技术方案和操作文档
3. 组织技术分享会讲解 GitOps 原理和实践
4. 提供模板和工具支持团队迁移
5. 持续优化流程，收集反馈

最终团队 100% 项目采用 GitOps，部署效率提升 3 倍。

### 19. 遇到技术难题或意见分歧时，你如何处理？

**参考答案：**

**技术难题处理：**

1. **问题拆解：**
   - 将复杂问题拆解为多个小问题
   - 逐个击破，先解决关键路径问题

2. **查阅文档和社区：**
   - 官方文档、GitHub Issues、Stack Overflow
   - 社区讨论、博客文章

3. **实验和验证：**
   - 搭建最小化复现环境
   - 逐步排查，缩小问题范围
   - 记录尝试过程和结果

4. **寻求帮助：**
   - 团队内部讨论（头脑风暴）
   - 咨询有经验的同事或社区专家
   - 提 Issue 或在论坛提问

5. **总结和分享：**
   - 解决后总结经验教训
   - 撰写文档或博客，帮助他人

**意见分歧处理：**

1. **充分沟通：**
   - 各自阐述观点和理由
   - 理解对方关注点和顾虑

2. **基于数据和事实：**
   - 避免主观判断，使用数据支持观点
   - 性能测试、成本分析、风险评估

3. **评估方案优劣：**
   - 列出各方案的优缺点
   - 考虑短期和长期影响
   - 权衡技术债务和开发成本

4. **POC（概念验证）：**
   - 快速实现原型验证可行性
   - 用结果说话

5. **达成共识：**
   - 找到平衡点或折中方案
   - 如果无法达成一致，由技术负责人或团队 Leader 决策
   - 决策后团队统一执行

6. **保持开放心态：**
   - 接受更好的方案
   - 技术决策没有绝对的对错，适合场景最重要

**案例：**

团队在选择服务网格方案时，有人倾向 Istio（功能强大），有人倾向 Linkerd（简单轻量）。

我的做法：
1. 列出两者对比（性能、功能、复杂度、社区支持）
2. 分别搭建 POC 环境测试
3. 评估团队技术栈和维护能力
4. 最终选择 Istio，因为需要高级流量管理功能
5. 制定详细实施计划和培训方案降低复杂度

### 20. 你有什么问题要问我们？

**参考答案：**

**技术相关：**
1. 团队目前使用的技术栈是什么？Kubernetes 版本和规模如何？
2. 算力平台目前支持哪些类型的工作负载（AI训练、推理、HPC等）？
3. 团队在 Kubernetes 和云原生技术方面遇到的主要挑战是什么？
4. 有没有正在进行的技术改进或重构项目？

**团队和文化：**
5. 团队规模和组织架构是怎样的？
6. 团队的技术氛围如何？有技术分享和培训机制吗？
7. 如何平衡业务需求和技术债务？
8. Code Review 和技术规范执行情况如何？

**职业发展：**
9. 这个岗位的职业发展路径是怎样的？
10. 公司对员工技术成长有哪些支持（培训、会议、认证）？
11. 是否有机会参与开源项目或技术社区？

**工作方式：**
12. 团队采用什么开发流程（敏捷、Scrum、看板）？
13. On-call 机制是怎样的？
14. 远程办公政策如何？

**公司和业务：**
15. 公司的主要业务方向和未来规划是什么？
16. 算力平台的用户群体和应用场景有哪些？

---

**面试准备建议：**

1. **深入理解简历中的每个项目**，能够详细解释技术细节和决策过程
2. **准备 STAR 模型回答**（Situation, Task, Action, Result）
3. **熟悉 Kubernetes、Go 核心原理和最佳实践**
4. **准备手写代码**（Go 并发、算法、数据结构）
5. **关注算力平台相关技术**（GPU 调度、分布式训练、资源优化）
6. **准备系统设计题**（画架构图、解释技术选型）
7. **展示技术热情和学习能力**（博客、开源贡献）

祝面试顺利！🎉
