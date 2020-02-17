---
layout: post
title: kubernetes网络（二）
date: 2019-09-27 00:12:05
---

纯三层的网络解决方案：[flannel的host-gw模式](http://reborncodinglife.com/2019/09/20/docker-network-3/)和calico模式。

> 路由规则中的下一跳：表示如果ip包从主机a发送到主机b，需要经过路由设备c的中转，那么c的ip就应该配置为主机a的下一跳。
> 例如路由规则192.168.1.0/24 via 192.168.2.2 dev eth0表示属于192.168.1.0/24段的ip包，需要通过本机的eth0设备发出，并且下一跳是192.168.2.2

calico提供的网络解决方案，基本和flannel的host-gw模式相同，不同的地方在flannel通过etcd和宿主机上的flanneld维护路由信息，而calico是使用bgp（border gateway protocol 边界网关协议）自动的在集群中维护路由信息。如：

```
目标容器ip段 via 容器所在节点ip或者网关ip dev eth0
```

> bgp：大规模网络中实现节点路由信息共享的一种协议

calico有以下组件：

- calico的cni插件，即calico二进制文件，负责和kubernetes对接
- felix：负责在集群中各节点维护路由规则（如下一跳）和calico所需的网络设备，在每个节点都会启动的daemonset
- bird：bgp客户端，负责在集群中通过bgp协议在各节点分发路由规则，即将所有节点当成边界路由器，相互之间通过bgp协议交换路由规则

不同于flannel网络解决方案，calico不创建任何网桥设备。其通信流程如下：

```
c1 -> calixxx -> eth0 <----> eth0 -> calixxx -> c2
```

- c1访问c2时，ip包会出现在calixxx，calico为每个容器都创建一个veth pair设备，以cali开头，一端在宿主机，另外一端在容器
- 根据c1宿主机中的路由规则中的下一跳发送到c2的宿主机
- 根据c2宿主机中的路由规则发送到calixxx，进而发送到c2

如果集群节点之间不是二层连通，而是三层连通，需要打开calico的ipip模式，其通信流程如下：

```
c1 -> calixxx -> tunl0 -> eth0 <----> eth0 -> calixxx -> tunl0 -> c2
```

- c1访问c2时，ip包会出现在calixxx
- 根据c1宿主机中的路由规则中的下一跳，使用tunl0设备将ip包发送到c2的宿主机
- tunl0是一种ip隧道设备，当ip包进入该设备后，会被Linux中的ipip驱动将该ip包直接封装在宿主机网络的ip包中，然后发送到c2的宿主机
- 进入c2的宿主机后，该ip包会由ipip驱动解封装，获取原始的ip包，然后根据c2宿主机中的路由规则发送到calixxx
- 进而进入c2容器

由于ipip模式有包封装和解封装，会有一定的性能影响。因此，还可以通过设置路由规则，将ip包通过2次下一跳规则转发到目标节点，通信流程如下：


```
c1 -> calixxx -> eth0 <-- router --> eth0 -> calixxx -> c2
```

- c1访问c2时，ip包会出现在calixxx
- 根据c1宿主机中路由规则中的下一跳，将ip包转发到边界路由器router
- 根据边界路由器中的下一跳，将ip包转发到c2宿主机
- 根据c2宿主机的路由规则，转发到calixxx
- 进而进入c2容器

以上方式需要calico宿主机支持dynamic neighbor的bgp配置方式，方便各节点和网关router建立bgp连接，将路由规则分发到网关。或者使用calico的route reflector组件将集群中的路由信息同步到网关。可以看到隧道网络方案和三层网络方案各有优缺点，三层网络方案不需要包的封装和解封装，性能高，但是维护的路由规则比较多，通过配置下一跳实现跨主机容器的通信。隧道网络方案大部分工作都是由linux内核模块实现，通过在ip包外面在封装一层ip或者mac头实现，应用层工作量较少，但是多了包的封装和解封装，性能低。

