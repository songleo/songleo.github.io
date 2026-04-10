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

- cka (certified kubernetes administrator) - kubernetes 管理员认证
- cks (certified kubernetes security specialist) - kubernetes 安全专家认证
- csm (certified scrummaster) - 敏捷开发认证
- microsoft certified: azure fundamentals - 微软 azure 基础认证

## 专业技能

- 精通 go 语言开发，深入理解并发编程（goroutine、channel）、接口设计、性能优化（字符串、切片、映射、指针）
- 精通 python 开发，熟悉最佳实践、i18n、打包分发等
- 熟练使用 c 语言，具备静态库和动态库开发经验
- 熟练使用 linux、shell 及常用命令，具备良好的 unix/linux 编程基础
- 精通 docker、kubernetes 及云原生应用开发：容器化、operator 开发、crd 设计、helm chart 开发
- 熟练掌握微服务架构设计：单一职责原则、独立数据存储、无状态设计、领域驱动设计
- 熟练使用 git 工作流、分支策略、pr 流程和代码审查
- 熟练掌握单元测试和 tdd：go testing 框架、测试用例设计、代码覆盖率分析
- 熟练掌握 ci/cd：jenkins、github actions、镜像安全扫描（trivy）、自动化测试集成
- 熟练使用云平台 api 和 sdk：aws sdk、azure sdk
- 熟悉 restful api、grpc、webservice 开发，具备良好的 api 设计能力
- 熟练使用基础设施即代码：terraform、helm、kustomize
- 3 年以上 hpc 软件开发经验，5 年以上云原生应用开发经验

## 项目经验

### [云平台监控系统开发](https://www.redhat.com/en/technologies/management/advanced-cluster-management)

使用 go 语言通过 operator sdk 开发 kubernetes operator，将 prometheus、thanos、grafana 等组件集成和二次开发，提供完整的多集群监控解决方案。深度使用 kubernetes api，开发自定义资源（crd）和控制器（controller），实现声明式 api 和资源自动化管理。使用 client-go 与 kubernetes api server 交互，实现资源的 crud 操作、事件监听和状态同步。使用社区 [cluster-api](https://github.com/kubernetes-sigs/cluster-api) 提供统一入口在多个公有云平台（aws、azure、gcp、ibm cloud）创建 kubernetes 集群。通过 go 并发编程优化系统性能，使用 goroutine 和 channel 实现高效异步处理。编写完整单元测试和集成测试，使用 go testing 框架和 mock 技术，确保代码质量和测试覆盖率。

### kubernetes operator 和云原生应用开发

使用 go 语言和 operator sdk 开发多个 kubernetes operators，实现应用生命周期自动化管理。开发的 operator 包括：external secrets operator 集成（支持 aws secrets manager 和 azure key vault）、cert-manager 证书自动化管理、dynatrace operator 监控集成、flux cd gitops 自动化等。深入理解 kubernetes 控制器模式和调谐循环（reconciliation loop），实现资源声明式管理和自愈能力。使用 helm 开发应用 chart，通过模板化和参数化实现应用灵活配置和部署。使用 kustomize 实现多环境配置管理和配置覆盖。

### 微服务架构设计和开发

设计和开发云原生微服务应用，遵循微服务架构最佳实践。采用单一职责原则设计服务边界，每个服务独立的数据存储、构建和部署流程。实现服务无状态设计，支持水平扩展和负载均衡。使用领域驱动设计（ddd）进行系统建模和服务划分。使用 go 语言开发 restful api 和 grpc 服务，实现服务间通信。使用 istio 服务网格实现流量管理、安全通信和可观测性。实现完整 ci/cd 流程，使用 jenkins 和 github actions 实现代码自动化构建、测试和部署。集成 trivy 进行容器镜像安全扫描，使用 linting 工具进行代码质量检查。

### go 语言性能优化和最佳实践

深入实践 go 语言性能优化：字符串拼接优化（strings.builder）、切片容量预分配、映射并发访问同步控制（sync.map、互斥锁）、指针使用优化、接口设计和抽象。实现高效并发模式，使用 goroutine 池控制并发数量，使用 context 实现超时控制和取消传播，使用 channel 实现生产者-消费者模式。编写大量单元测试，覆盖正向、负向和边界测试，使用表驱动测试（table-driven tests）提高可维护性。使用 benchmark 测试进行性能分析，使用 pprof 工具定位和解决性能瓶颈。实现 go 静态库和动态库开发，提供给其他语言调用。

### ai 作业调度平台实现

使用 golang + python + etcd + rabbitmq 实现高可用 ai 作业调度平台。根据 ai 算法资源需求调度到适合的计算节点，实现资源合理利用和负载均衡。提供独占、抢占等调度策略，支持单点故障。使用 go 实现核心调度逻辑，通过 channel 和 goroutine 实现高并发作业调度。使用 etcd 实现分布式锁和配置管理。实现完整 restful api 和 grpc 接口，提供 webservice api 供第三方集成调用，支持 i18n 功能。实现 fairshare 调度策略，按用户和用户组分配资源，动态调整优先级。使用队列、树等数据结构优化调度性能。

### 测试自动化和工具开发

通过 robot framework + jenkins + docker 和 python 开发测试库，实现命令行自动化测试。编写自动化使用手册供 qa 使用，实现回归测试自动化。借助 jenkins 将自动化测试加入 dailybuild，确保代码提交不破坏原有功能。使用 go + redis 实现配置管理，使用 python + golang 开发命令行工具（基于 argparse、click、cobra），提供 webservice api 供第三方集成。使用 terraform 开发基础设施即代码，管理 aws 和 azure 云资源（vpc/vnet、postgresql、s3、iam 等）。

## 技术博客与开源贡献

### 代表性技术文章（300+ 篇云原生技术博客：http://reborncodinglife.com/）

**go 语言开发**
- [go 技巧分享系列文章](https://www.jianshu.com/c/3058964de009) - 涵盖性能优化、并发编程、接口设计等
- [关于单元测试（go）](https://www.jianshu.com/p/4ad45d03c835) - go 单元测试最佳实践

**kubernetes 应用开发**
- [在 kind 中部署 flux](http://reborncodinglife.com/2024/01/09/flux-learning-deploy-flux-in-kind/)
- [flux gitrepository 规范](http://reborncodinglife.com/2024/01/13/flux-learning-gitrepository-spec/)
- [flux kustomization 规范](http://reborncodinglife.com/2024/01/13/flux-learning-kustomize-spec/)
- [通过 cert-manager 管理证书](http://reborncodinglife.com/2024/12/06/manage-cert-via-cert-manager/)
- [使用 external secrets 从 aws secrets manager 获取密钥](http://reborncodinglife.com/2026/01/16/use-external-secrets-to-get-secrets-from-aws-secret-mgr/)
- [使用 external secrets 从 azure key vault 获取密钥](http://reborncodinglife.com/2026/01/20/use-external-secrets-to-get-secrets-from-azurekv/)

**微服务与云原生架构**
- [微服务最佳实践](http://reborncodinglife.com/2023/12/09/microservice-best-practices/)
- [基于 awx 构建自动化系统](http://reborncodinglife.com/2024/01/07/automation-learning-build-an-automation-system-based-on-awx/)
- [operator lifecycle manager 介绍](http://reborncodinglife.com/2023/02/01/olm-introduction/)

**python 开发**
- [python 技巧分享系列文章](https://www.jianshu.com/c/e1d7f53db165) - python 开发技巧和最佳实践

**基础设施即代码**
- [terraform 实践技巧](http://reborncodinglife.com/2025/01/08/terraform-tips/)
- [terraform s3 示例](http://reborncodinglife.com/2026/03/27/terraform-s3-demo/)

**开发实践**
- [我使用最频繁的 10 个 git 命令](https://github.com/songleo/songleo.github.io/blob/master/_posts/2016-04-23-git-common-command.md)
- [工作中的小技巧分享](https://github.com/songleo/songleo.github.io/blob/master/_posts/2016-11-25-knowledge-share-for-dev2.md)

### 开源贡献
- [the way to go 中文译本](https://github.com/Unknwon/the-way-to-go_ZH_CN)：参与该书的翻译和校对
- [the little go book 中文译本](https://github.com/songleo/the-little-go-book_ZH_CN)：完成该书的翻译和校对

## 致谢

感谢您花时间阅读我的简历，期待能有机会和您共事。
