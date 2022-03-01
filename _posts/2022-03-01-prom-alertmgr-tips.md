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
