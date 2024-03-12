---
layout: post
title: flux学习之helmrelease spec
date: 2024-03-12 00:12:05
---

### chart

定义需要安装的chart。

### interval

reconcile间隔。

### kubeConfig

连接集群的kubeconfig。

### suspend

暂停reconcile。

### releaseName

helm release的名字。

### targetNamespace

helmrelease的ns。

### storageNamespace

用于存储helm的ns。

### dependsOn

依赖的对象。

### timeout

helm操作的超时。

### maxHistory

helm保存的修订版本数。

### serviceAccountName

reconcile helmrelease时使用的sa。

### install

定义helmrelease的helm安装操作的配置。

### upgrade

定义helmrelease的helm升级操作的配置。


### test

定义helmrelease的helm测试操作的配置。

### rollback

定义helmrelease的helm回滚操作的配置。


### uninstall

定义helmrelease的helm卸载操作的配置。


### valuesFrom

包含了指向包含此 HelmRelease Helm 值的资源的引用，以及如何合并这些值的信息。

### values

定义helm的values。


### 举例

```
apiVersion: helm.toolkit.fluxcd.io/v2beta2
kind: HelmRelease
metadata:
  name: vault
  namespace: flux-system
spec:
  interval: 1m
  releaseName: vault
  targetNamespace: vault
  chart:
    spec:
      chart: vault
      version: 0.27.0
      sourceRef:
        kind: HelmRepository
        name: hashicorp
        namespace: flux-system
  # https://github.com/hashicorp/vault-helm/blob/main/values.yaml
  values:
    csi:
      enabled: true
    ui:
      enabled: true
    ingress:
      enabled: true
```

定义了如何通过helm安装vault。

### ref

- https://fluxcd.io/flux/components/helm/api/v2beta2/#helm.toolkit.fluxcd.io/v2beta2.HelmReleaseSpec
