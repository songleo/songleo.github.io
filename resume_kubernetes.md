## 联系方式

- 手机/微信：18602938087
- 邮箱：lisong1205@gmail.com

## 个人信息

- 姓名：李松松
- 性别：男
- 出生年月：1988 年 12 月
- 毕业时间：2015 年 07 月
- 毕业院校：西安科技大学-硕士-电子与通信工程
- 微信公众号：reborncodinglife
- 博客：[http://reborncodinglife.com/](http://reborncodinglife.com/)
- 期望职位：Kubernetes 平台工程师 / Kubernetes 架构师
- 个人爱好：[阅读](https://github.com/songleo/songleo.github.io/blob/master/_posts/2016-01-30-my-book-list.md)、羽毛球
- 期望城市：西安

## 工作经历

- [北京景行锐创软件有限公司](http://www.jhinno.com/)    2015 年 08 月 - 2018 年 08 月
- [维视科技（西安）有限公司](https://www.deepnorth.cn/)    2018 年 09 月 - 2019 年 04 月
- IBM & Red Hat    2019 年 04 月 - 至今

## 证书与认证

- CKA (Certified Kubernetes Administrator) - Kubernetes 管理员认证
- CKS (Certified Kubernetes Security Specialist) - Kubernetes 安全专家认证
- CSM (Certified ScrumMaster) - 敏捷开发认证
- Microsoft Certified: Azure Fundamentals - 微软 Azure 基础认证

## 专业技能

- 熟练掌握 Kubernetes 核心架构和原理，熟悉 Pod、Service、Deployment、StatefulSet、DaemonSet 等核心资源
- 熟练掌握 Kubernetes Operator 开发，使用 Go 语言和 Operator SDK 开发自定义 CRD 和 Controller
- 熟练掌握 Kubernetes 多集群管理和运维，熟悉 OpenShift、ROSA、AKS、EKS 等企业级发行版
- 熟练掌握 Kubernetes 安全：RBAC、Network Policy、Pod Security、Admission Controller、OPA、External Secrets
- 熟练掌握 Kubernetes 网络：CNI、Service Mesh (Istio)、Ingress Controller (NGINX)、Network Debugging
- 熟练掌握 Kubernetes 存储：PV/PVC、Storage Class、CSI Driver
- 熟练掌握 Kubernetes 应用部署：Helm、Kustomize、GitOps (Flux CD、ArgoCD)
- 熟练掌握 Kubernetes 监控和可观测性：Prometheus Operator、Grafana、Alertmanager、Thanos、ServiceMonitor
- 熟练使用 Go、Python 等语言开发 Kubernetes 相关工具和自动化脚本
- 熟练掌握 Kubernetes 集成云平台：AWS (EKS、IAM、Load Balancer)、Azure (AKS、VNet、Key Vault)
- 熟练使用 client-go、controller-runtime 等 Kubernetes 开发库
- 熟练掌握 Kubernetes 扩展机制：Webhook、Custom Scheduler、Device Plugin、CSI、CNI
- 5 年以上 Kubernetes 平台开发和运维经验

## 项目经验

### [多集群 Kubernetes 监控平台开发](https://www.redhat.com/en/technologies/management/advanced-cluster-management)

使用 Go 语言和 Operator SDK 开发 Kubernetes Operator，实现多集群监控解决方案。开发自定义 CRD (Custom Resource Definition) 和 Controller，通过 Kubernetes API 实现资源的声明式管理。使用 client-go 与 API Server 交互，实现资源的 CRUD 操作、事件监听和状态同步。集成 Prometheus Operator，自动创建 ServiceMonitor、PodMonitor 等监控资源，实现应用的自动化监控。使用 Thanos 实现跨集群指标聚合和长期存储。通过 Admission Webhook 实现资源的验证和变更。深入理解 Kubernetes 控制器模式和调谐循环（Reconciliation Loop），实现资源的自愈能力。

### Kubernetes 平台运维和安全加固

负责多个 Kubernetes 生产集群（OpenShift、ROSA、AKS、EKS）的运维和安全加固。实现基于 RBAC 的细粒度权限控制，设计合理的 Role 和 ClusterRole。部署 Network Policy 实现 Pod 间网络隔离和安全访问控制。使用 Pod Security Standards 和 Admission Controller 强制执行 Pod 安全策略。集成 OPA (Open Policy Agent) 实现策略即代码，通过 Gatekeeper 强制执行集群策略。使用 External Secrets Operator 集成 AWS Secrets Manager 和 Azure Key Vault，通过 ServiceAccount OIDC 认证实现安全的密钥管理。部署 Cert-Manager 实现证书自动化签发和续期，集成 Let's Encrypt 和内部 CA。优化集群性能和资源使用，通过 Resource Quota、Limit Range、HPA、VPA 实现资源管理。

### Kubernetes Operator 和 CRD 开发

使用 Go 语言和 Operator SDK 开发多个生产级 Kubernetes Operators。开发的 Operator 包括：应用生命周期管理 Operator、备份恢复 Operator、证书管理 Operator、密钥同步 Operator 等。深入理解 Kubernetes API Machinery，熟练使用 controller-runtime 框架。实现 Finalizer 机制确保资源正确清理，使用 Owner Reference 建立资源间的父子关系。通过 Webhook 实现 Admission Control，包括 Validating Webhook 和 Mutating Webhook。实现 Custom Scheduler 和 Device Plugin 扩展 Kubernetes 调度能力。使用 Kubebuilder 和 Operator SDK 快速构建 Operator 框架。编写完整的 E2E 测试和单元测试，使用 EnvTest 进行本地测试。

### Kubernetes 应用部署和 GitOps 实践

基于 Flux CD 构建完整的 GitOps 工作流，实现应用的声明式管理和自动化部署。使用 Helm 开发复杂应用的 Chart，通过 HelmRelease CRD 管理应用部署。使用 Kustomize 实现多环境配置管理（dev、staging、production），通过 Kustomization CRD 管理配置覆盖和补丁。实现从 Git 仓库到 Kubernetes 集群的自动同步，通过 GitRepository、OCIRepository 等 Source 资源管理配置源。集成 Image Automation，实现容器镜像的自动更新和 Git Commit。通过 Operator Lifecycle Manager (OLM) 管理 Kubernetes Operators 的生命周期。建立 CI/CD 流程，集成镜像安全扫描（Trivy）和 YAML 配置验证。

### Kubernetes 网络和服务网格

部署和配置 Istio 服务网格，实现微服务的流量管理、安全通信和可观测性。通过 VirtualService 和 DestinationRule 实现金丝雀发布、蓝绿部署和 A/B 测试。配置 PeerAuthentication 和 AuthorizationPolicy 实现服务间的 mTLS 和访问控制。部署 NGINX Ingress Controller，配置 Ingress 资源实现七层负载均衡和基于域名的路由。实现 MetalLB 和 LoadBalancer Service 的集成。深入理解 Kubernetes 网络模型，熟悉 Calico、Flannel 等 CNI 插件。使用 Network Policy 实现 Pod 间网络隔离。掌握 Kubernetes DNS 和 Service Discovery 机制。进行网络故障排查和性能优化。

### Kubernetes 监控和可观测性

部署 Prometheus Operator，通过 ServiceMonitor、PodMonitor、Probe 等 CRD 实现应用监控的自动化配置。使用 PromQL 编写复杂的告警规则和记录规则，通过 PrometheusRule CRD 管理。部署 Alertmanager 实现告警路由、分组和静默管理。使用 Thanos 实现跨集群监控和长期指标存储。集成 Grafana 构建监控面板，使用 Grafana Operator 管理 Dashboard。部署 Fluent Bit 或 Fluentd 作为 DaemonSet 收集容器日志，转发到 Splunk、Elasticsearch 等日志平台。集成 Dynatrace Operator 实现深度应用性能监控。使用 OpenTelemetry Operator 实现分布式追踪。通过 metrics-server 提供 HPA 所需的资源指标。

### 多云 Kubernetes 集群管理

使用 cluster-api 在多个公有云（AWS、Azure、GCP）统一管理 Kubernetes 集群生命周期。通过 cluster-api provider 实现集群的自动化创建、升级和扩缩容。在 AWS 上部署和管理 EKS 集群，集成 AWS Load Balancer Controller、EBS CSI Driver、EFS CSI Driver。配置 IAM Roles for Service Accounts (IRSA) 实现 Pod 的细粒度权限控制。在 Azure 上部署和管理 AKS 集群，集成 Azure Disk CSI Driver、Azure File CSI Driver。实现 VNet Peering 和跨云网络连接。使用 Terraform 管理 Kubernetes 集群的基础设施。实现多集群应用部署和流量分发。

## 技术博客与开源贡献

### 代表性技术文章（300+ 篇 Kubernetes 技术博客：http://reborncodinglife.com/）

**Kubernetes Operator 开发**
- [基于 AWX 构建自动化系统](http://reborncodinglife.com/2024/01/07/automation-learning-build-an-automation-system-based-on-awx/)
- [Operator Lifecycle Manager 介绍](http://reborncodinglife.com/2023/02/01/olm-introduction/)
- [通过 OLM 降级 Operator](http://reborncodinglife.com/2023/04/17/downgrade-operator-via-olm/)

**Kubernetes 安全**
- [使用 External Secrets 从 AWS Secrets Manager 获取密钥](http://reborncodinglife.com/2026/01/16/use-external-secrets-to-get-secrets-from-aws-secret-mgr/)
- [使用 External Secrets 从 Azure Key Vault 获取密钥](http://reborncodinglife.com/2026/01/20/use-external-secrets-to-get-secrets-from-azurekv/)
- [通过 Cert-Manager 管理证书](http://reborncodinglife.com/2024/12/06/manage-cert-via-cert-manager/)
- [Kubernetes Token 和 Kubeconfig](http://reborncodinglife.com/2021/12/29/kubernetes-token-and-kubeconfig/)

**GitOps 和应用部署**
- [在 Kind 中部署 Flux](http://reborncodinglife.com/2024/01/09/flux-learning-deploy-flux-in-kind/)
- [Flux GitRepository 规范](http://reborncodinglife.com/2024/01/13/flux-learning-gitrepository-spec/)
- [Flux Kustomization 规范](http://reborncodinglife.com/2024/01/13/flux-learning-kustomize-spec/)
- [Helm 实践技巧](http://reborncodinglife.com/2020/04/23/helm-tips/)
- [在 Kind 中使用 Ingress 访问应用](http://reborncodinglife.com/2024/01/06/use-ingress-to-access-app-in-kind/)
- [Ingress 常用注解](http://reborncodinglife.com/2024/01/12/ingress-learning-common-annotations/)

**Kubernetes 监控**
- [使用 Dynatrace 收集 Kubernetes 中的 Prometheus 指标](http://reborncodinglife.com/2024/03/08/how-to-collect-prometheus-metrics-in-kubernetes-using-dynatrace/)
- [使用 Fluent Bit 转发 Kubernetes 日志到 Splunk](http://reborncodinglife.com/2025/05/21/use-fluent-bit-to-forward-k8s-log-to-splunk/)
- [在 Kind 中部署 Metrics Server](http://reborncodinglife.com/2024/01/09/deploy-metrics-server-in-kind/)

**Kubernetes 平台实践**
- [在 ROSA 上使用 ALB 和 WAF](http://reborncodinglife.com/2024/05/11/using-alb-and-waf-on-rosa/)
- [将 Ansible Automation Platform 安装到 AKS](http://reborncodinglife.com/2023/06/15/install-aap-to-aks/)
- [Kubernetes 工具集](http://reborncodinglife.com/2024/12/08/kubernetes-tools/)
- [导出和导入应用工作负载](http://reborncodinglife.com/2022/04/15/how-to-export-and-import-app-workloads/)

### 开源贡献

**开源翻译**
- [The Little Go Book 中文译本](https://github.com/songleo/the-little-go-book_ZH_CN) (412 stars) - 完成《Go 简易教程》的翻译和校对
- [The Way to Go 中文译本](https://github.com/Unknwon/the-way-to-go_ZH_CN) - 参与该书的翻译和校对

**Kubernetes 相关开源项目**
- [private-cloud](https://github.com/songleo/private-cloud) - 在 Kubernetes 上快速构建私有云平台，用于云原生技术研究
- [monitoring-system](https://github.com/songleo/monitoring-system) - 基于 Prometheus Operator 和 Grafana 快速搭建 Kubernetes 监控系统
- [automation-system](https://github.com/songleo/automation-system) - 基于 AWX Operator 在 Kubernetes 上快速搭建自动化系统
- [argocd-demo](https://github.com/songleo/argocd-demo) - ArgoCD 在 Kubernetes 中的 GitOps 实践演示
- [vault-gitops](https://github.com/songleo/vault-gitops) - 使用 Flux CD 在 Kubernetes 上部署 Vault
- [grafana-dev-gitops](https://github.com/songleo/grafana-dev-gitops) - Grafana Operator GitOps 部署实践
- [prom-metric-generator](https://github.com/songleo/prom-metric-generator) - Go 语言开发的 Prometheus 指标生成器
- [vector-gitops](https://github.com/songleo/vector-gitops) - Vector 日志收集工具 GitOps 部署

**GitHub 统计**：27 个公开仓库，125 followers

## 致谢

感谢您花时间阅读我的简历，期待能有机会和您共事。
