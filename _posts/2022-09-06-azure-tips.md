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

> :) 未完待续......
