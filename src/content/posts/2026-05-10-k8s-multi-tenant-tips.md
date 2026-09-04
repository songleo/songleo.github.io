---
title: "k8s多租户学习"
description: "为每个租户创建独立namespace，并创建相应的resourcequota和limitrange限制资源使用。"
pubDatetime: 2026-05-10T00:12:05+08:00
tags: ["kubernetes", "最佳实践", "学习笔记", "云原生"]
---
## namespace级别隔离

为每个租户创建独立namespace，并创建相应的resourcequota和limitrange限制资源使用。

## 权限隔离

通过rbac创建租户管理员角色和一般用户。

## 网络隔离

通过networkpolicy实现网络隔离，如默认拒绝跨ns的流量，但是允许访问dns服务。

## 节点隔离

给节点设置相应的污点，让租户允许部署需添加容忍。

## vcluster

为每个租户创建vcluster，提供独立的control plane。

## 独立的cluster

每个用户创建独立的无力集群，实现硬隔离。
