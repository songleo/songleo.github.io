---
layout: post
title: prometheus过滤指标数据
date: 2020-07-03 12:12:05
---

## prometheus配置文件如下


```
global:
  scrape_interval:     60s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'ssli-prometheus'
    scrape_interval: 3s

    metric_relabel_configs:
    - action: drop
      source_labels:
      - __name__
      regex: go_info


    - action: drop
      source_labels:
      - __name__
      regex: go_gc_duration_seconds

    static_configs:
    - targets: ['192.168.1.105:9090']

```

## 启动prometheus

```
$ docker run --rm -p 9090:9090 -v /Users/ssli/share/git/k8s_practice/prometheus/filter_metrics/prometheus-filter-metrics.yml:/etc/prometheus/prometheus.yml prom/prometheus --web.enable-lifecycle --config.file=/etc/prometheus/prometheus.yml
```

打开prometheus ui: http://localhost:9090/graph 查看指标数据，可以看到go_info和go_gc_duration_seconds指标数据都不存在。通过配置metric_relabel_configs可以将匹配的指标数据丢弃。

当然，通过配置keep action可以保留匹配的指标数据，使用以下配置文件可以实现仅收集go_info和go_gc_duration_seconds指标数据：

```
global:
  scrape_interval:     60s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'ssli-prometheus'
    scrape_interval: 3s

    metric_relabel_configs:
    - action: keep
      source_labels:
      - __name__
      regex: go_info|go_gc_duration_seconds

    static_configs:
    - targets: ['192.168.1.105:9090']

```
