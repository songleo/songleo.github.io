---
layout: post
title: 网络常用调试命令
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
