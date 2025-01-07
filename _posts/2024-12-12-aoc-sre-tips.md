---
layout: post
title: aoc sre tips
date: 2024-12-12 00:12:05
---

## 订阅组件的release信息

- https://github.com/nginxinc/nginx-ingress-helm-operator/releases
- https://github.com/Dynatrace/dynatrace-operator/releases/tag/v1.4.0
- https://releases.aks.azure.com/#tabus

## 检查aap job status

- https://access.redhat.com/solutions/5532181


## 解决aks failed状态问题

```
az resource update --ids <aks-resource-id>
```

## 修改aap gw admin password

```
aap-gateway-manage update_password --username=admin --password=changeme
```

## aap无法登录

密码正确时候，检查CSRF配置。

## 从pfx中提取所有证书

```
openssl pkcs12 -in ssli.pfx -nokeys -out allcerts.crt -legacy
```
