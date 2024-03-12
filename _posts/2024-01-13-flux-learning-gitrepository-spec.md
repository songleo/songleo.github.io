---
layout: post
title: flux学习之gitrepository spec
date: 2024-01-13 00:12:05
---

### url

git repo的url。

### secretRef

访问git repo的凭证。

### interval

多久检查一次repo的更新。

### timeout

git操作超时定义。

### ref

使用的分支或者标签等。

### verify

是否验证签名。

### ignore

定义需要忽略的文件。

### suspend

是否暂停更新。

### gitImplementation

git的实现。

### recurseSubmodules

是否允许克隆子模块。

### include

指定包含的gitrepository。

### accessFrom

定义可以引用这个对象的ns，暂未实现。

### 举例

```
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: kubernetes-apps
  namespace: flux-system
spec:
  interval: 1m0s
  ref:
    branch: main
  url: https://github.com/songleo/kubernetes-apps
```

自动从 https://github.com/songleo/kubernetes-apps 的main分支同步kubernetes应用配置，每分钟检查一次更新。这样，任何对该git仓库的更改都会被自动应用到关联的kubernetes集群中，实现持续的配置同步和部署自动化。

### ref

- https://fluxcd.io/flux/components/source/api/v1beta2/#source.toolkit.fluxcd.io/v1beta2.GitRepositorySpec
