---
layout: post
title: kubernetes网络（一）
date: 2019-09-24 00:12:05
---

flannel的vxlan模式中，kubernetes借助cni接口，维护了一个类似docker0的网桥，即cni网桥cni0。完成容器的跨主通信。cni网桥只会接管由其创建的容器之间的容器。cni主要功能是kubernetes启动infra容器后，调用相应的cni插件，为infra容器的network namespace配置网络栈，如网卡、回环设备、路由表和iptables规则。

cni插件所需的可执行文件一般位于宿主机的/opt/cni/bin目录，当安装好kubernetes-cni包后，可以在该目录查看相应的二进制文件，例如：

```
$ pwd
/opt/cni/bin
$ ll
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
$ pwd
/etc/cni/net.d
$ cat 10-calico.conflist
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

> 参考文档：https://github.com/containernetworking/cni/blob/master/SPEC.md#network-configuration

kubernetes会通过相应的cni配置文件配置容器网络方案。根据配置的plugins字段，调用多个插件进行网络配置。例如这里的配置文件中，会先调用calico完成容器网络配置，然后调用portmap完成端口映射配置。

cni插件调用需要2部分参数，第一部分是cni环境变量add/del，cni插件唯一需要实现的2个方法，分别实现将容器加入/移除cni网络，对于网桥类型的cni插件，add/del负责将veth pair连接/移除到网桥上。add操作需要的参数包括容器网卡名字eth0、容器id、pod的network namespace文件路径等。第二部分参数是上面的cni配置文件，其中定义了默认的插件的配置（配置的第一个插件为默认插件，例如这里是calico），然后根据这2部分配置调用相应的插件完成容器网络的配置。

例如网桥类的cni插件，会先检测是否存在cni网桥cni0，如果不存在则创建相应的cni0，类似在宿主机执行一下命令：

```
$ ip link add cni0 type bridge # 创建cni0网桥
$ ip link set cni0 up # 启动cni0
$ ip addr add 10.244.0.1/24 dev cni0 # 给cni0配置ip
```

然后进入infra容器的network namespace中创建相应的veth pair设备，分别连接到cni0和容器的eth0，类型在容器中执行以下命令：

```
# 容器中执行
$ ip link add eth0 type veth peer name vethxxx # 创建veth pair设备对
$ ip link set eth0 up # 启动eth0设备
$ ip link set vethxxx netns $HOST_NS # 将veth pair的另一端加入宿主机network namespace
$ ip netns exec $HOST_NS ip link set vethxxx up # 在宿主机的network namespace中启动vethxxx设备
$ ip addr add 10.244.0.2/24 dev eth0 # 给容器分配ip
$ ip route add default via 10.244.0.1 dev eth0 # 添加路由规则

# 宿主机执行
$ ip link set vethxxx master cni0 # 将vethxxx连接到cni0网桥
```
