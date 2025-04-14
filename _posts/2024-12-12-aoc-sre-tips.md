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

## 查看证书包含的域名

```
openssl x509 -in cert.pem -text -noout | grep DNS
```

## 进入aap db

```
awx-manage dbshell
```

## debug rds connection issue

https://repost.aws/knowledge-center/rds-mysql-max-connections


## 获取aks kubeconfig失败

如果报错如下：
```
An exception occurred during task execution. To see the full traceback, use -vvv. The error was: ValueError: API version 2024-08-01 does not have operation group 'managed_clusters'
```
降级azure-mgmt-containerservice模块到33.0.0。

## az查询appgw信息

```
az network application-gateway show --name applicationgateway --resource-group MC_rg_name_aks_name_location
```

## 查询证书是否过期

```
openssl x509 -in cert.crt -noout -enddate
```
