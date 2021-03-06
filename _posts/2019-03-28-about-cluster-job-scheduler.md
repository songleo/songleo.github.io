---
layout: post
title: 关于集群作业调度系统
date: 2019-03-28 00:12:05
---

进入hpc行业4年多了，一直都是负责集群作业调度系统的开发，最近工作中实现了一个简单的集群作业调度系统。因此想借此机会，将我对集群作业调度系统的一些认知和见解记录下来。

## 1 主从节点（master/slave）

节点可以理解成集群中提供计算资源的机器。集群作业调度系统一般采用主从结构，即集群中存在2种类型的节点，master节点和slave节点，master节点是管理节点，负责将用户提交的作业调度派发至满足资源需求的slave节点运行。slave节点是工作节点，只负责运行master节点分配的作业，并定时汇报作业的状态信息和节点的资源使用情况到master节点。主从节点的实现一般是通过分布式锁，先启动的节点获取到分布式锁后，就是master节点，没有获取到分布式锁的节点就是salve节点。需要注意的是，这里的分布式锁需要添加ttl，防止master节点出现故障后，其他节点获取不到分布式锁，导致集群没有master节点。当然也可以通过第三方组件如etcd、redis或者zookeeper实现master的自动选举。用户可以实时查看集群中所有节点的状态，如节点的资源使用情况、作业运行情况，并可以对节点进行控制，如关闭、打开、退出集群、加入集群等等。

## 2 调度器（scheduler）

调度器是集群作业调度系统的核心，主要功能是按照作业的资源需求，从集群中挑选出满足资源需求的节点，将作业派发到节点运行。通过提供不同的调度策略如先来先服务、抢占、独占和公平共享等，满足不同的作业调度需求。调度器需提供相应的编程接口，方便用户进行自定义调度策略的开发，满足用户的特殊调度需求。

## 3 作业执行器（job executor）

作业执行器一般运行在slave节点，负责接收master节点派发的作业请求，在slave节点将作业运行起来，并监控作业的状态和资源使用情况，定时汇报到master节点。如果作业异常退出或者运行超时，需及时释放作业占用的资源，以供其他作业使用。

## 4 作业（job）

在集群系统中，作业可以理解成用户需要提交到集群中运行的应用。比如一个仿真程序、编译程序或者并行计算程序等等，简单来说作业是一个可以在集群中运行的程序。每个作业又有不同的资源需求，如cpu、gpu、mem和storage。当提交作业到集群，且被分配到适合的计算节点运行后，用户可以查看作业的相关信息，并且可以对作业进行不同的控制，比如取消作业、暂停作业、恢复作业、重启作业等等。

## 5 队列（queue）

队列可以理解成集群调度系统中作业的“容器”，方便对作业进行更高层次的控制，比如资源需求控制、作业批量控制、优先级和应用类型等等。每个作业都属于特定的队列，集群调度系统从队列中获取用户提交的作业，然后调度派发到适合的计算节点运行。用户可以查看队列的相关信息，并且可以对队列进行控制，比如关闭队列、打开队列等等。

## 6 资源（resource）

集群中的资源可以是计算资源如cpu、gpu、mem等，也可以是节点的一些属性如温度、负载、功耗等，或者通过提供资源自定义接口，方便用户自定义资源，对某些节点定义一些特定的属性或者标签，如机架、许可证等等。需要注意的是，资源总是节点的某个属性，因为调度器就是通过作业的资源需求，在集群中寻找适合的节点供作业运行。

## 7 接口（interface）

集群作业调度系统需要提供相应的接口如cli和api，方便用户操作集群。如对作业、节点、队列、调度策略和集群等进行相应的操作，或者进行二次开发，满足特定需求。

## 8 高可用（high availability）

对于一个集群系统，必须具备高可用性，单个节点的故障不能影响用户的作业执行，对用户而言最好感知不到节点故障，只要集群中存在可用的计算节点，用户的作业就能正常的被派发运行。例如，若节点突然出现故障，且作业本身支持checkpoint/restore功能，那么可以将节点上的作业迁移到满足资源需求的节点继续运行。或者将作业迁移到其他节点重新执行。

## 9 作业事件（job events）

集群作业调度系统需提供作业事件功能，记录作业从提交到运行结束过程中的所有操作事件，如取消、重启等等。当集群由于某些原因需要重启时，调度系统能根据作业事件恢复作业，不能影响作业的正常运行。

以上是我对集群作业调度系统的个人见解，若有说得不对的地方，还望指正。
