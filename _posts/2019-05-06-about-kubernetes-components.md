---
layout: post
title: kubernetes学习之节点组件
date: 2019-05-06 00:12:05
---

最近开始学习kubernetes，于是想把学习到的知识点记录下来，当成自己的学习输出。本文主要介绍kubernetes节点中的相关组件。在kubernetes集群中，存在2种节点，master节点和node节点，master节点主要是管理节点，作为集群管理的入口，负责管理集群。node节点是计算节点，主要用于运行用户的应用程序。一般在ha环境需要配置多个master节点，防止单点故障导致集群不可用。node节点可以按需扩展。下面分别介绍master节点和node节点的组件。

## 1 master节点

### 1.1 kube-apiserver

主要功能是提供restful api方便对kubernetes进行控制，例如对集群中所有资源的增删改查，是控制kubernetes集群的唯一入口。

### 1.2 etcd

一个键值对存储系统，提供高可用性和数据一致性，负责存储kubernetes集群的所有数据。

### 1.3 kube-scheduler

kubernetes的调度器，负责将pod按不同的资源需求调度到集群中的node节点运行。

### 1.4 kube-controller-manager

kubernetes的控制器管理系统，负责管理运行的各种控制器如deployment、replication、job、cronjob等资源对象，进而对容器进行编排。

## 2 node节点

### 2.1 kubelet

主要用于和master节点及各种接口通信，例如与container runtime interface通信，将容器在node节点创建并运行起来。与container storage interface通信，为容器提供存储功能。与container networking interface通信为容器配置网络功能。这里提到的interface主要是为了方便第三方提供具体的实现方案，kubernetes定义接口，方便满足不通的容器、存储和网络需求。

### 2.2 kube-proxy

一个网络代理服务，在kubernetes中负责service的具体实现，维护节点上的网络规则和执行网络转发，实现网络代理和负载均衡功能。如pod到service的通信，节点到service的访问等。

### 2.3 container runtime

容器运行时，主要用于在node节点提供容器创建、管理和运行功能，比如docker、containerd、cri-o和rktlet等，只要实现了kubernetes的container runtime interface的任意容器运行时，都可以和kubernetes集群集成运行容器。


除了上面介绍的主要组件，还有一些其他的附件组件如dns、dashboard、监控和日志等，就不一一介绍了。下一篇会介绍kubernetes中的各种资源对象，如pod、service、deployment等。另外，如果可以的话，尽量把官方文档读一遍。大多时候，书或者翻译的文章都没有直接读官方文档理解得深刻。

