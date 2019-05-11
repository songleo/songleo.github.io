---
layout: post
title: kubernetes生态系统
date: 2019-05-09 00:12:05
---

本文主要简单介绍kubernetes生态系统中的相关软件、组件及缩写，持续更新中。

## 1 软件及组件

- alertmanager：展示告警信息，支持集成第三方通知系统，如email、slack等

- calico：提供容器网络服务

- chart：用于描述创建一个kubernetes应用实例需要的信息

- docker：容器运行时，提供容器创建、运行等功能

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

- kubebuilder：是一个基于crd来构建kubernetes api的框架，可以使用crd来构建api、controller和 admission webhook

- logstash：日志收集，提供分析过滤功能

- operator：是由coreos开发的，用来扩展kubernetes api，特定的应用程序控制器，它用来创建、配置和管理复杂的有状态应用，如数据库、缓存和监控系统。

- operatorhub：operator仓库，详见https://www.operatorhub.io

- prometheus：容器监控服务，设置告警策略，将告警信息发送给alertmanager

- service catalog：kubernetes的api扩展，方便kubernetes集群内部应用访问第三方提供的服务

- terraform：iaas层接口

- tiller：helm的服务端

## 2 缩写

- crd：custom resource definition

- tpr：third party resource

> 未完待续 ......
