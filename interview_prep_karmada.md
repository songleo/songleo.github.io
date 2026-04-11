# Karmada 多集群管理面试准备文档

深入解析 Karmada 多集群调度、资源分发与故障转移

---

## 一、Karmada 架构与核心概念

### 1. Karmada 是什么？解决了什么问题？

**参考答案：**

**Karmada 定义：**

Karmada (Kubernetes Armada) 是华为开源的多云、多集群容器编排平台，基于 Kubernetes Federation v2 发展而来。

**核心价值：**
- 统一管理多个 Kubernetes 集群
- 跨集群应用分发和调度
- 故障转移和灾难恢复
- 避免厂商锁定

**解决的问题：**

**1. 多集群管理复杂性**

**场景：**
```
企业有多个 Kubernetes 集群：
- 生产集群（AWS us-east-1）
- 灾备集群（AWS us-west-2）
- 边缘集群（阿里云）
- 开发集群（本地）

问题：
- 需要分别登录每个集群操作
- 配置不一致
- 资源无法统一调度
```

**Karmada 解决方案：**
```
┌──────────────────────────────────────────┐
│      Karmada Control Plane (Hub)         │
│  - 统一 API 入口                          │
│  - 多集群调度器                           │
│  - 策略引擎                               │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴───────┬───────────┬────────┐
       │               │           │        │
┌──────▼─────┐  ┌──────▼────┐ ┌───▼───┐ ┌──▼────┐
│  Cluster1  │  │ Cluster2  │ │Cluster3│ │Cluster4│
│  (AWS)     │  │  (AWS)    │ │ (阿里)  │ │ (本地) │
└────────────┘  └───────────┘ └────────┘ └────────┘
```

**2. 跨集群应用分发**

**原生 Kubernetes 问题：**
```bash
# 需要手动部署到每个集群
kubectl --context=cluster1 apply -f app.yaml
kubectl --context=cluster2 apply -f app.yaml
kubectl --context=cluster3 apply -f app.yaml

# 配置可能不一致，容易出错
```

**Karmada 方案：**
```yaml
# 一次定义，多集群分发
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: nginx-propagation
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: nginx
  placement:
    clusterAffinity:
      clusterNames:
      - cluster1
      - cluster2
      - cluster3
```

**3. 跨云跨区域高可用**

**传统方案问题：**
- 单云厂商锁定
- 跨区域手动切换
- 无法自动故障转移

**Karmada 故障转移：**
```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: ha-deployment
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: critical-app
  placement:
    clusterAffinity:
      clusterNames:
      - aws-us-east-1
      - aws-us-west-2
    replicaScheduling:
      replicaDivisionPreference: Weighted
      replicaSchedulingType: Divided
      weightPreference:
        staticWeightList:
        - targetCluster:
            clusterNames:
            - aws-us-east-1
          weight: 2
        - targetCluster:
            clusterNames:
            - aws-us-west-2
          weight: 1
  failover:
    application:
      decisionConditions:
        tolerationSeconds: 300  # 5 分钟后故障转移
```

**Karmada 核心架构：**

```
┌────────────────── Karmada Control Plane ──────────────────┐
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              karmada-apiserver                       │ │
│  │  - Kubernetes API Server 扩展                        │ │
│  │  - 聚合来自成员集群的资源                             │ │
│  └────────────────────┬─────────────────────────────────┘ │
│                       │                                   │
│  ┌────────────────────▼─────────────────────────────────┐ │
│  │         karmada-controller-manager                   │ │
│  │  - Cluster Controller：管理成员集群生命周期           │ │
│  │  - Policy Controller：处理分发策略                   │ │
│  │  - Binding Controller：创建资源绑定                  │ │
│  │  - Execution Controller：同步资源到成员集群           │ │
│  └────────────────────┬─────────────────────────────────┘ │
│                       │                                   │
│  ┌────────────────────▼─────────────────────────────────┐ │
│  │           karmada-scheduler                          │ │
│  │  - 多集群调度器                                       │ │
│  │  - 基于策略和资源选择目标集群                         │ │
│  └────────────────────┬─────────────────────────────────┘ │
│                       │                                   │
│  ┌────────────────────▼─────────────────────────────────┐ │
│  │           karmada-webhook                            │ │
│  │  - Validating Webhook：验证资源                       │ │
│  │  - Mutating Webhook：修改资源                         │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│  Member      │ │  Member      │ │  Member      │
│  Cluster 1   │ │  Cluster 2   │ │  Cluster 3   │
│              │ │              │ │              │
│ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │
│ │ karmada- │ │ │ │ karmada- │ │ │ │ karmada- │ │
│ │  agent   │ │ │ │  agent   │ │ │ │  agent   │ │
│ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │
└──────────────┘ └──────────────┘ └──────────────┘
```

**核心概念：**

**1. Resource Template（资源模板）**

原生 Kubernetes 资源定义，无需修改。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
```

**2. PropagationPolicy（分发策略）**

定义资源如何分发到成员集群。

```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: nginx-propagation
  namespace: default
spec:
  # 选择要分发的资源
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: nginx
  
  # 选择目标集群
  placement:
    # 集群亲和性
    clusterAffinity:
      clusterNames:
      - member1
      - member2
    
    # 集群字段选择器
    clusterSelector:
      matchLabels:
        region: us-east
    
    # 副本调度策略
    replicaScheduling:
      replicaDivisionPreference: Weighted  # Aggregated/Divided/Weighted
      replicaSchedulingType: Divided
      weightPreference:
        staticWeightList:
        - targetCluster:
            clusterNames:
            - member1
          weight: 2
        - targetCluster:
            clusterNames:
            - member2
          weight: 1
```

**3. ClusterPropagationPolicy（全局分发策略）**

集群级别的分发策略，不限定命名空间。

```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: ClusterPropagationPolicy
metadata:
  name: global-configmap-policy
spec:
  resourceSelectors:
  - apiVersion: v1
    kind: ConfigMap
    namespace: kube-system
    name: cluster-info
  placement:
    clusterAffinity:
      clusterNames:
      - member1
      - member2
      - member3
```

**4. ResourceBinding / ClusterResourceBinding**

资源与集群的绑定关系（自动创建）。

```yaml
apiVersion: work.karmada.io/v1alpha2
kind: ResourceBinding
metadata:
  name: nginx-deployment
  namespace: default
spec:
  resource:
    apiVersion: apps/v1
    kind: Deployment
    name: nginx
    namespace: default
  clusters:
  - name: member1
    replicas: 2
  - name: member2
    replicas: 1
```

**5. Work（工作对象）**

在成员集群中实际创建的资源（自动创建）。

```yaml
apiVersion: work.karmada.io/v1alpha1
kind: Work
metadata:
  name: nginx-deployment-member1
  namespace: karmada-es-member1
spec:
  workload:
    manifests:
    - apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: nginx
        namespace: default
      spec:
        replicas: 2  # 已分配到该集群的副本数
        ...
```

**我的理解：**

Karmada 的核心思想是"**Push 模式**"：
1. 用户在 Karmada Control Plane 创建资源
2. PropagationPolicy 定义分发策略
3. Scheduler 选择目标集群
4. Controller 创建 Binding 和 Work
5. Work 被同步到成员集群的 karmada-es-* 命名空间
6. karmada-agent 或 karmada-controller 在成员集群创建实际资源

**优势：**
- 成员集群无需暴露 API Server（安全）
- 单向同步，成员集群故障不影响控制面
- 支持大规模集群（1000+ 集群）

---

## 二、Karmada 安装与集群管理

### 2. 如何安装 Karmada？如何加入成员集群？

**参考答案：**

**安装方式对比：**

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| kubectl-karmada | 快速 | 测试环境 | 开发测试 |
| Helm | 灵活 | 配置复杂 | 生产环境 |
| Operator | 自动化 | 需要 OLM | 企业生产 |
| 二进制 | 轻量 | 手动管理 | 定制化需求 |

**方式 1：使用 kubectl-karmada（推荐快速开始）**

**安装 kubectl-karmada：**
```bash
# 下载 kubectl-karmada
curl -s https://raw.githubusercontent.com/karmada-io/karmada/master/hack/install-cli.sh | bash

# 或手动下载
wget https://github.com/karmada-io/karmada/releases/download/v1.8.0/kubectl-karmada-linux-amd64.tgz
tar -zxvf kubectl-karmada-linux-amd64.tgz
mv kubectl-karmada /usr/local/bin/

# 验证
kubectl karmada version
```

**在 Kind 中快速部署（测试）：**
```bash
# 创建 Kind 集群作为 Host Cluster
cat <<EOF | kind create cluster --name karmada-host --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
EOF

# 初始化 Karmada
kubectl karmada init

# 等待 Karmada 组件就绪
kubectl wait --for=condition=Ready pods --all -n karmada-system --timeout=300s
```

**验证安装：**
```bash
# 查看 Karmada 组件
kubectl get pods -n karmada-system

# 输出示例
NAME                                         READY   STATUS    RESTARTS   AGE
etcd-0                                       1/1     Running   0          2m
karmada-apiserver-6d9b7d5f7c-abcde          1/1     Running   0          2m
karmada-controller-manager-5c8f9d-fghij     1/1     Running   0          2m
karmada-scheduler-7f6b8c9d-klmno            1/1     Running   0          2m
karmada-webhook-5d7c8b-pqrst                1/1     Running   0          2m

# 获取 Karmada API Server 地址
kubectl karmada apiserver-addr
```

**方式 2：使用 Helm 安装（生产环境）**

```bash
# 添加 Helm Repo
helm repo add karmada https://github.com/karmada-io/karmada/tree/master/charts/karmada
helm repo update

# 创建命名空间
kubectl create namespace karmada-system

# 自定义配置
cat <<EOF > karmada-values.yaml
# API Server 配置
apiServer:
  replicaCount: 3  # 高可用
  image:
    repository: docker.io/karmada/karmada-apiserver
    tag: v1.8.0
  resources:
    requests:
      cpu: "500m"
      memory: "1Gi"
    limits:
      cpu: "2000m"
      memory: "4Gi"
  
  # 启用审计
  audit:
    enabled: true
    policy: |
      apiVersion: audit.k8s.io/v1
      kind: Policy
      rules:
      - level: RequestResponse
        verbs: ["create", "update", "patch", "delete"]

# etcd 配置
etcd:
  replicaCount: 3
  persistence:
    enabled: true
    storageClass: "fast-ssd"
    size: 100Gi
  resources:
    requests:
      cpu: "500m"
      memory: "2Gi"

# Controller Manager 配置
controllerManager:
  replicaCount: 2
  resources:
    requests:
      cpu: "500m"
      memory: "1Gi"

# Scheduler 配置
scheduler:
  replicaCount: 2
  resources:
    requests:
      cpu: "200m"
      memory: "500Mi"

# Webhook 配置
webhook:
  replicaCount: 2

# 暴露 API Server
service:
  type: LoadBalancer  # 或 NodePort
EOF

# 安装
helm install karmada karmada/karmada \
  --namespace karmada-system \
  --version 1.8.0 \
  --values karmada-values.yaml

# 等待就绪
kubectl wait --for=condition=Ready pods --all -n karmada-system --timeout=600s
```

**方式 3：生产环境完整部署**

**独立 etcd 集群：**
```bash
# 使用外部 etcd（推荐生产）
helm install karmada karmada/karmada \
  --set etcd.mode=external \
  --set etcd.external.endpoints={https://etcd-1:2379,https://etcd-2:2379,https://etcd-3:2379} \
  --set etcd.external.caFile=/etc/karmada/pki/etcd/ca.crt \
  --set etcd.external.certFile=/etc/karmada/pki/etcd/client.crt \
  --set etcd.external.keyFile=/etc/karmada/pki/etcd/client.key
```

**加入成员集群：**

**Push 模式（推荐）：**

```bash
# 准备成员集群的 kubeconfig
# member1-kubeconfig.yaml
# member2-kubeconfig.yaml

# 方法 1：使用 kubectl-karmada join
kubectl karmada join member1 \
  --kubeconfig=/root/.kube/member1-kubeconfig.yaml \
  --cluster-kubeconfig=/root/.kube/karmada-config

# 方法 2：使用 karmadactl
karmadactl join member1 \
  --cluster-kubeconfig=/root/.kube/member1-kubeconfig.yaml \
  --karmada-context=karmada-apiserver

# 验证集群加入
kubectl get clusters
NAME      VERSION   MODE   READY   AGE
member1   v1.28.0   Push   True    1m
```

**Pull 模式（边缘场景）：**

```bash
# 在成员集群部署 karmada-agent
kubectl karmada register member2 \
  --cluster-kubeconfig=/root/.kube/member2-kubeconfig.yaml \
  --cluster-context=member2-context

# karmada-agent 会部署到成员集群
# 成员集群主动拉取任务
```

**手动加入集群（理解原理）：**

```yaml
# 1. 创建 Cluster 对象
apiVersion: cluster.karmada.io/v1alpha1
kind: Cluster
metadata:
  name: member1
spec:
  apiEndpoint: https://member1-apiserver:6443
  syncMode: Push  # 或 Pull
  secretRef:
    namespace: karmada-cluster
    name: member1-secret

---
# 2. 创建 Secret（包含成员集群的 kubeconfig）
apiVersion: v1
kind: Secret
metadata:
  name: member1-secret
  namespace: karmada-cluster
type: Opaque
data:
  caBundle: <base64-encoded-ca-cert>
  token: <base64-encoded-token>
  # 或完整的 kubeconfig
  kubeconfig: <base64-encoded-kubeconfig>
```

**批量加入集群：**

```bash
#!/bin/bash
# batch-join-clusters.sh

CLUSTERS=("cluster1" "cluster2" "cluster3" "cluster4" "cluster5")
KUBECONFIG_DIR="/root/.kube/clusters"

for cluster in "${CLUSTERS[@]}"; do
  echo "Joining cluster: $cluster"
  
  kubectl karmada join $cluster \
    --kubeconfig=$KUBECONFIG_DIR/${cluster}-kubeconfig.yaml \
    --cluster-kubeconfig=/root/.kube/karmada-config
  
  # 等待集群就绪
  kubectl wait --for=condition=Ready cluster/$cluster --timeout=300s
  
  # 打标签
  kubectl label cluster $cluster \
    region=us-east \
    provider=aws \
    environment=production
done

echo "All clusters joined successfully"
```

**验证集群状态：**

```bash
# 查看集群列表
kubectl get clusters
NAME       VERSION   MODE   READY   AGE
member1    v1.28.0   Push   True    10m
member2    v1.28.0   Push   True    8m
member3    v1.27.5   Pull   True    5m

# 查看集群详情
kubectl describe cluster member1

# 查看集群健康状态
kubectl get cluster member1 -o jsonpath='{.status.conditions}' | jq

# 查看集群资源
kubectl get cluster member1 -o jsonpath='{.status.resourceSummary}' | jq
```

**配置 Kubeconfig 访问 Karmada：**

```bash
# 获取 Karmada API Server 地址
KARMADA_APISERVER=$(kubectl get svc karmada-apiserver -n karmada-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# 生成 kubeconfig
kubectl karmada config \
  --name karmada \
  --server https://$KARMADA_APISERVER:5443 \
  --certificate-authority=/etc/karmada/pki/ca.crt \
  --client-certificate=/etc/karmada/pki/admin.crt \
  --client-key=/etc/karmada/pki/admin.key

# 或者直接使用
export KUBECONFIG=/root/.kube/karmada-config
kubectl config use-context karmada-apiserver
```

**我的实践经验：**

**生产环境部署清单：**
1. **高可用**：
   - API Server 3 副本 + LoadBalancer
   - etcd 3 节点（独立部署，SSD 存储）
   - Controller Manager / Scheduler 2 副本
2. **监控**：
   - Prometheus 监控 Karmada 组件
   - 告警规则覆盖集群离线、资源不足等
3. **备份**：
   - etcd 自动备份（每 6 小时）
   - 保留 7 天备份
4. **安全**：
   - RBAC 配置
   - 审计日志启用
   - Secret 加密（KMS）
5. **网络**：
   - Karmada API Server 独立 VIP
   - 成员集群通过内网访问（VPN/专线）

**集群管理最佳实践：**
- 给集群打标签（region, provider, env）
- 定期检查集群健康状态
- 监控集群资源使用率
- 设置集群准入策略（最小 K8s 版本）

---

## 三、多集群应用分发

### 3. 如何使用 Karmada 分发应用？有哪些调度策略？

**参考答案：**

**应用分发流程：**

```
1. 创建 Resource Template（Deployment/Service等）
                ↓
2. 创建 PropagationPolicy 定义分发策略
                ↓
3. Karmada Scheduler 选择目标集群
                ↓
4. 创建 ResourceBinding 绑定资源和集群
                ↓
5. 创建 Work 对象在成员集群命名空间
                ↓
6. Execution Controller 同步到成员集群
                ↓
7. 成员集群创建实际资源
```

**场景 1：简单分发（指定集群）**

```yaml
# 1. 创建 Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: default
  labels:
    app: nginx
spec:
  replicas: 6
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80

---
# 2. 创建 PropagationPolicy
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: nginx-propagation
  namespace: default
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: nginx
  
  placement:
    clusterAffinity:
      clusterNames:
      - member1
      - member2

# 应用
kubectl apply -f nginx-deployment.yaml
kubectl apply -f nginx-propagation.yaml
```

**场景 2：基于标签选择集群**

```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: app-propagation
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    labelSelector:
      matchLabels:
        propagate: "true"  # 选择有这个标签的 Deployment
  
  placement:
    clusterAffinity:
      # 基于集群标签选择
      labelSelector:
        matchLabels:
          region: us-east
          environment: production
      
      # 或使用表达式
      matchExpressions:
      - key: provider
        operator: In
        values: ["aws", "gcp"]
```

**场景 3：副本分片（Replica Division）**

**策略 1：Aggregated（聚合模式）**

所有副本部署到单个集群。

```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: aggregated-nginx
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: nginx
  
  placement:
    clusterAffinity:
      clusterNames:
      - member1
      - member2
    
    replicaScheduling:
      replicaDivisionPreference: Aggregated  # 聚合模式
      replicaSchedulingType: Duplicated  # 不分片，每个集群都是全量副本
```

**结果：**
```
member1: 6 replicas (完整副本)
member2: 6 replicas (完整副本)
总计: 12 replicas
```

**策略 2：Divided（分片模式）**

副本均匀分布到多个集群。

```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: divided-nginx
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: nginx
  
  placement:
    clusterAffinity:
      clusterNames:
      - member1
      - member2
      - member3
    
    replicaScheduling:
      replicaDivisionPreference: Weighted
      replicaSchedulingType: Divided  # 分片模式
```

**结果（均匀分配）：**
```
member1: 2 replicas
member2: 2 replicas
member3: 2 replicas
总计: 6 replicas
```

**策略 3：Weighted（加权分配）**

根据权重分配副本。

```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: weighted-nginx
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: nginx
  
  placement:
    clusterAffinity:
      clusterNames:
      - member1  # 生产集群（大）
      - member2  # 灾备集群（中）
      - member3  # 边缘集群（小）
    
    replicaScheduling:
      replicaDivisionPreference: Weighted
      replicaSchedulingType: Divided
      weightPreference:
        staticWeightList:
        - targetCluster:
            clusterNames:
            - member1
          weight: 4  # 权重 4
        - targetCluster:
            clusterNames:
            - member2
          weight: 2  # 权重 2
        - targetCluster:
            clusterNames:
            - member3
          weight: 1  # 权重 1
```

**结果（按权重 4:2:1 分配）：**
```
总副本: 6
member1: 6 * (4/7) ≈ 3 replicas
member2: 6 * (2/7) ≈ 2 replicas
member3: 6 * (1/7) ≈ 1 replica
```

**策略 4：动态权重（基于集群资源）**

```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: dynamic-weighted-nginx
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: nginx
  
  placement:
    clusterAffinity:
      clusterNames:
      - member1
      - member2
      - member3
    
    replicaScheduling:
      replicaDivisionPreference: Weighted
      replicaSchedulingType: Divided
      weightPreference:
        dynamicWeight: AvailableReplicas  # 基于可用资源动态分配
```

**Karmada 自动计算权重：**
```
member1: 可用 CPU/Memory 多 → 分配更多副本
member2: 可用 CPU/Memory 中等 → 分配中等副本
member3: 可用 CPU/Memory 少 → 分配较少副本
```

**场景 4：多资源联合分发**

```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: app-bundle-propagation
spec:
  resourceSelectors:
  # 选择多个资源
  - apiVersion: apps/v1
    kind: Deployment
    name: backend
  - apiVersion: v1
    kind: Service
    name: backend-service
  - apiVersion: v1
    kind: ConfigMap
    name: backend-config
  - apiVersion: v1
    kind: Secret
    name: backend-secret
  
  placement:
    clusterAffinity:
      clusterNames:
      - member1
      - member2
  
  # 依赖关系（确保顺序）
  dependentOverrides:
  - name: backend-configmap-override
    resourceSelectors:
    - apiVersion: v1
      kind: ConfigMap
      name: backend-config
```

**场景 5：集群拓扑约束**

```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: spread-constraint
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: ha-app
  
  placement:
    clusterAffinity:
      clusterNames:
      - aws-us-east-1a
      - aws-us-east-1b
      - aws-us-west-2a
      - aws-us-west-2b
    
    # 拓扑约束：跨区域分散
    spreadConstraints:
    - spreadByField: cluster  # 集群维度
      maxSkew: 1  # 最大倾斜度
      minGroups: 2  # 最少分布组数
      whenUnsatisfiable: DoNotSchedule  # 不满足时不调度
```

**场景 6：优先级和抢占**

```yaml
# 1. 定义 PriorityClass
apiVersion: scheduling.karmada.io/v1alpha1
kind: ClusterPropagationPolicy
metadata:
  name: priority-policy
spec:
  priority: 100  # 高优先级
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    labelSelector:
      matchLabels:
        priority: high
  
  placement:
    clusterAffinity:
      clusterNames:
      - member1
      - member2
  
  # 抢占策略
  preemption: Always  # 总是抢占
```

**场景 7：Taint 和 Toleration**

```yaml
# 1. 给集群打 Taint
kubectl taint cluster member3 dedicated=gpu:NoSchedule

# 2. 应用配置 Toleration
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: gpu-app-propagation
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: gpu-training
  
  placement:
    clusterTolerations:
    - key: "dedicated"
      operator: "Equal"
      value: "gpu"
      effect: "NoSchedule"
    
    clusterAffinity:
      clusterNames:
      - member3  # GPU 集群
```

**验证分发结果：**

```bash
# 1. 查看 PropagationPolicy
kubectl get pp

# 2. 查看 ResourceBinding
kubectl get rb nginx-deployment -o yaml

# 输出示例
spec:
  clusters:
  - name: member1
    replicas: 3
  - name: member2
    replicas: 2
  - name: member3
    replicas: 1

# 3. 查看 Work 对象
kubectl get work -A
NAMESPACE                NAME                      AGE
karmada-es-member1       nginx-deployment-member1  5m
karmada-es-member2       nginx-deployment-member2  5m
karmada-es-member3       nginx-deployment-member3  5m

# 4. 在成员集群验证
kubectl --context=member1 get deployment nginx
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
nginx   3/3     3            3           5m

kubectl --context=member2 get deployment nginx
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
nginx   2/2     2            2           5m

# 5. 查看聚合状态
kubectl get deployment nginx -o wide
# Karmada API Server 会聚合显示所有集群的状态
```

**我的实践经验：**

**调度策略选择：**

| 场景 | 推荐策略 | 原因 |
|------|---------|------|
| 生产+灾备 | Weighted (2:1) | 主集群承担主要流量，备集群保持冗余 |
| 多区域负载均衡 | Divided (均匀) | 流量分散，降低单点压力 |
| 边缘+中心 | Weighted (动态) | 边缘资源有限，中心资源充足 |
| 高可用 | Duplicated | 每个集群完整副本，容灾能力强 |

**常见问题：**
1. **副本数不整除**：Karmada 自动向上取整，确保总副本数 >= 期望值
2. **集群资源不足**：调度失败，ResourceBinding 显示错误
3. **集群离线**：副本自动重新调度到其他集群（如启用故障转移）

---

## 四、故障转移与高可用

### 4. Karmada 如何实现故障转移？

**参考答案：**

**Karmada 故障转移机制：**

```
正常状态:
  member1 (健康): 3 replicas
  member2 (健康): 2 replicas
  member3 (健康): 1 replica
         ↓
member2 故障（集群离线）
         ↓
检测到故障（tolerationSeconds 后）
         ↓
触发故障转移
         ↓
重新调度:
  member1 (健康): 4 replicas (+1)
  member3 (健康): 2 replicas (+1)
```

**配置故障转移：**

```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: nginx-with-failover
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: nginx
  
  placement:
    clusterAffinity:
      clusterNames:
      - member1
      - member2
      - member3
    
    replicaScheduling:
      replicaDivisionPreference: Weighted
      replicaSchedulingType: Divided
      weightPreference:
        staticWeightList:
        - targetCluster:
            clusterNames:
            - member1
          weight: 2
        - targetCluster:
            clusterNames:
            - member2
          weight: 1
        - targetCluster:
            clusterNames:
            - member3
          weight: 1
  
  # 故障转移配置
  failover:
    application:
      decisionConditions:
        tolerationSeconds: 300  # 5 分钟后触发故障转移
      purgeMode: Immediately  # 立即清理故障集群资源
      gracePeriodSeconds: 600  # 恢复后的宽限期
```

**故障转移参数详解：**

**1. tolerationSeconds（容忍时间）**

集群失联后多久触发故障转移。

```yaml
failover:
  application:
    decisionConditions:
      tolerationSeconds: 300  # 5 分钟
      
# 推荐值：
# - 临时网络抖动：600s (10 分钟)
# - 生产环境：300s (5 分钟)
# - 对可用性敏感：60s (1 分钟)
```

**2. purgeMode（清理模式）**

故障转移时如何处理原集群资源。

```yaml
failover:
  application:
    purgeMode: Immediately  # 立即清理
    # 或
    purgeMode: Gracefully  # 优雅清理（等待 Pod 停止）
    # 或
    purgeMode: Never  # 不清理（保留）
```

**3. gracePeriodSeconds（恢复宽限期）**

集群恢复后多久重新分配资源。

```yaml
failover:
  application:
    gracePeriodSeconds: 600  # 10 分钟
    
# 作用：避免集群频繁上下线导致的资源抖动
```

**故障转移场景：**

**场景 1：单集群故障**

```yaml
# 初始状态
member1: 3 replicas (weight=3)
member2: 2 replicas (weight=2)
member3: 1 replica  (weight=1)

# member2 离线
# ↓ (300s 后)

# 故障转移后
member1: 4 replicas (接管 +1)
member3: 2 replicas (接管 +1)

# member2 恢复
# ↓ (等待 gracePeriodSeconds)

# 重新平衡
member1: 3 replicas
member2: 2 replicas
member3: 1 replica
```

**场景 2：多集群故障**

```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: multi-failover
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: critical-app
  
  placement:
    clusterAffinity:
      clusterNames:
      - aws-us-east-1  # 主集群
      - aws-us-west-2  # 灾备集群 1
      - gcp-us-central1  # 灾备集群 2
      - azure-eastus   # 灾备集群 3
    
    replicaScheduling:
      replicaDivisionPreference: Weighted
      replicaSchedulingType: Divided
      weightPreference:
        staticWeightList:
        - targetCluster:
            clusterNames:
            - aws-us-east-1
          weight: 4  # 主集群 4 份
        - targetCluster:
            clusterNames:
            - aws-us-west-2
          weight: 2  # 灾备 2 份
        - targetCluster:
            clusterNames:
            - gcp-us-central1
            - azure-eastus
          weight: 1  # 各 1 份
  
  failover:
    application:
      decisionConditions:
        tolerationSeconds: 180  # 3 分钟快速故障转移
```

**场景 3：级联故障转移**

```yaml
# 1. 主集群和灾备集群同时故障
aws-us-east-1: 离线
aws-us-west-2: 离线

# 2. 自动转移到剩余集群
gcp-us-central1: 接管所有副本
azure-eastus: 接管所有副本
```

**场景 4：跨云故障转移**

```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: cross-cloud-failover
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: stateless-app
  
  placement:
    clusterAffinity:
      # 主云厂商（AWS）
      labelSelector:
        matchLabels:
          cloud-provider: aws
          region: us-east
    
    # 灾备云厂商
    clusterTolerations:
    - key: "cloud-provider"
      operator: "In"
      values: ["gcp", "azure"]
      effect: "PreferNoSchedule"
  
  failover:
    application:
      decisionConditions:
        tolerationSeconds: 300
      
      # 跨云故障转移策略
      clusterPreference:
        - name: gcp-us-central1
          weight: 2
        - name: azure-eastus
          weight: 1
```

**监控故障转移：**

**1. 集群健康监控**

```promql
# 集群健康状态
karmada_cluster_ready_status{cluster="member1"}

# 集群离线时长
time() - karmada_cluster_last_transition_time{cluster="member2",condition="Ready",status="False"}

# 故障转移次数
increase(karmada_failover_count{deployment="nginx"}[1h])
```

**2. 告警规则**

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: karmada-failover-alerts
spec:
  groups:
  - name: karmada
    rules:
    # 集群离线告警
    - alert: ClusterOffline
      expr: karmada_cluster_ready_status == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Cluster {{ $labels.cluster }} is offline"
        description: "Cluster has been offline for more than 5 minutes"
    
    # 故障转移触发告警
    - alert: FailoverTriggered
      expr: increase(karmada_failover_count[5m]) > 0
      labels:
        severity: warning
      annotations:
        summary: "Failover triggered for {{ $labels.deployment }}"
        description: "Application {{ $labels.deployment }} failed over to another cluster"
    
    # 多集群故障告警
    - alert: MultiClusterFailure
      expr: count(karmada_cluster_ready_status == 0) >= 2
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "Multiple clusters offline"
        description: "{{ $value }} clusters are offline"
```

**3. Grafana Dashboard**

```json
{
  "panels": [
    {
      "title": "Cluster Health Status",
      "targets": [{
        "expr": "karmada_cluster_ready_status"
      }],
      "type": "stat"
    },
    {
      "title": "Failover Events",
      "targets": [{
        "expr": "increase(karmada_failover_count[1h])"
      }],
      "type": "graph"
    },
    {
      "title": "Replica Distribution",
      "targets": [{
        "expr": "sum by (cluster) (karmada_deployment_replicas)"
      }],
      "type": "piechart"
    }
  ]
}
```

**故障恢复流程：**

**自动恢复：**
```bash
# 1. 集群重新上线
kubectl taint cluster member2 cluster.karmada.io/not-ready:NoSchedule-

# 2. Karmada 检测到集群恢复
# 3. 等待 gracePeriodSeconds
# 4. 自动重新平衡副本

# 查看重新平衡进度
kubectl get rb nginx-deployment -o yaml
```

**手动恢复：**
```bash
# 1. 暂停自动故障转移
kubectl annotate pp nginx-propagation \
  policy.karmada.io/suspend-dispatching="true"

# 2. 手动调整副本分布
kubectl edit rb nginx-deployment

# 3. 恢复自动故障转移
kubectl annotate pp nginx-propagation \
  policy.karmada.io/suspend-dispatching-
```

**我的实践经验：**

**故障转移最佳配置：**
```yaml
# 生产环境推荐
failover:
  application:
    decisionConditions:
      tolerationSeconds: 300  # 5 分钟，平衡快速恢复和误判
    purgeMode: Immediately  # 立即清理，避免资源浪费
    gracePeriodSeconds: 600  # 10 分钟，避免频繁迁移
```

**注意事项：**
1. **有状态应用**：故障转移前确保数据已同步
2. **网络分区**：可能导致脑裂，需要 Fencing 机制
3. **资源不足**：目标集群资源不足时故障转移失败
4. **PVC**：跨集群数据迁移需要额外方案（Velero）

---

## 五、Karmada 最佳实践

### 5. Karmada 生产环境最佳实践有哪些？

**参考答案：**

**1. 架构设计**

**高可用 Karmada Control Plane：**
```yaml
# API Server 3 副本 + LoadBalancer
apiServer:
  replicaCount: 3
  resources:
    requests:
      cpu: 1
      memory: 2Gi
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: karmada-apiserver
        topologyKey: kubernetes.io/hostname

# etcd 独立集群
etcd:
  mode: external
  external:
    endpoints:
    - https://etcd-1.example.com:2379
    - https://etcd-2.example.com:2379
    - https://etcd-3.example.com:2379
```

**2. 集群管理**

**集群分类与标签：**
```bash
# 按环境分类
kubectl label cluster prod-cluster-1 environment=production
kubectl label cluster dev-cluster-1 environment=development

# 按云厂商分类
kubectl label cluster aws-cluster-1 cloud-provider=aws region=us-east-1
kubectl label cluster gcp-cluster-1 cloud-provider=gcp region=us-central1

# 按功能分类
kubectl label cluster gpu-cluster-1 workload-type=training
kubectl label cluster cpu-cluster-1 workload-type=serving
```

**集群配额管理：**
```yaml
apiVersion: cluster.karmada.io/v1alpha1
kind: Cluster
metadata:
  name: member1
spec:
  # ...
  resourceModels:
  - grade: 0
    ranges:
    - name: cpu
      min: "0"
      max: "100"
    - name: memory
      min: "0Gi"
      max: "200Gi"
```

**3. 应用分发策略**

**多层策略设计：**
```yaml
# 1. ClusterPropagationPolicy（全局）
apiVersion: policy.karmada.io/v1alpha1
kind: ClusterPropagationPolicy
metadata:
  name: platform-components
spec:
  resourceSelectors:
  - apiVersion: v1
    kind: Namespace
    name: monitoring
  - apiVersion: apps/v1
    kind: DaemonSet
    namespace: monitoring
    labelSelector:
      matchLabels:
        app: node-exporter
  placement:
    clusterAffinity:
      clusterNames:
      - member1
      - member2
      - member3

---
# 2. PropagationPolicy（命名空间级）
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: app-propagation
  namespace: production
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    labelSelector:
      matchLabels:
        tier: backend
  placement:
    clusterAffinity:
      labelSelector:
        matchLabels:
          environment: production
```

**4. 差异化配置（Override）**

```yaml
apiVersion: policy.karmada.io/v1alpha1
kind: OverridePolicy
metadata:
  name: nginx-override
  namespace: default
spec:
  resourceSelectors:
  - apiVersion: apps/v1
    kind: Deployment
    name: nginx
  
  overrideRules:
  # 规则 1：AWS 集群使用 ALB Ingress
  - targetCluster:
      labelSelector:
        matchLabels:
          cloud-provider: aws
    overriders:
      annotations:
      - path: "/metadata/annotations"
        operator: add
        value:
          kubernetes.io/ingress.class: "alb"
  
  # 规则 2：GCP 集群使用不同镜像仓库
  - targetCluster:
      labelSelector:
        matchLabels:
          cloud-provider: gcp
    overriders:
      imageOverrider:
      - component: Registry
        operator: replace
        value: gcr.io/my-project
  
  # 规则 3：GPU 集群添加资源请求
  - targetCluster:
      clusterNames:
      - gpu-cluster-1
    overriders:
      plaintext:
      - path: "/spec/template/spec/containers/0/resources"
        operator: add
        value:
          limits:
            nvidia.com/gpu: "1"
```

**5. 监控和可观测性**

**Karmada Metrics：**
```yaml
# ServiceMonitor for Karmada components
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: karmada-metrics
  namespace: karmada-system
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: karmada
  endpoints:
  - port: metrics
    interval: 30s
```

**关键指标：**
```promql
# 集群健康度
sum(karmada_cluster_ready_status) / count(karmada_cluster_ready_status)

# 资源分发延迟
histogram_quantile(0.99, 
  sum(rate(karmada_work_sync_duration_seconds_bucket[5m])) by (le)
)

# ResourceBinding 数量
count(karmada_resourcebinding_count)

# Failover 事件
rate(karmada_failover_count[5m])
```

**6. 安全最佳实践**

**RBAC 配置：**
```yaml
# 团队 A 只能管理自己的命名空间
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: team-a-role
  namespace: team-a
rules:
- apiGroups: ["apps", ""]
  resources: ["deployments", "services", "configmaps"]
  verbs: ["get", "list", "create", "update", "delete"]
- apiGroups: ["policy.karmada.io"]
  resources: ["propagationpolicies"]
  verbs: ["get", "list", "create", "update", "delete"]

---
# 集群管理员可以管理所有集群
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cluster-admin-role
rules:
- apiGroups: ["cluster.karmada.io"]
  resources: ["clusters"]
  verbs: ["*"]
- apiGroups: ["policy.karmada.io"]
  resources: ["clusterpropagationpolicies"]
  verbs: ["*"]
```

**7. 备份和灾难恢复**

```bash
# 备份 Karmada etcd
ETCDCTL_API=3 etcdctl snapshot save /backup/karmada-snapshot.db \
  --endpoints=https://karmada-etcd:2379 \
  --cacert=/etc/karmada/pki/etcd/ca.crt \
  --cert=/etc/karmada/pki/etcd/client.crt \
  --key=/etc/karmada/pki/etcd/client.key

# 备份 Karmada 资源
kubectl get clusters -o yaml > clusters-backup.yaml
kubectl get propagationpolicies --all-namespaces -o yaml > policies-backup.yaml
kubectl get clusterpropagationpolicies -o yaml > cluster-policies-backup.yaml
```

**8. 成本优化**

**资源利用率优化：**
```yaml
# 使用动态权重自动平衡
replicaScheduling:
  replicaDivisionPreference: Weighted
  weightPreference:
    dynamicWeight: AvailableReplicas
```

**Spot 实例利用：**
```yaml
# Spot 集群降低优先级
kubectl label cluster spot-cluster-1 \
  node-lifecycle=spot \
  priority=low

# 容忍 Spot 中断
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: batch-job-propagation
spec:
  resourceSelectors:
  - apiVersion: batch/v1
    kind: Job
    labelSelector:
      matchLabels:
        workload-type: batch
  placement:
    clusterAffinity:
      labelSelector:
        matchLabels:
          node-lifecycle: spot
    # Spot 中断时自动故障转移
  failover:
    application:
      decisionConditions:
        tolerationSeconds: 60
```

**我的生产环境配置：**

```yaml
# 典型的生产环境配置
架构:
  - Karmada Control Plane: 3 副本
  - etcd: 独立 3 节点集群
  - 成员集群: 10+ 集群

集群分类:
  - 生产集群: 2 个（主+灾备）
  - 测试集群: 2 个
  - 边缘集群: 6+ 个

监控:
  - Prometheus 采集 Karmada 指标
  - Grafana Dashboard
  - PagerDuty 告警

备份:
  - etcd 自动备份（每 6 小时）
  - 资源定义备份到 Git

安全:
  - RBAC 按团队隔离
  - Audit Log 启用
  - 成员集群通过内网连接

成本:
  - 生产集群: On-Demand
  - 测试集群: Spot Instance
  - 边缘集群: 混合模式
```

---

## 致谢

本文档深入介绍了 Karmada 多集群管理的核心概念、应用分发、故障转移和最佳实践。Karmada 作为云原生多集群管理的标准，在跨云、跨区域、跨边缘场景下提供了强大的能力。

**延伸阅读：**
- [Karmada 官方文档](https://karmada.io/docs/)
- [Karmada GitHub](https://github.com/karmada-io/karmada)
- [多集群服务治理](https://karmada.io/docs/userguide/service/)
