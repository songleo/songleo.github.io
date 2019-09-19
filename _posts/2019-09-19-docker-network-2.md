---
layout: post
title: 容器网络（二）
date: 2019-09-19 00:12:05
---

单机docker的容器是通过docker0网桥（虚拟交换机或者虚拟网桥）实现通信。如下：

```
# d network ls
NETWORK ID          NAME                DRIVER              SCOPE
e7640bc6abc4        bridge              bridge              local
cad152881e00        host                host                local
334b1cdfc438        none                null                local
```

可以看到bridge网络，并且使用的是bridge驱动，也是local通信方式。查看bridge的详细信息，可以看到bridge和docker0的关系：

```
# d network inspect bridge
[
    {
        "Name": "bridge",
        "Id": "e7640bc6abc425a138e6b38bdf2cfad900b6fe6f697b9cf7704a4f81876fda53",
        "Created": "2019-09-15T19:15:03.084118714-07:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16",
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {},
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "1500"
        },
        "Labels": {}
    }
]
```

bridge网络在主机内核中映射为docker0网桥。所以默认情况下docker创建的容器都会连接到docker0网络，由docker0负责本机所有容器之间的通信。如：

```
# ip link show docker0
4: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN mode DEFAULT group default
    link/ether 02:42:3f:57:ce:4b brd ff:ff:ff:ff:ff:ff
# brctl show
bridge name bridge id   STP enabled interfaces
docker0   8000.02423f57ce4b no
```

当成功创建容器后，interfaces部分会显示该容器的veth pair。


下面我们手动创建一个新的网桥，演示单机docker的容器通信：

a) 创建单机桥接网络local-br

```
# d network create -d bridge local-br
7832a50ead433b85b502fa650206fbf31ac3dc562187af43b9312c7a753dcf0c
# brctl show
bridge name bridge id   STP enabled interfaces
br-7832a50ead43   8000.0242c78ac61b no
docker0   8000.02423f57ce4b no
```

b) 创建容器并连接到创建的local-br

```
# d container run -d --name c1 --network local-br alpine sleep 1d
# brctl show
bridge name bridge id   STP enabled interfaces
br-7832a50ead43   8000.0242c78ac61b no    vethbc7275e
docker0   8000.02423f57ce4b no
```

可以看到c1容器的网络vethbc7275e已经连接到桥接网络local-br，也可以通过以下命令确认：

```
# d network inspect local-br
[
    {
        "Name": "local-br",
        "Id": "7832a50ead433b85b502fa650206fbf31ac3dc562187af43b9312c7a753dcf0c",
        "Created": "2019-09-18T20:19:27.636469939-07:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": {},
            "Config": [
                {
                    "Subnet": "172.18.0.0/16",
                    "Gateway": "172.18.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "66b07e1390e03d928458e3c51bc67a369ccf4bdd1c1791e0638e12cd46027242": {
                "Name": "c1",
                "EndpointID": "27ff9d603f136242160a47cd6a23a9973e83746ae8078a75d55daf5ccebf1e28",
                "MacAddress": "02:42:ac:12:00:02",
                "IPv4Address": "172.18.0.2/16",
                "IPv6Address": ""
            }
        },
        "Options": {},
        "Labels": {}
    }
]
```

可以看到该网络下面的Containers部分有相应的c1容器和容器的网络信息。并且也可以看到宿主机的路由规则中添加了对应的路由规则：

```
root@ssli-dev:~# route
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         9-30-182-0-gw.s 0.0.0.0         UG    0      0        0 ens7
9.30.182.0      *               255.255.254.0   U     0      0        0 ens7
172.16.0.0      *               255.255.0.0     U     0      0        0 ens3
172.17.0.0      *               255.255.0.0     U     0      0        0 docker0
172.18.0.0      *               255.255.0.0     U     0      0        0 br-7832a50ead43
```

最后2条分别是默认的docker0网桥和新建的local-br网桥的路由规则。

c）创建c2容器连接到local-br并ping c1容器

```
# d container run -it --name c2 --network local-br alpine sh
/ # ping c1
PING c1 (172.18.0.2): 56 data bytes
64 bytes from 172.18.0.2: seq=0 ttl=64 time=0.179 ms
64 bytes from 172.18.0.2: seq=1 ttl=64 time=0.094 ms
64 bytes from 172.18.0.2: seq=2 ttl=64 time=0.094 ms
^C
--- c1 ping statistics ---
3 packets transmitted, 3 packets received, 0% packet loss
round-trip min/avg/max = 0.094/0.122/0.179 ms
/ #
/ # ping 172.18.0.2
PING 172.18.0.2 (172.18.0.2): 56 data bytes
64 bytes from 172.18.0.2: seq=0 ttl=64 time=0.175 ms
64 bytes from 172.18.0.2: seq=1 ttl=64 time=0.115 ms
64 bytes from 172.18.0.2: seq=2 ttl=64 time=0.145 ms
^C
--- 172.18.0.2 ping statistics ---
3 packets transmitted, 3 packets received, 0% packet loss
round-trip min/avg/max = 0.115/0.145/0.175 ms
```

在c2容器中，不管是ping c1容器的名字还是ip都是通的，这里是因为创建的容器都注册了指定的docker dns服务，在c2容器中运行了一个本地的dns解析器，可以解析出容器名字。

除此之外，还可以通过端口映射的方式，将宿主机端口和容器端口建立映射关系，访问宿主机某个端口时，实际就是访问容器中被映射的端口，如下：


```
# d container run -d --name web --network local-br --publish 5000:80 nginx
52c0fed60c324b6c68ef1c83aeb29257dbb1e08e8cf7b66a3336cc356b10dc28
# curl localhost:5000
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

上面示例中将容器的80端口映射到宿主机的5000端口，所以访问宿主机的5000端口时，所有的流量都会被转发到容器的80端口，可以通过以下命令确认端口映射关系：

```
# docker port web
80/tcp -> 0.0.0.0:5000
```

表示web容器的80端口已经映射到宿主机上所有网络接口的5000端口。
