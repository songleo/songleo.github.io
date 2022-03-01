---
layout: post
title: prometheus&alertmanager tips
date: 2022-03-01 00:12:05
---

- 查看warning级别的alert

```
amtool --alertmanager.url=http://localhost:9093 alert severity=warning
```

- recoding rule提高查询性能

```
groups:
  - name: example
    rules:
    - record: job:http_inprogress_requests:sum
      expr: sum(http_inprogress_requests) by (job)
```

- histogram_quantile使用：从bucket类型的向量b中计算φ(0 ≤ φ ≤ 1)分位数的样本的最大值

```
histogram_quantile(0.9, rate(employee_age_bucket_bucket[10m]))
```

最近10分钟之内90%的样本的最大值。例如过去10分钟的样本数据：

```
[1, 1, ... 1,  1,  1,  50,  50] // 共100条数据，p99=50 p90=1
```

histogram_quantile对histogram类型是在服务器端计算，而对sumamry是在客户端计算，即通过promql计算分位数试，summary有更好的性能。

- predict_linear使用：guage类型变化趋势的预测

```
predict_linear(node_filesystem_free{job="node"}[1h], 4 * 3600)
```

以当前1个小时的指标数据，预测4小时后系统磁盘空间的剩余情况。

- delta使用：guage类型在指定时间内的差异

```
delta(cpu_temp_celsius{host="zeus"}[2h])
```

cpu温度在2个小时之间的差异。

- topk使用：top10访问量

```
topk(10, http_requests_total)
```

- rate使用：过去5分钟请求增长率

```
rate(http_requests_total[5m])
```

例如过去5分钟样本值是：[1, 2, 3, 10, 31]，则rate(http_requests_total[5m])为31 - 1/(5*60) = 0.1，即平均每秒钟增长0.1，300秒钟增加了30次（31-1)，rate一般用于counter类指标。和聚合相关函数使用时，先调用rate，否则rate不知道计数器是否被重置。

- 查看静默的alert

```
amtool --alertmanager.url=http://localhost:9093 silence
```

- 验证alert配置文件

```
amtool check-config alert.yaml
```

- 抑制规则例子

```
- source_match:
    alertname: ClusterDown
    severity: critical
  target_match:
    severity: critical
  equal:
    - cluster
```

如果收到ClusterDown的alert且severity是critical。那么当有新的alert且severity是critical，如果新的alert中的cluster的值和ClusterDown中的相同，则启动抑制停止发送新的alert。

- alert解决后需要通知

```
receivers：
- name: slack
  slack_configs:
    - channel: '#monitoring'
      send_resolved: true
```

> :) 未完待续......
