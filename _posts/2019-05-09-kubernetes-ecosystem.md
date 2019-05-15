---
layout: post
title: kubernetes生态系统
date: 2019-05-09 00:12:05
---

本文主要简单介绍kubernetes生态系统中的相关软件、组件、特性及缩写，持续更新中，更新的原则就是：我在学习kubernetes过程觉得重要或者记不住。

## 1 软件、组件及特性

- alertmanager：展示告警信息，支持集成第三方通知系统，如email、slack等

- calico：提供容器网络服务

- chart：用于描述创建kubernetes应用实例所需要的相关信息

- cronjob：定时执行的批处理作业，kubernetes中一种资源对象

- docker：容器运行时的具体实现，提供容器创建、运行等功能

- elasticsearch：分布式搜索引擎

- elk：elasticsearch + logstash + kibana

- envoy：专为面向服务架构设计的7层代理和通信总线，istio中的sidecar官方标配，是一个面向服务架构的高性能网络代理

- etcd：分布式键值存储系统，提供高可用性和数据一致性

- exporter：收集监控信息

- felix：calico的核心组件，负责设置路由、iptables等信息

- filebeat：日志采集代理，负责收集日志

- grafana：展示系统监控信息

- helm：kubernetes包管理工具，负责应用部署、升级，类似apt-get和ubuntu的关系，主要由客户端helm和服务端tiller组成

- icp：ibm私有云管理平台，提供微服务治理、多集群管理、混合云管理、devops等功能

- istio：微服务治理系统，提供服务发现、服务注册、服务追踪、服务拓扑结构展示、限流、分流、熔断等功能

- jenkins：可扩展的持续集成工具

- kibana：数据分析和可视化平台，提供如柱状图、现状图、饼状图等功能

- kube-apiserver：提供restful api，方便对kubernetes进行控制，例如对集群中所有资源的增删改查，是控制kubernetes集群的唯一入口

- kube-controller-manager：kubernetes的控制器管理系统，负责管理运行的各种控制器

- kube-proxy：网络代理服务，在kubernetes中负责service的具体实现，维护节点上的网络规则和执行网络转发，实现网络代理和负载均衡功能

- kube-scheduler：kubernetes的调度器，负责将pod按不同的资源需求调度到集群中的node节点运行

- kubelet：主要用于和master节点及各种接口通信，例如与container runtime interface通信，将容器在node节点创建并运行起来

- kubernetes：容器管理、编排系统

- knative：是谷歌开源的一套serverless架构方案，它扩展了kubernetes，提供了一组中间件，提高了构建可在本地、云和第三方数据中心等地方运行的现代化、以源为中心且基于容器的应用的能力

- serverless：指的是由开发者实现的服务端逻辑运行在无状态的计算容器中，它由事件触发， 完全被第三方管理，其业务层面的状态则被开发者使用的数据库和存储资源所记录

- kubebuilder：是一个基于crd来构建kubernetes api的框架，可以使用crd来构建api、controller和 admission webhook

- admission：kubernetes中的一种控制器，用于对api对象进行一些初始化性质的工作，对象被创建之后立即调用，支持默认（admission）和动态（dac/initializer）2种方式，istio就是通过dac功能自动注入sidecar到pod，和应用一起在同一个pod工作

- logstash：日志收集，提供分析过滤功能

- operator：是由coreos开发的，用来扩展kubernetes api，特定的应用程序控制器，它用来创建、配置和管理复杂的有状态应用，如数据库、缓存和监控系统，可以认为是crd + controller，crd实现资源的定义，而需要通过controller监控crd实例的增删改查事件，从而实现相应的业务逻辑

- operatorhub：operator仓库，详见https://www.operatorhub.io

- prometheus：容器监控服务，设置告警策略，将告警信息发送给alertmanager

- service catalog：kubernetes的api扩展，方便kubernetes集群内部应用访问第三方提供的服务

- super version：kubernetes中表示一种资源类型的所有版本字段全集，用于描述用户提交的yaml配置文件，通过它可以实现用一种对象管理不同版本的yaml文件

- terraform：iaas层接口

- tiller：helm的服务端，用于管理应用发布

- validation：基于openapi v3 schema的验证机制，检验用户提交的资源定义是否符合规范，检验通过的api对象就是一个有效的kubernetes api对象

- registry：kubernetes中的一种数据结构，用于存储validation通过的api对象 

- finalizer：crd中的用于实现控制器的异步删除钩子

- subresources：crd的子资源定义功能

- categories：对crd进行分组

- aggregation：一种扩展kubernetes api的方法，实现不修改kubernetes核心代码的同时扩展kubernetes api，将第三方服务注册到 kubernetes api中，实现通过kubernetes api访问外部服务，另外一种扩展kubernetes api的方法是crd

- global tags：kubernetes代码中用于控制全局的代码生成功能

- k8s.io/code-generator：kubernetes提供的代码生成工具，用于为crd自动生成clientset、informer、lister，用于实现crd的controller

- kiali：istio的可观察性工具，可视化服务网格拓扑、断路器、请求率和分布式追踪功能

- service graph：和kiali功能差不多的istio服务观察工具

- cadvisor：一种用于监控资源使用情况，并分析容器性能的开源代理

- liveness probe：主动监控容器是否存活的机制

- readiness probe：主动监控容器是否健康或者提供的服务的机制

- horizontal pod autoscaler：通过分析不同的指标信息，动态调整集群pod的数量

## 2 缩写

- crd：custom resource definition，自定义api资源，新版tpr，kubernetes的一种api插件机制，用户提交的新类型定义的yaml就是crd的实例，叫cr（customer resource），借助crd，kubernetes才能识别用户提交的cr

- cr：crd实例

- tpr：third party resource，老版本的crd

- dac：dynamic admission control，也称initializer，一种控制器，用于对创建的api对象进行一些初始化的工作，kubernetes默认就提供了一些initializer

- cidr：classless inter-domain routing，无类域内路由选择

- cc：customer controller，自定义控制器，一个死循环，通过不断对比api对象的实际状态和期望状态，以此为依据实现相应的业务逻辑

- mvcc：多版本并发控制，kubectl apply的实现机制

- rabc：role based access control，基于角色的访问控制

- poc： proof of concept，概念验证

- uas：user aggregated apiserver，一种扩展kubernetes api的机制，类似crd

> 未完待续 ......
