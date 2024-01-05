---
layout: post
title: 构建可观察性平台
date: 2024-01-03 00:12:05
---

## 部署prometheus

用于收集和存储监控数据。

```
docker run --name   -d --network host prom/prometheus
```

## 部署mysql

```
docker run -p 3306:3306 -e MYSQL_ROOT_PASSWORD=admin -d mysql
```

## 部署exporter收集指标

```
docker run -d -p 9104:9104 -v $(pwd)/.my.cnf:/cfg/.my.cnf --network my-mysql-network prom/mysqld-exporter --config.my-cnf=/cfg/.my.cnf
```
