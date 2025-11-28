---
layout: post
title: aoc sre tips
date: 2024-12-12 00:12:05
---

## saas login

```
python3 -m venv .venv
source .venv/bin/activate
lkinit
python3 aws-saml.py
aws --profile saml sts get-caller-identity


INSTANCE_NAME=cus-25ssli AWS_REGION=us-east-1 make login-to-instance
```

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

## aap gw修改密码

```
aap-gateway-manage update_password --username=admin --password=password
```

- 创建的aap managed applicaition会被自动清除，请在managed app上添加以下tag以防被自动删除

```
expire_on : 20230101
```

- 创建的aap managed applicaition的ui url可以在applicationsAAPDeploy deployments中的outputs页面查到

- 创建的aap managed applicaition的访问模式(public/private)可以在applicationsAAPDeploy deployments中的inputs页面查到

- 创建的aap managed applicaition，如果要访问其中的aks，需要创建相应的jump vm，然后才能访问，具体参考该工具：https://github.com/ansible/aap-azurerm/tree/main/tools/utils

- 创建jump vm访问aap

```
$ az login -t your.onmicrosoft.com
$ pwd
/Users/ssli/share/git/aap-azurerm/tools/utils
$ ./create_jump_vm.py
```

- nc连接postgres

```
/ # nc -vz ssli-postgres.postgres.database.azure.com 5432
ssli-postgres.postgres.database.azure.com (10.226.0.4:5432) open
```

- nc验证dns服务

```
nc -vz 1.2.3.4 53
-v：显示更多信息
-z：只扫描主机和端口，无需建立连接，53端口一般用于dns服务
```

- 创建postgres client测试db

```
$ kubectl run pg-client --image postgres:latest --command -- sleep 3600
$ k exec -it pg-client -- /bin/sh
# psql -h ssli-postgres.postgres.database.azure.com -U ssli -d postgres
Password for user ssli:
psql (15.3 (Debian 15.3-1.pgdg120+1), server 13.10)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, compression: off)
Type "help" for help.

postgres=>
```

- 验证dns server

```
kubectl run -i --tty --rm debug --image=quay.io/aoc/netshoot:latest --restart=Never -- sh
host test.com
```

- adastra tips

```
source venv/bin/activate
adastra config set --env production
adastra customer list

adastra access request cus-xxx
adastra access status
adastra access login cus-xxx
```

- 验证receptor

```
receptorctl --socket /var/run/receptor/receptor.sock ping 10.65.55.57
```
