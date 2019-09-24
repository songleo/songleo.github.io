---
layout: post
title: 容器网络（三）
date: 2019-09-20 00:12:05
---

默认配置下，docker在不同宿主机上创建的容器无法通过ip地址相互访问。而相同宿主机上的容器借助docker0网桥模式可以通过ip相互访问。网桥设备转发数据包的依据，是来自转发数据库（forwarding database FDB），FDB记录了二层数据帧应该通过那个接口设备发送到目的主机，通过命令bridge fdb show可以查询。

flannel容器网络方案支持三种后端实现，分别是vxlan（virtual extensible lan 虚拟机可扩展局域网）、host-gw和udp，udp模式性能最差，现在已经被弃用，vxlan模式通过在现用的三层网络之上，构建一个由内核vxlan模块维护的虚拟二层网络，使连接到这个二层网络的主机可以向在一个局域网中自由通信。

udp模式下，会创建相应的路由规则，将宿主机上容器的数据包从docker0转发到flannel0设备，然后由flannel0设备将ip包转发到flanneld进程，即ip包由内核态（flannel0设备）向用户态（flanneld进程）传递。如果flanneld进程往flannel0设备发送一个ip包，那么该ip包会进入宿主机的网络栈，然后根据路由规则进行处理，即ip包由用户态到内核态传递。

flannel0设备：一个隧道设备，工作在三层（网络层）的虚拟网络设备，负责传递os内核和用户应用程序之间的ip包，flannel会在每个宿主机创建flannel0设备和相应的路由规则
flannel子网：在flannel管理的容器网络中，一台宿主机上的所有容器ip都属于宿主机被分配的一个子网，例如node的子网是100.96.1.0/24，那么容器的ip为100.96.1.2。不同宿主机的子网不同，且所有宿主机的子网信息已经保存在etcd中。


flannel udp模式下跨主机通信流程如下：

```
c1 -> docker0 -> flannel0 -> flanneld -> eth0 <----> eth0 -> flanneld -> flannel0 -> docker0 -> c2
```

- c1访问c2时，ip包首先出现在docker0
- 然后docker0上的ip包会被路由到本机的flannel0
- flannel0将数据发送到flanneld进程
- flanneld根据c2的ip从etcd中获取c2节点的ip
- 将ip包以udp方式发送到c2所在的节点上的flanneld进程
- flanneld将数据包发送给flannel0设备
- flannel0设备根据本机的路由规则将ip包发送到docker0
- docker0将数据发送给c2

flannel udp模式相当于提供了一个三层的overlay网络，将发送的ip包通过udp封装，发送到目的宿主机在解封装拿到ip包，然后转发到目标容器。相当于在不同主机上的容器之间建立了一条隧道，是容器可以直接基于ip通信，而无需关注容器和宿主机的分布情况。

由于发送数据是频繁的用户态和内核态数据拷贝，性能较差，已经被弃用。用户态和内核态的切换示意图如下：

```
c1 -> docker0 -> flannel0 -> flanneld -> eth0
```

flannel vxlan模式下跨主机通信流程如下：

```
c1 -> docker0 -> flannel.1 -> eth0 <----> eth0 -> flannel.1 -> docker0 -> c2
```

flannel.1设备：vxlan模式下的vtep（vxlan tunnel end point 虚拟机隧道端点）设备，有相应的ip地址和mac地址，负责在内核态完成二层数据帧的封装和解封装，所以和udp模式相比，性能更好。每个新节点启动后加入flannel网络后，所有节点的flanneld会添加相应的路由规则，并记录新节点的flannel.1的ip地址和mac地址，方便其他节点的flannel.1能访问到自己的flannel.1。vxlan模式下发送的数据包格式如下：

```
outer ethernet header | outer ip header | udp header | vxlan header | inner ethernet header | inner ip header | data
```

> 数据封装：[`data`] -> [`tcp/udp` | `data`] -> [`ip` | `tcp/udp` | `data`] -> [`mac` | `ip` | `tcp/udp` | `data`] -> [`01010101...`]

> 数据解封装：[`01010101...`] -> [`mac` | `ip` | `tcp/udp` | `data`] -> [`ip` | `tcp/udp` | `data`] -> [`tcp/udp` | `data`] -> [data]

- c1访问c2时，ip包首先出现在docker0
- 然后docker0上的ip包会被路由到本机的flannel.1设备
- flannel.1设备将原始ip包封装成一个udp包发送到c2宿主机，这个udp包内部是一个完整的二层数据帧
- c2宿主机的flannel.1设备收到数据包后，取出原始ip包，发送给docker0网桥
- docker0网桥将ip数据包发送给c2

以上两种网络方案都是通过网络插件在宿主机创建特殊设备（tun和vtep），然后借助路由表和docker0进行协作，完成容器跨主通信。在kubernetes中，flannel通过cni接口，创建一个类似docker0的网桥cni0完成类似的功能。

