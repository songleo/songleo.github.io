---
layout: post
title: vector使用tips
date: 2022-01-21 00:12:05
---

- 收集指定的pod日志

如果是多个container，可以通过添加annotation过滤container，例如：kubectl annotate deploy demo vector.dev/exclude-containers="c1,c2"

```
    sources:
      kubernetes_logs:
        type: kubernetes_logs
        extra_label_selector: "component=metrics-collector"
```

- 将日志转发到prometheus remote write

需要讲日志先装换成metric类型。

```
    sinks:
      prometheus_remote_write:
        type: prometheus_remote_write
        inputs:
          - log_to_metric_id
        endpoint: https://localhost:1234/receive
        default_namespace: metric_name_prefix
        tls:
          ca_file: /tlscerts/ca/ca.crt
          crt_file: /tlscerts/certs/tls.crt
          key_file: /tlscerts/certs/tls.key
```

- 将日志打印到终端

```
      stdout:
        type: console
        inputs:
          - log_to_metric_id
        encoding:
          codec: json
```

- 解析日志键值对

```
    transforms:
      remap_id:
        type: remap
        inputs:
          - kubernetes_logs
        source: . = parse_key_value!(.message)
```

- 过滤特定的日志

```
      filter_id:
        type: filter
        inputs:
          - remap_id
        condition: .level != "debug"
```

- 将日志转换成metric

```
      log_to_metric_id:
        type: log_to_metric
        inputs:
          - filter_id
        metrics:
          - type: set
            field: msg
            tags:
              cluster: ssli-aks-cluster
              msg: "{{msg}}"
              level: "{{level}}"
```

- 解析常见日志格式

```
parse_nginx_log!(.message, "combined")
parse_apache_log!(.message, "combined")
parse_common_log!(.message)
parse_syslog!(.message)
parse_klog!(.message)
```

- 调试vrl

```
$ k exec -it vector-9hbq6 -- vector vrl
$ match("GET /api/v2/metrics/ HTTP/1.1", r'GET /api/v2/metrics[/]? HTTP/1.1')
true
```

> :) 未完待续......
