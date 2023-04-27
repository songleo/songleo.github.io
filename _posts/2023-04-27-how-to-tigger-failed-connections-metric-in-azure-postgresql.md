---
layout: post
title: 如何在azure postgresql中触发failed connections指标数据
date: 2023-04-27 00:12:05
---

工作中遇到一个需求，需要定义alert去监控azure postgresql的连接失败次数，但是默认情况下，azure postgresql的这个指标数据是没有值的。所以如果想触发定义的alert，需要想办法触发这指标产生数据，以下是一些可能导致连接失败的常见情况：

- 无效的凭据：通过使用无效的用户名或密码尝试连接到数据库。
- 防火墙：如果azure postgresql数据库的防火墙未配置正确，则连接可能被拒绝。
- 连接超时：如果数据库在连接尝试时太忙或响应时间过长，则连接可能会超时。
- 连接数限制：如果已经达到了azure postgresql数据库允许的最大连接数，则新的连接将被拒绝。
- 数据库故障：如果azure postgresql数据库出现故障，则连接可能会失败。

这里采用最简单的方式实现，使用无效的密码连接数据库，会触发azure postgresql的failed connections指标产生数据。在azure postgresql的页面找到数据看的连接字符串connection strings，选择postgresql connection url命令行，比如：

```
postgres://user1:{your_password}@your_db.postgres.database.azure.com/postgres?sslmode=require
```

然后通过psql执行上面的命令，就会触发azure postgresql的failed connections指标产生数据：

```
psql "postgres://user1:{your_password}@your_db.postgres.database.azure.com/postgres?sslmode=require"
```
