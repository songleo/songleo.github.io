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

- topk使用：top10访问量

```
topk(10, http_requests_total)
```

- rate增长率：过去5分钟每秒的请求增长率

```
rate(http_requests_total[5m])
```

例如过去5分钟样本值是：[1, 2, 3, 10, 31]，则rate(http_requests_total[5m])为31 - 1/(5*60) = 0.1，即平均每秒钟增长0.1，300秒钟增加了30次（31-1）

和聚合相关函数使用时，先调用rate，否则rate不知道计数器是否被重置。

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
