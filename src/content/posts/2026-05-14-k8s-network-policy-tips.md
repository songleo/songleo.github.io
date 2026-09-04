---
title: "k8s network policy tips"
description: "Network Policy 是 Kubernetes 中实现网络隔离和安全控制的核心机制。本文通过大量实例，帮助你快速掌握 Network Policy 的使用。"
pubDatetime: 2026-05-14T00:12:05+08:00
tags: ["kubernetes", "网络", "安全", "最佳实践"]
---
Network Policy 是 Kubernetes 中实现网络隔离和安全控制的核心机制。本文通过大量实例，帮助你快速掌握 Network Policy 的使用。

## 什么是 Network Policy？

**简单理解**：Network Policy 就像是 Pod 之间的"防火墙规则"，控制哪些流量可以进入（Ingress）或离开（Egress）一个 Pod。

**类比**：
- 传统网络：防火墙规则（iptables）
- 云安全组：AWS Security Group、Azure NSG
- Kubernetes：Network Policy

---

## 为什么需要 Network Policy？

### 默认情况（没有 Network Policy）

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│ Frontend│─────▶│ Backend │─────▶│Database │
│  Pod    │      │  Pod    │      │  Pod    │
└─────────┘      └─────────┘      └─────────┘
     │                                   ▲
     │                                   │
     └───────────────────────────────────┘
              可以直接访问！（不安全）
```

**问题**：
- ❌ 任何 Pod 都可以访问数据库
- ❌ 没有网络隔离
- ❌ 安全风险高

### 有了 Network Policy

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│ Frontend│─────▶│ Backend │─────▶│Database │
│  Pod    │  ✅  │  Pod    │  ✅  │  Pod    │
└─────────┘      └─────────┘      └─────────┘
     │                                   ▲
     │            ❌ 拒绝                │
     └───────────────────────────────────┘
```

**优势**：
- ✅ 最小权限原则
- ✅ 网络分段
- ✅ 合规要求（PCI-DSS、HIPAA 等）

---

## 核心概念

### 1. Ingress vs Egress

```yaml
┌──────────────────────────────────────┐
│              Pod                     │
│                                      │
│  ┌────────────────────────────────┐ │
│  │                                │ │
│  │         Application            │ │
│  │                                │ │
│  └────────────────────────────────┘ │
│         ▲                  │         │
│         │ Ingress          │ Egress  │
│         │ (进入Pod)        │ (离开Pod)│
└─────────┼──────────────────┼─────────┘
          │                  │
     其他Pod访问         Pod访问外部
```

- **Ingress（入站）**：其他 Pod/Service → 这个 Pod
- **Egress（出站）**：这个 Pod → 其他 Pod/Service/外部

### 2. Label Selector

Network Policy 使用 Label 选择 Pod：

```yaml
# Pod 定义
apiVersion: v1
kind: Pod
metadata:
  name: backend
  labels:
    app: backend      # ← 这个 label
    tier: api
spec:
  containers:
  - name: app
    image: myapp

---
# Network Policy 通过 label 选择 Pod
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
spec:
  podSelector:
    matchLabels:
      app: backend    # ← 匹配上面的 label
```

### 3. 默认行为

**重要**：
- 如果一个 Pod **没有**任何 Network Policy → 允许所有流量（默认开放）
- 如果一个 Pod **有**至少一个 Network Policy → 拒绝所有流量，只允许策略中明确允许的

---

## 常见场景和配置

### 场景 1：拒绝所有流量（Default Deny）

**需求**：默认拒绝所有进入 Pod 的流量，作为安全基线。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}    # 空选择器 = 选择该 namespace 下的所有 Pod
  policyTypes:
  - Ingress
  # 注意：这里没有 ingress 规则，意味着拒绝所有
```

**效果**：
- ✅ `production` namespace 下所有 Pod 拒绝入站流量
- ⚠️  需要配合其他策略显式允许需要的流量

**同时拒绝出站**：
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  # 既拒绝入站，也拒绝出站
```

---

### 场景 2：允许特定 Pod 访问（最常用）

**需求**：只允许 Frontend Pod 访问 Backend Pod。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-allow-frontend
  namespace: production
spec:
  # 1. 选择要保护的 Pod（Backend）
  podSelector:
    matchLabels:
      app: backend

  policyTypes:
  - Ingress

  ingress:
  # 2. 允许来自 Frontend 的流量
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```

**可视化**：
```
┌─────────────┐         ┌─────────────┐
│  Frontend   │   ✅    │   Backend   │
│ app:frontend│────────▶│ app:backend │
└─────────────┘         │   port:8080 │
                        └─────────────┘
                              ▲
┌─────────────┐               │
│   Other     │      ❌       │
│   Pods      │───────────────┘
└─────────────┘
```

---

### 场景 3：跨 Namespace 访问

**需求**：允许 `monitoring` namespace 的 Prometheus 访问 `production` namespace 的应用。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-prometheus
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend

  policyTypes:
  - Ingress

  ingress:
  - from:
    # 跨 namespace 访问需要 namespaceSelector
    - namespaceSelector:
        matchLabels:
          name: monitoring    # ← Namespace 需要有这个 label
      podSelector:
        matchLabels:
          app: prometheus
    ports:
    - protocol: TCP
      port: 9090    # metrics 端口
```

**前置条件**：给 namespace 打 label
```bash
kubectl label namespace monitoring name=monitoring
```

**可视化**：
```
┌──────────────────────────────────┐
│  monitoring namespace            │
│  (name=monitoring)               │
│                                  │
│  ┌─────────────┐                │
│  │ Prometheus  │                │
│  │app:prometheus                │
│  └──────┬──────┘                │
└─────────┼───────────────────────┘
          │ ✅ 允许访问 :9090
          ▼
┌──────────────────────────────────┐
│  production namespace            │
│                                  │
│  ┌─────────────┐                │
│  │  Backend    │                │
│  │ app:backend │                │
│  └─────────────┘                │
└──────────────────────────────────┘
```

---

### 场景 4：允许访问外部服务（Egress）

**需求**：允许 Pod 访问外部 API（如 `api.example.com`）和 DNS。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-external-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend

  policyTypes:
  - Egress

  egress:
  # 1. 允许访问外部 API (通过 CIDR)
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0    # 所有外部 IP
        except:
        - 10.0.0.0/8       # 排除内网
        - 172.16.0.0/12
        - 192.168.0.0/16
    ports:
    - protocol: TCP
      port: 443    # HTTPS

  # 2. 允许访问 DNS (必须！)
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
```

**重要**：
- ⚠️  如果配置了 Egress 策略，**必须**显式允许 DNS，否则域名解析会失败！
- `0.0.0.0/0` 表示所有 IP，但可以用 `except` 排除内网

---

### 场景 5：同 Namespace 内部互通

**需求**：同一个 namespace 下的所有 Pod 可以互相访问。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
  namespace: production
spec:
  podSelector: {}    # 所有 Pod

  policyTypes:
  - Ingress

  ingress:
  - from:
    - podSelector: {}    # 来自同 namespace 的所有 Pod
```

---

### 场景 6：允许特定 IP 地址访问

**需求**：允许特定 IP 段（如办公网）访问应用。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-office-ip
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend

  policyTypes:
  - Ingress

  ingress:
  - from:
    - ipBlock:
        cidr: 203.0.113.0/24    # 办公网 IP 段
    ports:
    - protocol: TCP
      port: 8080
```

**使用场景**：
- 限制管理界面只能从办公网访问
- 限制数据库只能从特定 IP 访问

---

### 场景 7：多条件组合（AND 逻辑）

**需求**：必须同时满足"来自 frontend Pod" 且 "在 production namespace"。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-strict-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend

  policyTypes:
  - Ingress

  ingress:
  - from:
    # 注意：这是一个 from 项，包含两个 selector
    # 表示 AND 关系：必须同时满足
    - namespaceSelector:
        matchLabels:
          name: production
      podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```

**AND vs OR 的区别**：

```yaml
# AND：同一个 from 项中的多个 selector
ingress:
- from:
  - namespaceSelector: {...}    # 必须同时满足
    podSelector: {...}          # ← 注意没有 "-"

# OR：多个 from 项
ingress:
- from:
  - namespaceSelector: {...}    # 满足这个
  - podSelector: {...}          # 或满足这个 ← 注意有 "-"
```

---

### 场景 8：三层架构完整示例

**架构**：Frontend → Backend → Database

```yaml
# 1. Database：只允许 Backend 访问
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: database

  policyTypes:
  - Ingress

  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 5432    # PostgreSQL

---
# 2. Backend：允许 Frontend 访问，允许出站到 Database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend

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
  # 允许访问 Database
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432

  # 允许 DNS
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53

---
# 3. Frontend：允许外部访问，允许出站到 Backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: frontend

  policyTypes:
  - Ingress
  - Egress

  ingress:
  - from:
    - ipBlock:
        cidr: 0.0.0.0/0    # 允许外部访问
    ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 443

  egress:
  # 允许访问 Backend
  - to:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 8080

  # 允许 DNS
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
```

**流量示意**：
```
Internet
   │
   │ ✅ :80/:443
   ▼
┌─────────────┐
│  Frontend   │
│ app:frontend│
└──────┬──────┘
       │ ✅ :8080
       ▼
┌─────────────┐
│  Backend    │
│ app:backend │
└──────┬──────┘
       │ ✅ :5432
       ▼
┌─────────────┐
│  Database   │
│ app:database│
└─────────────┘

❌ Frontend 无法直接访问 Database
❌ 外部无法直接访问 Backend/Database
```

---

## 高级用法

### 1. 端口范围

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-port-range
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
      endPort: 8090    # 允许 8080-8090 端口范围
```

### 2. 命名端口（Named Port）

```yaml
# Pod 定义中使用命名端口
apiVersion: v1
kind: Pod
metadata:
  name: backend
  labels:
    app: backend
spec:
  containers:
  - name: app
    ports:
    - name: http    # ← 命名端口
      containerPort: 8080

---
# Network Policy 引用命名端口
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
spec:
  podSelector:
    matchLabels:
      app: backend

  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: http    # ← 引用命名端口（推荐）
```

**优势**：
- 更改端口号时，不需要修改 Network Policy
- 更易读

### 3. 多个 Network Policy 叠加（OR 关系）

**重要**：多个 Network Policy 作用于同一个 Pod 时，是 **OR** 关系（取并集）。

```yaml
# Policy 1：允许 Frontend 访问
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend

---
# Policy 2：允许 Monitoring 访问
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-monitoring
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: prometheus
```

**效果**：Backend 同时接受来自 Frontend **或** Prometheus 的流量。

---

## 实战技巧

### 1. 调试 Network Policy

**问题**：配置了 Network Policy 后，连接失败。

**排查步骤**：

```bash
# 1. 检查 Network Policy 是否生效
kubectl get networkpolicy -n production
kubectl describe networkpolicy backend-policy -n production

# 2. 检查 Pod 的 label 是否匹配
kubectl get pods -n production --show-labels

# 3. 检查 CNI 是否支持 Network Policy
# Calico、Cilium、Weave 支持
# Flannel 默认**不支持**（需要 Calico + Flannel）

# 4. 测试连通性
kubectl run test-pod --image=nicolaka/netshoot -it --rm -- /bin/bash
# 在 Pod 内
curl http://backend-service:8080    # 测试能否访问

# 5. 查看 iptables 规则（高级）
# 进入节点
iptables-save | grep <pod-ip>
```

**常见错误**：

| 错误 | 原因 | 解决方法 |
|------|------|---------|
| **忘记允许 DNS** | Egress 策略没有允许 DNS | 显式允许 `kube-dns` |
| **Label 不匹配** | Pod label 和 Policy selector 不一致 | 检查 label |
| **Namespace label 缺失** | 跨 namespace 访问时，namespace 没打 label | `kubectl label ns` |
| **CNI 不支持** | 使用了不支持 Network Policy 的 CNI（如 Flannel） | 更换 CNI 或添加 Calico |

### 2. 渐进式实施策略

**推荐流程**：

```
第 1 步：审计模式（不阻断，只记录）
  ├─ 部署 Network Policy
  ├─ 观察日志，确认不会误伤
  └─ 调整策略

第 2 步：宽松策略
  ├─ 允许同 namespace 互通
  ├─ 允许必要的跨 namespace 访问
  └─ 测试验证

第 3 步：收紧策略
  ├─ 实施最小权限原则
  ├─ 只允许必要的流量
  └─ 持续监控
```

**示例**：先部署宽松策略，再逐步收紧

```yaml
# 阶段 1：允许所有同 namespace 流量
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace-phase1
spec:
  podSelector: {}
  ingress:
  - from:
    - podSelector: {}

# 几天后，确认没问题
# 阶段 2：收紧为特定 Pod
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy-phase2
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend    # 只允许 frontend
```

### 3. 监控 Network Policy

**推荐工具**：

- **Cilium Hubble**：可视化网络流量和策略
- **Calico Enterprise**：Network Policy 审计
- **Open Policy Agent (OPA)**：策略即代码，验证 Network Policy 合规性

**手动检查**：
```bash
# 列出所有 Network Policy
kubectl get netpol -A

# 检查哪些 Pod 受到保护
kubectl get pods -n production -o json | \
  jq '.items[] | select(.metadata.labels.app=="backend") | .metadata.name'

# 检查 Network Policy 覆盖率
# 找出没有 Network Policy 保护的 Pod
kubectl get pods -n production -o json | \
  jq -r '.items[] | select(.metadata.labels | length == 0) | .metadata.name'
```

---

## 最佳实践

### ✅ DO

1. **Default Deny First**
   ```yaml
   # 先部署 default deny，再逐个允许
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: default-deny-all
   spec:
     podSelector: {}
     policyTypes:
     - Ingress
     - Egress
   ```

2. **为所有 Pod 打 Label**
   ```yaml
   # 便于 Network Policy 选择
   metadata:
     labels:
       app: backend
       tier: api
       version: v1
   ```

3. **使用命名端口**
   - 更易维护，端口变更不需要改 Policy

4. **允许 DNS**
   ```yaml
   # Egress 策略中必须允许 DNS
   egress:
   - to:
     - namespaceSelector:
         matchLabels:
           name: kube-system
     ports:
     - protocol: UDP
       port: 53
   ```

5. **给 Namespace 打 Label**
   ```bash
   kubectl label namespace production name=production
   kubectl label namespace monitoring name=monitoring
   ```

6. **文档化策略**
   ```yaml
   # 使用 annotations 说明策略用途
   metadata:
     name: backend-policy
     annotations:
       description: "Only allow frontend pods to access backend"
       owner: "platform-team"
       reviewed: "2026-05-14"
   ```

### ❌ DON'T

1. **不要忘记 DNS**
   - Egress 策略必须允许 DNS，否则域名解析失败

2. **不要使用过宽的 CIDR**
   ```yaml
   # ❌ 不好：允许所有
   - ipBlock:
       cidr: 0.0.0.0/0

   # ✅ 好：明确 IP 范围
   - ipBlock:
       cidr: 203.0.113.0/24
   ```

3. **不要只依赖 Network Policy**
   - 结合 RBAC、Pod Security、Service Mesh 等多层防御

4. **不要忘记测试**
   - 部署前在测试环境验证
   - 使用渐进式策略

---

## 完整示例：微服务应用

**场景**：电商应用，包含 Web、API、Database、Redis、Elasticsearch。

```yaml
# Namespace 和 Label
apiVersion: v1
kind: Namespace
metadata:
  name: ecommerce
  labels:
    name: ecommerce

---
# 1. Default Deny All
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: ecommerce
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

---
# 2. Web Frontend Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: web-policy
  namespace: ecommerce
spec:
  podSelector:
    matchLabels:
      app: web

  policyTypes:
  - Ingress
  - Egress

  ingress:
  # 允许来自 Ingress Controller
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 80

  egress:
  # 允许访问 API
  - to:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - protocol: TCP
      port: 8080

  # DNS
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53

---
# 3. API Backend Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-policy
  namespace: ecommerce
spec:
  podSelector:
    matchLabels:
      app: api

  policyTypes:
  - Ingress
  - Egress

  ingress:
  # 允许来自 Web
  - from:
    - podSelector:
        matchLabels:
          app: web
    ports:
    - protocol: TCP
      port: 8080

  # 允许来自 Prometheus
  - from:
    - namespaceSelector:
        matchLabels:
          name: monitoring
      podSelector:
        matchLabels:
          app: prometheus
    ports:
    - protocol: TCP
      port: 9090

  egress:
  # 允许访问 Database
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432

  # 允许访问 Redis
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379

  # 允许访问 Elasticsearch
  - to:
    - podSelector:
        matchLabels:
          app: elasticsearch
    ports:
    - protocol: TCP
      port: 9200

  # DNS
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53

  # 允许访问外部 API (支付网关等)
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
        - 10.0.0.0/8
        - 172.16.0.0/12
        - 192.168.0.0/16
    ports:
    - protocol: TCP
      port: 443

---
# 4. Database Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-policy
  namespace: ecommerce
spec:
  podSelector:
    matchLabels:
      app: postgres

  policyTypes:
  - Ingress

  ingress:
  # 只允许 API 访问
  - from:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - protocol: TCP
      port: 5432

---
# 5. Redis Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: redis-policy
  namespace: ecommerce
spec:
  podSelector:
    matchLabels:
      app: redis

  policyTypes:
  - Ingress

  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - protocol: TCP
      port: 6379

---
# 6. Elasticsearch Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: elasticsearch-policy
  namespace: ecommerce
spec:
  podSelector:
    matchLabels:
      app: elasticsearch

  policyTypes:
  - Ingress
  - Egress

  ingress:
  # 允许 API 访问
  - from:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - protocol: TCP
      port: 9200

  # 允许 Elasticsearch 集群内部通信
  - from:
    - podSelector:
        matchLabels:
          app: elasticsearch
    ports:
    - protocol: TCP
      port: 9300    # Transport port

  egress:
  # 允许集群内部通信
  - to:
    - podSelector:
        matchLabels:
          app: elasticsearch
    ports:
    - protocol: TCP
      port: 9300

  # DNS
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
```

**架构图**：
```
Internet
   │
   ▼
[Ingress Controller]
   │
   │ ✅ :80
   ▼
┌──────┐
│ Web  │
└───┬──┘
    │ ✅ :8080
    ▼
┌──────┐     ✅ :5432      ┌──────────┐
│ API  │─────────────────▶│ Postgres │
└───┬──┘                   └──────────┘
    │
    ├──✅ :6379──────────▶┌───────┐
    │                     │ Redis │
    │                     └───────┘
    │
    └──✅ :9200──────────▶┌──────────────┐
                          │Elasticsearch │
                          └──────────────┘

✅ Prometheus (monitoring ns) → API :9090
✅ API → External Payment API :443
❌ Web 不能直接访问 Database
❌ 外部不能直接访问 API/Database
```

---

## 总结

### 关键要点

1. **默认拒绝（Default Deny）**：先部署 deny-all，再逐个允许
2. **最小权限**：只允许必要的流量
3. **Label 驱动**：合理使用 Label 和 Selector
4. **不要忘记 DNS**：Egress 策略必须允许 DNS
5. **渐进式实施**：先宽松，再收紧
6. **测试验证**：部署前充分测试

### 快速参考

```yaml
# 模板：基础 Network Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: <policy-name>
  namespace: <namespace>
spec:
  # 1. 选择要保护的 Pod
  podSelector:
    matchLabels:
      app: <app-name>

  # 2. 指定策略类型
  policyTypes:
  - Ingress    # 控制入站
  - Egress     # 控制出站

  # 3. Ingress 规则
  ingress:
  - from:
    # 同 namespace 的特定 Pod
    - podSelector:
        matchLabels:
          app: <source-app>

    # 跨 namespace
    - namespaceSelector:
        matchLabels:
          name: <namespace-name>
      podSelector:
        matchLabels:
          app: <source-app>

    # 特定 IP
    - ipBlock:
        cidr: <ip-range>

    ports:
    - protocol: TCP
      port: <port-number>

  # 4. Egress 规则
  egress:
  # 允许访问特定服务
  - to:
    - podSelector:
        matchLabels:
          app: <target-app>
    ports:
    - protocol: TCP
      port: <port-number>

  # 必须：允许 DNS
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
```
