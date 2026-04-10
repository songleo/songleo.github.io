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
- 期望职位：软件开发工程师
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

- 熟练掌握 Go 语言开发，深入理解并发编程（Goroutine、Channel）、接口设计、性能优化（字符串、切片、映射、指针）
- 熟练掌握 Python 开发，熟悉最佳实践、i18n、打包分发等
- 熟练使用 C 语言，具备静态库和动态库开发经验
- 熟练使用 Linux、Shell 及常用命令，具备良好的 Unix/Linux 编程基础
- 熟练掌握 Docker、Kubernetes 及云原生应用开发：容器化、Operator 开发、CRD 设计、Helm Chart 开发
- 熟练掌握微服务架构设计：单一职责原则、独立数据存储、无状态设计、领域驱动设计
- 熟练使用 Git 工作流、分支策略、PR 流程和代码审查
- 熟练掌握单元测试和 TDD：Go Testing 框架、测试用例设计、代码覆盖率分析
- 熟练掌握 CI/CD：Jenkins、GitHub Actions、镜像安全扫描（Trivy）、自动化测试集成
- 熟练使用云平台 API 和 SDK：AWS SDK、Azure SDK
- 熟悉 RESTful API、gRPC、WebService 开发，具备良好的 API 设计能力
- 熟练使用基础设施即代码：Terraform、Helm、Kustomize
- 3 年以上 HPC 软件开发经验，5 年以上云原生应用开发经验

## 项目经验

### [云平台监控系统开发](https://www.redhat.com/en/technologies/management/advanced-cluster-management)

使用 Go 语言通过 Operator SDK 开发 Kubernetes Operator，将 Prometheus、Thanos、Grafana 等组件集成和二次开发，提供完整的多集群监控解决方案。深度使用 Kubernetes API，开发自定义资源（CRD）和控制器（Controller），实现声明式 API 和资源自动化管理。使用 client-go 与 Kubernetes API Server 交互，实现资源的 CRUD 操作、事件监听和状态同步。使用社区 [cluster-api](https://github.com/kubernetes-sigs/cluster-api) 提供统一入口在多个公有云平台（AWS、Azure、GCP、IBM Cloud）创建 Kubernetes 集群。通过 Go 并发编程优化系统性能，使用 Goroutine 和 Channel 实现高效异步处理。编写完整单元测试和集成测试，使用 Go Testing 框架和 Mock 技术，确保代码质量和测试覆盖率。

### Kubernetes Operator 和云原生应用开发

使用 Go 语言和 Operator SDK 开发多个 Kubernetes Operators，实现应用生命周期自动化管理。开发的 Operator 包括：External Secrets Operator 集成（支持 AWS Secrets Manager 和 Azure Key Vault）、Cert-Manager 证书自动化管理、Dynatrace Operator 监控集成、Flux CD GitOps 自动化等。深入理解 Kubernetes 控制器模式和调谐循环（Reconciliation Loop），实现资源声明式管理和自愈能力。使用 Helm 开发应用 Chart，通过模板化和参数化实现应用灵活配置和部署。使用 Kustomize 实现多环境配置管理和配置覆盖。

### 微服务架构设计和开发

设计和开发云原生微服务应用，遵循微服务架构最佳实践。采用单一职责原则设计服务边界，每个服务独立的数据存储、构建和部署流程。实现服务无状态设计，支持水平扩展和负载均衡。使用领域驱动设计（DDD）进行系统建模和服务划分。使用 Go 语言开发 RESTful API 和 gRPC 服务，实现服务间通信。使用 Istio 服务网格实现流量管理、安全通信和可观测性。实现完整 CI/CD 流程，使用 Jenkins 和 GitHub Actions 实现代码自动化构建、测试和部署。集成 Trivy 进行容器镜像安全扫描，使用 Linting 工具进行代码质量检查。

### Go 语言性能优化和最佳实践

深入实践 Go 语言性能优化：字符串拼接优化（strings.Builder）、切片容量预分配、映射并发访问同步控制（sync.Map、互斥锁）、指针使用优化、接口设计和抽象。实现高效并发模式，使用 Goroutine 池控制并发数量，使用 Context 实现超时控制和取消传播，使用 Channel 实现生产者-消费者模式。编写大量单元测试，覆盖正向、负向和边界测试，使用表驱动测试（Table-Driven Tests）提高可维护性。使用 Benchmark 测试进行性能分析，使用 pprof 工具定位和解决性能瓶颈。实现 Go 静态库和动态库开发，提供给其他语言调用。

### AI 作业调度平台实现

使用 Go + Python + etcd + RabbitMQ 实现高可用 AI 作业调度平台。根据 AI 算法资源需求调度到适合的计算节点，实现资源合理利用和负载均衡。提供独占、抢占等调度策略，支持单点故障。使用 Go 实现核心调度逻辑，通过 Channel 和 Goroutine 实现高并发作业调度。使用 etcd 实现分布式锁和配置管理。实现完整 RESTful API 和 gRPC 接口，提供 WebService API 供第三方集成调用，支持 i18n 功能。实现 FairShare 调度策略，按用户和用户组分配资源，动态调整优先级。使用队列、树等数据结构优化调度性能。

### 测试自动化和工具开发

通过 Robot Framework + Jenkins + Docker 和 Python 开发测试库，实现命令行自动化测试。编写自动化使用手册供 QA 使用，实现回归测试自动化。借助 Jenkins 将自动化测试加入 DailyBuild，确保代码提交不破坏原有功能。使用 Go + Redis 实现配置管理，使用 Python + Go 开发命令行工具（基于 argparse、click、cobra），提供 WebService API 供第三方集成。使用 Terraform 开发基础设施即代码，管理 AWS 和 Azure 云资源（VPC/VNet、PostgreSQL、S3、IAM 等）。

## 技术博客与开源贡献

### 代表性技术文章（300+ 篇云原生技术博客：http://reborncodinglife.com/）

**Go 语言开发**
- [Go 技巧分享系列文章](https://www.jianshu.com/c/3058964de009) - 涵盖性能优化、并发编程、接口设计等
- [关于单元测试（Go）](https://www.jianshu.com/p/4ad45d03c835) - Go 单元测试最佳实践

**Kubernetes 应用开发**
- [在 Kind 中部署 Flux](http://reborncodinglife.com/2024/01/09/flux-learning-deploy-flux-in-kind/)
- [Flux GitRepository 规范](http://reborncodinglife.com/2024/01/13/flux-learning-gitrepository-spec/)
- [Flux Kustomization 规范](http://reborncodinglife.com/2024/01/13/flux-learning-kustomize-spec/)
- [通过 Cert-Manager 管理证书](http://reborncodinglife.com/2024/12/06/manage-cert-via-cert-manager/)
- [使用 External Secrets 从 AWS Secrets Manager 获取密钥](http://reborncodinglife.com/2026/01/16/use-external-secrets-to-get-secrets-from-aws-secret-mgr/)
- [使用 External Secrets 从 Azure Key Vault 获取密钥](http://reborncodinglife.com/2026/01/20/use-external-secrets-to-get-secrets-from-azurekv/)

**微服务与云原生架构**
- [微服务最佳实践](http://reborncodinglife.com/2023/12/09/microservice-best-practices/)
- [基于 AWX 构建自动化系统](http://reborncodinglife.com/2024/01/07/automation-learning-build-an-automation-system-based-on-awx/)
- [Operator Lifecycle Manager 介绍](http://reborncodinglife.com/2023/02/01/olm-introduction/)

**Python 开发**
- [Python 技巧分享系列文章](https://www.jianshu.com/c/e1d7f53db165) - Python 开发技巧和最佳实践

**基础设施即代码**
- [Terraform 实践技巧](http://reborncodinglife.com/2025/01/08/terraform-tips/)
- [Terraform S3 示例](http://reborncodinglife.com/2026/03/27/terraform-s3-demo/)

**开发实践**
- [我使用最频繁的 10 个 Git 命令](https://github.com/songleo/songleo.github.io/blob/master/_posts/2016-04-23-git-common-command.md)
- [工作中的小技巧分享](https://github.com/songleo/songleo.github.io/blob/master/_posts/2016-11-25-knowledge-share-for-dev2.md)

### 开源贡献

**开源翻译**
- [The Little Go Book 中文译本](https://github.com/songleo/the-little-go-book_ZH_CN) (412 stars) - 完成《Go 简易教程》的翻译和校对
- [The Way to Go 中文译本](https://github.com/Unknwon/the-way-to-go_ZH_CN) - 参与该书的翻译和校对

**开源项目**
- [prom-metric-generator](https://github.com/songleo/prom-metric-generator) - 使用 Go 语言开发的 Prometheus 指标生成器，支持配置化生成指标
- [monitoring-system](https://github.com/songleo/monitoring-system) - 基于 Prometheus 和 Grafana 快速搭建监控系统的 Shell 工具
- [private-cloud](https://github.com/songleo/private-cloud) - 在 Kubernetes 上快速构建私有云平台，用于云原生技术研究和学习
- [automation-system](https://github.com/songleo/automation-system) - 基于 AWX 快速搭建自动化系统的 Shell 工具
- [vault-gitops](https://github.com/songleo/vault-gitops) - 使用 GitOps 方式部署 Vault 密钥管理系统
- [argocd-demo](https://github.com/songleo/argocd-demo) - ArgoCD GitOps 实践演示项目
- [grafana-dev-gitops](https://github.com/songleo/grafana-dev-gitops) - Grafana GitOps 部署实践

**GitHub 统计**：27 个公开仓库，125 followers

## 致谢

感谢您花时间阅读我的简历，期待能有机会和您共事。
