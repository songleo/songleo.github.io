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

> :) 未完待续......
