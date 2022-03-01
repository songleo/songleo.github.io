---
layout: post
title: prometheus&alertmanager tips
date: 2022-03-01 00:12:05
---

- 查看warning级别的alert

```
amtool --alertmanager.url=http://localhost:9093 alert severity=warning
```

- 查看静默的alert

```
amtool --alertmanager.url=http://localhost:9093 silence
```

- 验证alert配置文件

```
amtool check-config alert.yaml
```

- alert解决后需要通知

```
receivers：
- name: slack
  slack_configs:
    - channel: '#monitoring'
      send_resolved: true
```

> :) 未完待续......
