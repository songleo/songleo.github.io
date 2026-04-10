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
- 期望职位：SRE 工程师 / 站点可靠性工程师
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

- 熟练使用 Linux、Shell 及常用命令，具备丰富的系统运维和故障排查经验
- 熟练使用 Go、Python 等编程语言，能够开发自动化工具和运维系统
- 熟练掌握 Docker、Kubernetes 及云原生技术（OpenShift、ROSA、AKS、EKS）
- 熟练掌握监控和可观测性：Prometheus、Grafana、Alertmanager、Thanos、Dynatrace、Splunk
- 熟练掌握自动化运维：Ansible、AWX、Ansible Automation Platform、Event-Driven Automation
- 熟练掌握多云平台运维：AWS、Azure 及相关服务（IAM、S3、VNet、Key Vault 等）
- 熟练使用基础设施即代码：Terraform、Helm、Kustomize、GitOps (Flux CD)
- 熟练掌握 Kubernetes 安全：External Secrets Operator、Cert-Manager、OPA、Istio
- 具备完整的 SRE 实践经验：监控告警、容量规划、故障恢复、性能优化、自动化运维
- 3 年以上 HPC 软件开发经验，5 年以上云原生平台 SRE 经验

## 项目经验

### [云平台监控和自动化运维系统](https://www.redhat.com/en/technologies/management/advanced-cluster-management)

负责云平台监控、自动化和 cluster-api 模块开发。通过 Operator 将 Prometheus、Thanos、Grafana 集成，提供完整的多集群监控解决方案。构建基于 Prometheus 的监控栈，实现跨集群指标收集、聚合和告警，通过 Alertmanager 实现告警路由和静默管理。使用 Thanos 实现长期指标存储和跨集群查询。基于 GitOps 和 Flux CD 实现应用自动化部署和配置漂移检测。使用社区 [cluster-api](https://github.com/kubernetes-sigs/cluster-api) 提供统一入口在多个公有云平台（AWS、Azure、GCP、IBM Cloud）创建 Kubernetes 集群。

### Kubernetes 平台 SRE 和自动化运维

负责多个 Kubernetes 集群（OpenShift、ROSA、AKS）的稳定性和可靠性保障。构建完整监控告警体系，通过 Prometheus 采集集群、节点、Pod 和应用层面指标，使用 PromQL 编写告警规则和记录规则。集成 Dynatrace Operator 实现深度应用性能监控，通过 Fluent Bit 集成 Splunk 实现日志收集和分析。使用 Ansible 和 AWX 构建自动化运维平台，实现配置管理、应用部署、故障恢复等任务自动化。通过 Event-Driven Automation 集成 Prometheus Alertmanager、AWS SQS 等事件源，实现基于事件的自动化响应和自愈能力。使用 Terraform 管理云基础设施，实现 Infrastructure as Code。

### 混合云和多云自动化平台

构建跨 AWS 和 Azure 的 Automation Mesh 多节点自动化基础设施。使用 Ansible Automation Platform 实现跨云资源配置管理和应用部署，通过 AWX REST API 集成现有 ITSM 流程。实现 AWS 和 Azure 之间的 VNet/VPC Peering。使用 Terraform 管理多云基础设施（AWS S3、IAM、Azure VNet、PostgreSQL 等）。建立统一监控告警平台，聚合不同云平台的指标和日志。使用 External Secrets Operator 集成 AWS Secrets Manager 和 Azure Key Vault，通过 ServiceAccount OIDC 认证实现安全密钥管理。部署 Cert-Manager 实现证书自动化签发和续期。

### AI 作业调度平台实现

使用 Go + Python + etcd + RabbitMQ 实现高可用 AI 作业调度平台。根据 AI 算法资源需求调度到适合的计算节点，实现资源合理利用和负载均衡。提供独占、抢占等调度策略，支持单点故障。通过命令行和 API 实时监控作业、集群节点状态和资源使用情况。通过 Prometheus 暴露自定义指标，使用 Grafana 构建监控面板。实现 FairShare 调度策略，按用户和用户组分配资源，动态调整优先级。

### 集群作业调度系统测试自动化

通过 Robot Framework + Jenkins + Docker 和 Python 开发测试库，实现命令行自动化测试。编写自动化使用手册供 QA 使用，实现回归测试自动化。借助 Jenkins 将自动化测试加入 DailyBuild，确保代码提交不破坏原有功能。将自动化测试环境以 Docker 方式提供给开发人员自测，提高代码质量和开发效率。使用 Go + Redis 实现配置管理，使用 Python + Go 开发命令行工具，提供 WebService API 供第三方集成。

## 技术博客与开源贡献

### 代表性技术文章（300+ 篇云原生技术博客：http://reborncodinglife.com/）

**监控与可观测性**
- [使用 Dynatrace 收集 Kubernetes 中的 Prometheus 指标](http://reborncodinglife.com/2024/03/08/how-to-collect-prometheus-metrics-in-kubernetes-using-dynatrace/)
- [使用 Fluent Bit 转发 Kubernetes 日志到 Splunk](http://reborncodinglife.com/2025/05/21/use-fluent-bit-to-forward-k8s-log-to-splunk/)
- [可观测性平台检查清单](http://reborncodinglife.com/2023/02/08/observability-platform-checklist/)

**自动化运维**
- [在多云环境部署 Ansible Automation Mesh](http://reborncodinglife.com/2025/01/09/deploying-automation-mesh-ansible-clouds/)
- [Ansible Event-Driven Automation 实践](http://reborncodinglife.com/2024/12/07/ansible-eda/)
- [基于 AWX 构建自动化系统](http://reborncodinglife.com/2024/01/07/automation-learning-build-an-automation-system-based-on-awx/)
- [将 Ansible Automation Platform 安装到 Azure Kubernetes Service](http://reborncodinglife.com/2023/06/15/install-aap-to-aks/)

**Kubernetes 安全与密钥管理**
- [使用 External Secrets 从 AWS Secrets Manager 获取密钥](http://reborncodinglife.com/2026/01/16/use-external-secrets-to-get-secrets-from-aws-secret-mgr/)
- [使用 External Secrets 从 Azure Key Vault 获取密钥](http://reborncodinglife.com/2026/01/20/use-external-secrets-to-get-secrets-from-azurekv/)
- [通过 Cert-Manager 管理证书](http://reborncodinglife.com/2024/12/06/manage-cert-via-cert-manager/)

**GitOps 与持续部署**
- [Flux 学习：在 Kind 中部署 Flux](http://reborncodinglife.com/2024/01/09/flux-learning-deploy-flux-in-kind/)
- [Flux 学习：GitRepository 规范](http://reborncodinglife.com/2024/01/13/flux-learning-gitrepository-spec/)
- [Flux 学习：Kustomization 规范](http://reborncodinglife.com/2024/01/13/flux-learning-kustomize-spec/)

**云平台实践**
- [在 ROSA 上使用 ALB 和 WAF](http://reborncodinglife.com/2024/05/11/using-alb-and-waf-on-rosa/)
- [微服务最佳实践](http://reborncodinglife.com/2023/12/09/microservice-best-practices/)

### 开源贡献

**开源翻译**
- [The Little Go Book 中文译本](https://github.com/songleo/the-little-go-book_ZH_CN) (412 stars) - 完成《Go 简易教程》的翻译和校对
- [The Way to Go 中文译本](https://github.com/Unknwon/the-way-to-go_ZH_CN) - 参与该书的翻译和校对

**开源项目**
- [monitoring-system](https://github.com/songleo/monitoring-system) - 基于 Prometheus 和 Grafana 快速搭建监控系统的工具
- [private-cloud](https://github.com/songleo/private-cloud) - 在 Kubernetes 上快速构建私有云平台，用于云原生技术研究
- [automation-system](https://github.com/songleo/automation-system) - 基于 AWX 快速搭建自动化系统的工具
- [prom-metric-generator](https://github.com/songleo/prom-metric-generator) - Go 语言开发的 Prometheus 指标生成器
- [vault-gitops](https://github.com/songleo/vault-gitops) - 使用 GitOps 方式部署 Vault
- [argocd-demo](https://github.com/songleo/argocd-demo) - ArgoCD GitOps 实践演示项目

**GitHub 统计**：27 个公开仓库，125 followers

## 致谢

感谢您花时间阅读我的简历，期待能有机会和您共事。
