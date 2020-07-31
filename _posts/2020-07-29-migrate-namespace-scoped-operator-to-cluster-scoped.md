---
layout: post
title: 将namespace-scoped的operator修改成cluster-scoped
date: 2020-07-29 12:12:05
---

## 修改main函数

在main.go中，创建manager时，将namespace参数修改成空。

## 修改api的scope

在types.go文件中，修改scope为Cluster.

## 生成新的crd

operator-sdk generate crds

## 修改rbac

将rbac从role修改成clusterrole，rolebinding修改成clusterrolebind。

## 修改operator.yaml

将operator.yaml中的WATCH_NAMESPACE修改成空，然后就可以重新编译测试了。需要注意，代码中使用WATCH_NAMESPACE的地方都需要修改。并确保修改获取cluster-scoped的obj的相关代码。

## ref

https://developers.redhat.com/blog/2020/06/26/migrating-a-namespace-scoped-operator-to-a-cluster-scoped-operator/