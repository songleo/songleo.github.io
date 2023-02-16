---
layout: post
title: dynatrace使用tips
date: 2023-02-15 00:12:05
---

- [定义alert时可用的特殊变量](https://www.dynatrace.com/support/help/observe-and-explore/davis-ai/anomaly-detection/metric-events/metric-key-events)
  - {alert_condition}：表示alert的条件，大于（above）或者小于（below）
  - {baseline}：基线的违反值
  - {dims}：指标的所有维度数据，比如dt.entity.custom_device.name和dt.entity.custom_device
  - {entityname}：受影响的服务名称
  - {metricname}：指标名称
  - {missing_data_samples}：缺失的样本数，启用缺失数据alert时生效
  - {severity}：指标当前的值
  - {threshold}：设置的告警阈值

- 在dynakube中启用azure监控

```
  spec:
    activeGate:
      capabilities:
      - routing
      - kubernetes-monitoring
      - dynatrace-api
      customProperties:
        value: |
          [azure_monitoring]
          azure_monitoring_enabled = true
```

- 调用api创建alert

```
curl 'https://test.live.dynatrace.com/api/v2/settings/objects' \
-X POST \
-H 'Accept: application/json; charset=utf-8' \
-H 'Content-Type: application/json; charset=utf-8' \
-H 'Authorization: Api-Token ACCESS_TOKEN' \
-d $'[{"schemaId":"builtin:anomaly-detection.metric-events","scope":"tenant","value":{"enabled":true,"summary":"Azure DB for PostgreSQL (Flexible) active connections [Azure]","queryDefinition":{"type":"METRIC_KEY","metricKey":"ext:cloud.azure.microsoft_dbforpostgresql.flexibleservers.active_connections","aggregation":"AVG","queryOffset":null,"entityFilter":{"dimensionKey":"dt.entity.custom_device","conditions":[]},"dimensionFilter":[]},"modelProperties":{"type":"STATIC_THRESHOLD","threshold":688,"alertOnNoData":false,"alertCondition":"ABOVE","violatingSamples":3,"samples":5,"dealertingSamples":5},"eventTemplate":{"title":"Azure DB for PostgreSQL (Flexible) has too many connections (> 80%).","description":"Found {severity} active connections in Azure DB for PostgreSQL (Flexible) {entityname}.","eventType":"CUSTOM_ALERT","davisMerge":true,"metadata":[]},"eventEntityDimensionKey":"dt.entity.custom_device","legacyId":null}}]'
```

- 获取所有alert

```
curl 'https://test.live.dynatrace.com/api/v2/settings/objects?schemaIds=builtin%3Aanomaly-detection.metric-events&scopes=tenant&fields=objectId%2Cvalue' -X GET -H 'Accept: application/json; charset=utf-8' -H 'Content-Type: application/json; charset=utf-8' -H 'Authorization: Api-Token ACCESS_TOKEN' | jq '. > all-alerts.json
```

> :) 未完待续......
