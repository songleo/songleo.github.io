# 趣谈网络协议

## 1

协议三要素：

- 语法：规则和格式
- 语义：意义
- 顺序：顺序

网络协议层：

- 应用层：http/dns/dhcp，数据封装，七层（应用程序）
- 传输层：tcp/udp，会话连接机制，四层（有端口号），传输的是数据段
- 网络层：ip/imcp/bgp，路由作用，三层（有ip地址），ip层定义了网络端到端的传输行为，传输的是数据包
- 链路层：arp/vlan/stp，定位作用，二层（有mac地址），mac层定义了本地局域网的传输行为，传输的是数据帧
- 物理层：网络跳线，连接作用，网线、接线头、集线器等等，一层，由数据构成数据帧

网络包结构

mac | ip | tcp/upd | http | 数据

## 2

混杂模式：接受所有网络包

二层设备：接收网络包，将网络包的mac头取出来，看看这个网络包到底是转发、丢弃还是留给自己处理
三层设备：将mac头取出来之后，再将ip头取出来，看看到底是转发、丢弃还是自己处理

## 3

cidr：无类型域间选路，10.100.122.2/24，32位中，有24位是网络号，只有8位是主机号，用来判断数据包是不是在一个局域网，即是不是本地人。ip地址有定位功能，用于网络寻址，通信的范围比较大，mac地址类似身份证，没有定位功能，只有识别功能，通信的方位比较小，在一个局域网内是唯一的
广播地址：10.100.122.255，如果往这个地址发送数据，所有10.100.122网络中的机器都会收到
子网掩码：255.255.255.0，用于计算网络号
公有ip：用于连接互联网
私有ip：内网使用

cidr例子：16.158.165.91/22  （32 = 22 （16 + 6） + 10）

广播地址：16.158.<101001><11>.255 (16.158.167.255)
第一个地址：16.158.<101001><00>.1 （16.158.164.1）
子网掩码：255.255.<111111><00>.0 （255.255.252.0）

lo：loopback环回接口，127.0.0.1，用于本机通信，经过内核处理后直接返回，不会再任何网络中出现

网络设备状态标识（ip addr）：

- broadcast：表示网卡有广播地址，可以发送广播包
- multicast：表示网卡可以发送多播包
- up：表示网卡处于启动状态
- lower_up：表示l1是启动状态，即网线是插着的
- mtu：最大传输单元，以太网的默认值一般为1500，是二层mac层的概念，表示以太网规定，mac帧不能超过1518字节（mac头14字节和mac尾4字节），正文中还有ip头、tcp头和http头，如果放不下，需要分片传输
- qdisc：queueing discipline排队规则，有pfifo先进先出，也有pfifo_fast方式，pfifo_fast包含3个band，band0到band2，优先级从高到低，在band中使用先进先出规则。数据包被分配到band主要依靠tos（type of service）服务类型区分

ip scope：

- host：仅供本机相互通信，如lo
- global：可以对外通信，可以接收来自各方的数据包，如eth0

## 4

给网卡设置ip：ifconfig eth0 192.169.1.100 && ifconfig eth0 up

网关要和当前网络至少一个网卡的ip在同一个网段。网关往往是一个路由器，是一个三层转发的设备。一般根据mac头和ip头中的内容，将数据包转发到相应的设备，

dhcp：动态主机配置协议，自动分配可用的ip地址

## 5

路由器工作在第三层。

集线器工作在物理层，将接收到的数据包，采用广播的方式发送到所有端口。

交换机工作在物理层，会学习和记录连接到其上面电脑的mac和ip，在转发数据包时不像集线器那样广播是转发，而是有目的的转发

## 6

STP：将网络中环路问题，将一个图中的环破坏，生成一个树，生成树的算法叫stp

- root bridge
- designated brideges
- bride protocol data units：
- priority vector：优先级向量，值越低优先级越高

## 7

ping命令：基于icmp协议，即互联网控制报文协议，icmp报文是封装在ip包里面。可以使用命令tcpdump -i en0 icmp查看某个网口执行ping命令时的信息。例如：

```
$ tcpdump -i en0 icmp
listening on en0, link-type EN10MB (Ethernet), capture size 262144 bytes
13:34:23.240772 IP sslis-mbp-4.cn.ibm.com > 220.181.38.150: ICMP echo request, id 803, seq 0, length 64
13:34:23.269615 IP 220.181.38.150 > sslis-mbp-4.cn.ibm.com: ICMP echo reply, id 803, seq 0, length 64
13:34:24.243375 IP sslis-mbp-4.cn.ibm.com > 220.181.38.150: ICMP echo request, id 803, seq 1, length 64
13:34:24.268921 IP 220.181.38.150 > sslis-mbp-4.cn.ibm.com: ICMP echo reply, id 803, seq 1, length 64
13:34:25.247872 IP sslis-mbp-4.cn.ibm.com > 220.181.38.150: ICMP echo request, id 803, seq 2, length 64
13:34:25.273297 IP 220.181.38.150 > sslis-mbp-4.cn.ibm.com: ICMP echo reply, id 803, seq 2, length 64
```

需要注意的是，有些设备是禁止ping的，所以有时候ping不通，不代表网络不通。

## 8

数据包传输到一个新的局域网时，即只要通过网关，mac地址都是要变的，因为已经换了局域网，但是ip地址不变。

不改变ip地址的网关，叫转发网关，改变ip地址的nat网关，nat全称network address translation，网络地址转换。

## 9

查看路由规则：

```
root@ssli-dev:~# \ip route show
default via 9.30.182.1 dev ens7
9.30.182.0/23 dev ens7  proto kernel  scope link  src 9.30.183.245
172.16.0.0/16 dev ens3  proto kernel  scope link  src 172.16.193.33
172.17.0.0/16 dev docker0  proto kernel  scope link  src 172.17.0.1 linkdown
```

添加路由规则：

```
ip route add 10.176.48.0/20 via 10.173.32.1 dev eth0
```

添加路由表：

```
ip rule add from 192.168.1.0/24 table 10
ip rule add from 192.168.2.0/24 table 20
```

igp：内部网关协议
bgp：边界网关协议


## 10

传输层最重要的2个协议：tcp/udp

- tcp：面向连接，在通信之前，需要提前穿甲好连接，如三次握手过程。tcp是面向字节流的，发送的时候是一个流，没有头和尾。而ip层发送的是一个个ip包。tcp带有拥塞控制，会根据网络环境自动调整自己的行为，如快速发送或者慢速发送。
- udp：面向无连接，不需要在通信之前建立连接，udp面向数据报。一个一个的发，一个一个的收，如dhcp、vxlan

## 11

tcp包结构：端口号、序号、确认序号、状态标志（ack/rst/fin）、发送窗口大小、校验和、紧急指针
三次握手：保存一发一收都能正常收到的情况下，建立连接，开始传输数据
四次挥手：确保发送端和接收端都能正常结束


## 12 13 14


URL：统一资源定位符，如https://www.163.com/

http请求报文分为三大部分：请求行、首部和正文实体。
http返回报文分为三大部分：状态行、首部和正文实体。

http方法：

- get: 获取资源
- post：发送数据，创建资源
- put：修改资源
- delete：删除资源

quic协议：基于udp，定义了类似tcp的链接、重试、多路复用和流量控制，提高了性能和效率

## 15

创建私钥：

```
openssl genrsa -out cliu8siteprivate.key 1024
```

创建公钥：

```
openssl rsa -in cliu8siteprivate.key -pubout -out cliu8sitepublic.pem
```

创建证书请求：

```
openssl req -key cliu8siteprivate.key -new -out cliu8sitecertificate.req
```

给证书签名：

```
openssl x509 -req -in cliu8sitecertificate.req -CA cacertificate.pem -CAkey caprivate.key -out cliu8sitecertificate.pem
```

查看证书内容：

```
openssl x509 -in cliu8sitecertificate.pem -noout -text
```


## 16

视频是一系列快速播放的图片，每一张图片称为一帧。帧率表示每秒钟播放的帧数。每个图片由像素构成，每个像素由rgb组成，每个8位，共24位。


## 18









