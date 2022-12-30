---
layout: post
title: datadog使用tips
date: 2022-12-30 00:12:05
---

- 检查agent配置

```
kubectl exec -it datadog-agent-78hq4 agent configcheck
```

- 检查agent日志

```
kubectl exec -it datadog-agent-78hq4 tail -f /var/log/datadog/agent.log
```

- helm安装agent

```
helm install datadog-agent -f datadog-values.yaml --set datadog.site='datadoghq.com' --set datadog.apiKey='xxxx' datadog/datadog
```

- 配置agent收集prometheus指标

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus-deployment
  labels:
    app: prometheus
    purpose: example
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
      purpose: example
  template:
    metadata:
      labels:
        app: prometheus
        purpose: example
      annotations:
          ad.datadoghq.com/prometheus-example.check_names: |
            ["openmetrics"]
          ad.datadoghq.com/prometheus-example.init_configs: |
            [{}]
          ad.datadoghq.com/prometheus-example.instances: |
            [
              {
                "openmetrics_endpoint": "http://%%host%%:%%port%%/metrics",
                "namespace": "documentation_example_kubernetes",
                "metrics": [
                  {"promhttp_metric_handler_requests": "handler.requests"},
                  {"promhttp_metric_handler_requests_in_flight": "handler.requests.in_flight"},
                  "go_memory.*"
                ]
              }
            ]
...
```

详细配置：https://github.com/DataDog/integrations-core/blob/master/openmetrics/datadog_checks/openmetrics/data/conf.yaml.example 和 https://docs.datadoghq.com/containers/kubernetes/prometheus/?tab=kubernetesadv2#advanced-configuration

> :) 未完待续......
