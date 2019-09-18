---
layout: post
title: 容器网络（一）
date: 2019-09-18 00:12:05
---

容器提供了以下4种网络模式：

- bridge模式：通过虚拟网络设备对（veth pair）实现，总是以2张虚拟网卡形式存在，其中一张网卡发出的数据包，会直接出现在另一张网卡上，即使不在一个network namespace中，所以将veth pair当成连接不同网络命名空间的”网线”
- host模式：和宿主机共用网络和端口，不开启network namespace，例如docker run -d --net=host --name nginx-host nginx
- container模式：和其他容器共用一个网络
- none模式：不创建任何网络

网络栈：包括网卡、回环设备、路由表和iptables规则
网桥：虚拟交换机角色，工作在数据链路层，根据mac地址将数据包转发到网桥的各接口上，docker会默认在宿主机创建一个docker0的网桥
路由规则：如果网关部分是0.0.0.0，那么这是一条直连路由规则，匹配到该规则的ip包，直接通过二层网络mac地址发送到目的主机

在宿主机上查看网桥设备docker0和路由规则:

```
# ifconfig docker0
docker0   Link encap:Ethernet  HWaddr 02:42:3f:57:ce:4b
          inet addr:172.17.0.1  Bcast:172.17.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:3918 errors:0 dropped:0 overruns:0 frame:0
          TX packets:7533 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0
          RX bytes:218940 (218.9 KB)  TX bytes:17797992 (17.7 MB)

# route
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         9-30-182-0-gw.s 0.0.0.0         UG    0      0        0 ens7
9.30.182.0      *               255.255.254.0   U     0      0        0 ens7
172.16.0.0      *               255.255.0.0     U     0      0        0 ens3
172.17.0.0      *               255.255.0.0     U     0      0        0 docker0
```

创建一个容器后，查看宿主机端的veth pair (vethb4eaa40)：

```
# docker run -d --name nginx1 nginx
6fcaa7d2ba2b389ae9348f38477e8df4a24f233e6e1ce819d1643deb94a9b511
# ifconfig
docker0   Link encap:Ethernet  HWaddr 02:42:3f:57:ce:4b
          inet addr:172.17.0.1  Bcast:172.17.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:2030 errors:0 dropped:0 overruns:0 frame:0
          TX packets:3927 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0
          RX bytes:113112 (113.1 KB)  TX bytes:8892494 (8.8 MB)

......


vethb4eaa40 Link encap:Ethernet  HWaddr 6e:0b:27:01:20:e7
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0
          RX bytes:0 (0.0 B)  TX bytes:0 (0.0 B)

# brctl show
bridge name bridge id   STP enabled interfaces
docker0   8000.02423f57ce4b no    vethb4eaa40
```

进入容器，查看容器端的veth pair (eth0):

```
# docker exec -it nginx1 /bin/bash
root@6fcaa7d2ba2b:/# apt-get update
root@6fcaa7d2ba2b:/# apt install net-tools iputils-ping -y
root@6fcaa7d2ba2b:/# ifconfig
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.17.0.2  netmask 255.255.0.0  broadcast 172.17.255.255
        ether 02:42:ac:11:00:02  txqueuelen 0  (Ethernet)
        RX packets 3604  bytes 8905319 (8.4 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 1886  bytes 132135 (129.0 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

root@6fcaa7d2ba2b:/# route
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         172.17.0.1      0.0.0.0         UG    0      0        0 eth0
172.17.0.0      0.0.0.0         255.255.0.0     U     0      0        0 eth0
```

容器中的eth0和宿主机上的vethb4eaa40关系验证：

```
# ip link
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: ens3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP mode DEFAULT group default qlen 1000
    link/ether 00:16:3e:01:c1:21 brd ff:ff:ff:ff:ff:ff
3: ens7: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP mode DEFAULT group default qlen 1000
    link/ether 00:00:09:1e:b7:f5 brd ff:ff:ff:ff:ff:ff
4: docker0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP mode DEFAULT group default
    link/ether 02:42:3f:57:ce:4b brd ff:ff:ff:ff:ff:ff
8: vethb4eaa40@if7: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master docker0 state UP mode DEFAULT group default
    link/ether 6e:0b:27:01:20:e7 brd ff:ff:ff:ff:ff:ff link-netnsid 0
# docker exec -it nginx1 /bin/bash
root@6fcaa7d2ba2b:/# cat /sys/class/net/eth0/iflink
8
```

容器访问相同宿主机上的容器通信流程：

```
eth0 -> vethxxxx -> docker0 -> vethxxxx -> eth0
```

容器访问宿主机：

```
eth0 -> vethxxxx -> docker0 -> eth0
```

所以，当容器不能上网时，首先ping docker0网桥，看是否能正常连接docker0网桥，然后查看docker0及相应的veth pair设备的iptables规则是否有异常，一般就能解决容器不能上网的问题了。
