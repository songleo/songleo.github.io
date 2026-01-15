---
layout: post
title: 使用external-secrets访问aws secrets manager
date: 2026-01-15 00:12:05
---

## 遇到的错误

在安装 external-secrets 并创建 clustersecretstore 后，状态一直不是 ready，日志中出现了以下的错误：

```
accessdenied: not authorized to perform sts:assumerolewithwebidentity
```

这意味着 external-secrets 试图通过 serviceaccount 向 aws sts 请求权限，但 aws 并没有授予这个 serviceaccount 相应的 iam role 权限。

## 解决步骤

### 1. 确认使用的 serviceaccount

external-secrets 的 pod 使用哪个 serviceaccount，需要确认清楚。

### 2. 检查 rosa/eks 的 oidc provider

集群是否已经启用 oidc，并在 aws iam 中注册，确保 aws 可以验证 pod 身份。

### 3. 在 aws 上创建 iam role

为 external-secrets 的 serviceaccount 创建一个 iam role，并配置允许通过 oidc token assume 这个 role。

### 4. 设置 role 的信任关系

trust policy 指定只有对应的 serviceaccount 可以 assume 这个 role。

### 5. 为 role 授权访问 secrets manager

给 role 添加最小权限策略，使其可以读取需要的 secret。

### 6. 把 role 绑定到 serviceaccount

在 serviceaccount 上添加 annotation，指向刚创建的 iam role。

### 7. 重启 external-secrets pod

让 pod 获取新的 oidc token 并通过 sts 拿到临时凭证。

### 8. 验证 clustersecretstore 状态

确认状态变成 ready，external-secrets 能正常读取 secrets manager。
