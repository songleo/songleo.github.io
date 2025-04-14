---
layout: post
title: azure使用tips
date: 2022-09-06 00:12:05
---

- 通过service principle登录

```
az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_SECRET --tenant $AZURE_TENANT
```

- az创建application

```
az ad app create --display-name ssli-aap-test --web-redirect-uris https://app.us1.signalfx.com/
```

- az查询vm的metric

```
az monitor metrics list --resource resource_id  --metric "Percentage CPU"
az monitor metrics list --resource /ID/psql-aaps4rq3muq37ubq-eastus --metric "IOPS"
```

- 获取当前ip

```
curl -s ifconfig.me
```

- 禁止访问aks

```
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME \
  --location $LOCATION \
  --api-server-authorized-ip-ranges ""

az aks update \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME \
  --api-server-authorized-ip-ranges "$MY_IP/32"
```
除非将你的ip添加到--api-server-authorized-ip-ranges，否则无法访问aks。

> :) 未完待续......
