---
layout: post
title: 在chrome中配置proxy switchyomega
date: 2024-01-10 00:12:05
---


### 配置proxy servers

可以添加自己的代理服务器，比如：

```
http you_proxy_server 8080
```

这样配置proxy servers，chrome会使用这个代理访问网页。

### 配置bypass list

```
127.0.0.1
::1
localhost
localhost.com
www.private-cloud.com
192.168.0.106
```

这样配置bypass list，chrome会忽略上面配置的地址，不使用代理访问。
