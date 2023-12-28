---
layout: post
title: 常用命令tips
date: 2023-12-27 00:12:05
---

- curl命令只需返回状态码

```
curl -o /dev/null -s -w "%{http_code}\n" www.baidu.com
```
