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
az monitor metrics list --resource /subscriptions/3f7e29ba-24e0-42f6-8d9c-5149a14bda37/resourceGroups/mrg-aap-market-preview-20220906083014/providers/Microsoft.DBforPostgreSQL/flexibleServers/psql-aaps4rq3muq37ubq-eastus --metric "IOPS"
```
