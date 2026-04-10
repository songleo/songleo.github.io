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
- 期望职位：sre 工程师 / 站点可靠性工程师
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

- 熟练使用 linux、shell 及常用命令，具备丰富的系统运维和故障排查经验
- 熟练使用 go、python 等编程语言，能够开发自动化工具和运维系统
- 精通 docker、kubernetes 及云原生技术（openshift、rosa、aks、eks）
- 精通监控和可观测性：prometheus、grafana、alertmanager、thanos、dynatrace、splunk
- 精通自动化运维：ansible、awx、ansible automation platform、event-driven automation
- 熟练掌握多云平台运维：aws、azure 及相关服务（iam、s3、vnet、key vault 等）
- 熟练使用基础设施即代码：terraform、helm、kustomize、gitops (flux cd)
- 熟练掌握 kubernetes 安全：external secrets operator、cert-manager、opa、istio
- 具备完整的 sre 实践经验：监控告警、容量规划、故障恢复、性能优化、自动化运维
- 3 年以上 hpc 软件开发经验，5 年以上云原生平台 sre 经验

## 项目经验

### [云平台监控和自动化运维系统](https://www.redhat.com/en/technologies/management/advanced-cluster-management)

负责云平台监控、自动化和 cluster-api 模块开发。通过 operator 将 prometheus、thanos、grafana 集成，提供完整的多集群监控解决方案。构建基于 prometheus 的监控栈，实现跨集群指标收集、聚合和告警，通过 alertmanager 实现告警路由和静默管理。使用 thanos 实现长期指标存储和跨集群查询。基于 gitops 和 flux cd 实现应用自动化部署和配置漂移检测。使用社区 [cluster-api](https://github.com/kubernetes-sigs/cluster-api) 提供统一入口在多个公有云平台（aws、azure、gcp、ibm cloud）创建 kubernetes 集群。

### kubernetes 平台 sre 和自动化运维

负责多个 kubernetes 集群（openshift、rosa、aks）的稳定性和可靠性保障。构建完整监控告警体系，通过 prometheus 采集集群、节点、pod 和应用层面指标，使用 promql 编写告警规则和记录规则。集成 dynatrace operator 实现深度应用性能监控，通过 fluent bit 集成 splunk 实现日志收集和分析。使用 ansible 和 awx 构建自动化运维平台，实现配置管理、应用部署、故障恢复等任务自动化。通过 event-driven automation 集成 prometheus alertmanager、aws sqs 等事件源，实现基于事件的自动化响应和自愈能力。使用 terraform 管理云基础设施，实现 infrastructure as code。

### 混合云和多云自动化平台

构建跨 aws 和 azure 的 automation mesh 多节点自动化基础设施。使用 ansible automation platform 实现跨云资源配置管理和应用部署，通过 awx rest api 集成现有 itsm 流程。实现 aws 和 azure 之间的 vnet/vpc peering。使用 terraform 管理多云基础设施（aws s3、iam、azure vnet、postgresql 等）。建立统一监控告警平台，聚合不同云平台的指标和日志。使用 external secrets operator 集成 aws secrets manager 和 azure key vault，通过 serviceaccount oidc 认证实现安全密钥管理。部署 cert-manager 实现证书自动化签发和续期。

### ai 作业调度平台实现

使用 golang + python + etcd + rabbitmq 实现高可用 ai 作业调度平台。根据 ai 算法资源需求调度到适合的计算节点，实现资源合理利用和负载均衡。提供独占、抢占等调度策略，支持单点故障。通过命令行和 api 实时监控作业、集群节点状态和资源使用情况。通过 prometheus 暴露自定义指标，使用 grafana 构建监控面板。实现 fairshare 调度策略，按用户和用户组分配资源，动态调整优先级。

### 集群作业调度系统测试自动化

通过 robot framework + jenkins + docker 和 python 开发测试库，实现命令行自动化测试。编写自动化使用手册供 qa 使用，实现回归测试自动化。借助 jenkins 将自动化测试加入 dailybuild，确保代码提交不破坏原有功能。将自动化测试环境以 docker 方式提供给开发人员自测，提高代码质量和开发效率。使用 go + redis 实现配置管理，使用 python + golang 开发命令行工具，提供 webservice api 供第三方集成。

## 技术博客与开源贡献

### 代表性技术文章（300+ 篇云原生技术博客：http://reborncodinglife.com/）

**监控与可观测性**
- [使用 dynatrace 收集 kubernetes 中的 prometheus 指标](http://reborncodinglife.com/2024/03/08/how-to-collect-prometheus-metrics-in-kubernetes-using-dynatrace/)
- [使用 fluent bit 转发 kubernetes 日志到 splunk](http://reborncodinglife.com/2025/05/21/use-fluent-bit-to-forward-k8s-log-to-splunk/)
- [可观测性平台检查清单](http://reborncodinglife.com/2023/02/08/observability-platform-checklist/)

**自动化运维**
- [在多云环境部署 ansible automation mesh](http://reborncodinglife.com/2025/01/09/deploying-automation-mesh-ansible-clouds/)
- [ansible event-driven automation 实践](http://reborncodinglife.com/2024/12/07/ansible-eda/)
- [基于 awx 构建自动化系统](http://reborncodinglife.com/2024/01/07/automation-learning-build-an-automation-system-based-on-awx/)
- [将 ansible automation platform 安装到 azure kubernetes service](http://reborncodinglife.com/2023/06/15/install-aap-to-aks/)

**kubernetes 安全与密钥管理**
- [使用 external secrets 从 aws secrets manager 获取密钥](http://reborncodinglife.com/2026/01/16/use-external-secrets-to-get-secrets-from-aws-secret-mgr/)
- [使用 external secrets 从 azure key vault 获取密钥](http://reborncodinglife.com/2026/01/20/use-external-secrets-to-get-secrets-from-azurekv/)
- [通过 cert-manager 管理证书](http://reborncodinglife.com/2024/12/06/manage-cert-via-cert-manager/)

**gitops 与持续部署**
- [flux 学习：在 kind 中部署 flux](http://reborncodinglife.com/2024/01/09/flux-learning-deploy-flux-in-kind/)
- [flux 学习：gitrepository 规范](http://reborncodinglife.com/2024/01/13/flux-learning-gitrepository-spec/)
- [flux 学习：kustomization 规范](http://reborncodinglife.com/2024/01/13/flux-learning-kustomize-spec/)

**云平台实践**
- [在 rosa 上使用 alb 和 waf](http://reborncodinglife.com/2024/05/11/using-alb-and-waf-on-rosa/)
- [微服务最佳实践](http://reborncodinglife.com/2023/12/09/microservice-best-practices/)

### 开源贡献
- [the way to go 中文译本](https://github.com/Unknwon/the-way-to-go_ZH_CN)：参与该书的翻译和校对
- [the little go book 中文译本](https://github.com/songleo/the-little-go-book_ZH_CN)：完成该书的翻译和校对

## 致谢

感谢您花时间阅读我的简历，期待能有机会和您共事。
