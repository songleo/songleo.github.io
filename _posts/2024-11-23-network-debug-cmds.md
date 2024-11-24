---
layout: post
title: 常用网络调试命令
date: 2024-11-23 00:12:05
---

### nslookup

检查一个域名是否能够解析为正确的ip地址，验证本地dns服务器是否工作正常。

- 检查网站

```
$ nslookup www.exampleinvalid.com
Server:		10.72.17.5
Address:	10.72.17.5#53

** server can't find www.exampleinvalid.com: NXDOMAIN

$ nslookup www.example.com
Server:		10.72.17.5
Address:	10.72.17.5#53

Non-authoritative answer:
Name:	www.example.com
Address: 93.184.215.14
```

- 检查dns服务器

```
$ nslookup www.example.com 1.1.1.1
Server:		1.1.1.1
Address:	1.1.1.1#53

Non-authoritative answer:
Name:	www.example.com
Address: 93.184.215.14
```

### traceroute

检查数据包从本地到目标主机的路径，分析网络链路中每一跳的延迟和问题。

- 检查网站访问路径

```
$ traceroute www.example.com
traceroute to www.example.com (93.184.216.34), 30 hops max, 60 byte packets
 1  192.168.1.1 (192.168.1.1)  1.123 ms  1.101 ms  1.076 ms
 2  10.0.0.1 (10.0.0.1)  2.234 ms  2.212 ms  2.190 ms
 3  172.16.0.1 (172.16.0.1)  10.456 ms  10.432 ms  10.410 ms
 4  example-isp.net (203.0.113.1)  15.234 ms  15.212 ms  15.190 ms
 5  * * *
 6  93.184.216.34 (93.184.216.34)  20.123 ms  20.101 ms  20.076 ms
```

- 检查内网连接

```
$ traceroute 192.168.0.1
traceroute to 192.168.0.1 (192.168.0.1), 64 hops max, 40 byte packets
 1  192.168.0.1 (192.168.0.1)  5.720 ms  2.119 ms  1.971 ms
```

### curl

测试api、下载文件、查看网页内容和调试网络问题。

- 获取网页

```
$ curl http://www.example.com
```

- 下载文件

```
curl -O http://www.example.com/file.txt
```

- 只输出返回码

```
curl -o /dev/null -s -w "%{http_code}\n" http://www.example.com
```

### host

简洁高效的dns查询工具，用于解析域名和ip地址，或检查特定类型的dns记录。

- 查询域名的a记录

```
$ host www.example.com
www.example.com has address 93.184.215.14
www.example.com has IPv6 address 2606:2800:21f:cb07:6820:80da:af6b:8b2c
```

- 显示域名的权威dns服务器

```
$ host -t ns example.com
example.com name server a.iana-servers.net.
example.com name server b.iana-servers.net.
```

- 反向解析ip地址

```
$ host 1.1.1.1
1.1.1.1.in-addr.arpa domain name pointer one.one.one.one.
```

- 指定dns服务器

```
$ host www.example.com 1.1.1.1
Using domain server:
Name: 1.1.1.1
Address: 1.1.1.1#53
Aliases:

www.example.com has address 93.184.215.14
www.example.com has IPv6 address 2606:2800:21f:cb07:6820:80da:af6b:8b2c
```
