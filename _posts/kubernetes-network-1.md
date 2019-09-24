---
layout: post
title: kubernetes网络（一）
date: 2019-09-24 00:12:05
---

flannel的vxlan模式中，kubernetes借助cni接口，维护了一个类似docker0的网桥，即cni网桥cni0。完成容器的跨主通信。cni网桥只会接管由其创建的容器之间的容器。cni主要功能是kubernetes启动infra容器后，调用相应的cni插件，为infra容器的network namespace配置网络栈，如网卡、回环设备、路由表和iptables规则。

cni插件所需的可执行文件一般位于宿主机的/opt/cni/bin目录，当安装好kubernetes-cni包后，可以在该目录查看相应的二进制文件，例如：

```
root@garish1:bin$ pwd
/opt/cni/bin
root@garish1:bin$ ll
total 76M
drwxr-xr-x 2 root root  117 Sep 15 19:15 .
drwxr-xr-x 3 root root   17 Aug  5 18:50 ..
-rwxr-xr-x 1 root root  31M Sep 15 19:15 calico
-rwxr-xr-x 1 root root  31M Sep 15 19:15 calico-ipam
-rwxr-xr-x 1 root root 2.8M Sep 15 19:15 flannel
-rwxr-xr-x 1 root root 2.9M Sep 15 19:15 host-local
-rwxr-xr-x 1 root root 3.0M Sep 15 19:15 loopback
-rwxr-xr-x 1 root root 3.4M Sep 15 19:15 portmap
-rwxr-xr-x 1 root root 2.8M Sep 15 19:15 tuning
```

这些可执行文件按照功能分为三类：

- main插件：负责创建网络设备，如创建回环设备的loopback，创建veth pair的ptp，创建网桥设备的bridge
- ipam插件：负责分配ip地址，例如host-local会使用预先配置分配ip，而dhcp会动态分配ip
- cni插件：内置的cni插件，如flannel、calico

要自己实现一个kubernetes用的容器网络方案，一般需要做2部分工作，以flannel为例：

- 实现这个网络方案本身，如flanneld进程，主要负责创建和配置flannel.1设备、配置宿主机路由、配置arp和fdb表等
- 实现相应的cni插件，主要负责配置infra容器的网络栈，并将其链接到cni0网桥

在/etc/cni/net.d目录下，会有相应的cni配置文件，例如：

```
root@garish1:net.d$ pwd
/etc/cni/net.d
root@garish1:net.d$ cat 10-calico.conflist
{
    "name": "k8s-pod-network",
    "cniVersion": "0.3.0",
    "plugins": [
      {
        "type": "calico",
        "etcd_endpoints": "https://172.16.217.225:4001",
        "etcd_key_file": "/etc/cni/net.d/calico-tls/etcd-key",
        "etcd_cert_file": "/etc/cni/net.d/calico-tls/etcd-cert",
        "etcd_ca_cert_file": "/etc/cni/net.d/calico-tls/etcd-ca",
        "mtu": 1430,
        "log_level": "info",
        "ipam": {
          "assign_ipv4": "true",
          "assign_ipv6": "false",
          "type": "calico-ipam"
        },
        "policy": {
          "type": "k8s"
        },
        "kubernetes": {
            "kubeconfig": "/etc/cni/net.d/calico-kubeconfig"
        }
      },
      {
        "type": "portmap",
        "snat": true,
        "capabilities": {"portMappings": true}
      }
    ]
}
```
