---
layout: post
title: kubernetes网络（二）
date: 2019-09-27 00:12:05
---

纯三层的网络解决方案：[flannel的host-gw模式](http://reborncodinglife.com/2019/09/20/docker-network-3/)和calico模式。

> 路由规则中的下一跳：表示如果ip包从主机a发送到主机b，需要经过路由设备c的中转，那么c的ip就应该配置为主机a的下一跳。
> 例如路由规则192.168.1.0/24 via 192.168.2.2 dev eth0表示属于192.168.1.0/24段的ip包，需要通过本机的eth0设备发出，并且下一跳是192.168.2.2

