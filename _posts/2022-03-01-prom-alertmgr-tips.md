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
      expr: sum(http_inprogress_requests) bysc (job)
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

- increase使用：计算2分钟的增长量

```
increase(kube_pod_container_status_restarts_total[2m])

increase(kube_pod_container_status_restarts_total[2m]) / 120 // rate(kube_pod_container_status_restarts_total[2m])
```

- xxx_over_time：计算指定时间范围内区间向量内每个度量指标

  - avg_over_time(range-vector)：平均值
  - min_over_time(range-vector)：最小值
  - max_over_time(range-vector)：最大值
  - sum_over_time(range-vector)：求和
  - count_over_time(range-vector)：样本数据个数
  - quantile_over_time(scalar, range-vector)：样本数据值分位数，φ-quantile (0 ≤ φ ≤ 1)
  - stddev_over_time(range-vector)：总体标准差
  - stdvar_over_time(range-vector)：总体标准方差

- 时间范围：[15m:1m]

表示取15分钟内的样本数据，按每分钟分为1断，例如max_over_time(kube_pod_container_status_restarts_total{namespace="ansible-automation-platform"}[15m:1m])

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

- 模拟一个alert

```
curl -d '[{"labels": {"Alertname": "Test"}}]' http://localhost:9093/api/v1/alerts
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
send_resolved: true
```

- alert匹配配置

```
match // alert按标签完全匹配
match_re // alert按标签正则匹配

routes:
  - matchers:
      - severity =~ "warning|critical"
      - alertname !~ "Watchdog|UpdateAvailable|ViolatedPolicyReport|AlertmanagerReceiversNotConfigured"
    receiver: default-receiver
```

- alertmanager receiver代理配置

```
receivers:
  - name: default-receiver
    slack_configs:
    - channel: alerts
      http_config:
        proxy_url: http://proxy.com:1234
```

- alert分组

```
group_by: ['alertname', 'cluster', 'service'] // 具有这些标签的alerts被分为一个组，聚合多条alerts成一条alert发送
group_by: [...] // 禁用分组
```

- 相同alert发送间隔

```
group_wait: 5m // alert触发后，会等待5分钟再发送给receiver
group_interval: 2m // 然后每隔2分钟检查group中的alert状态
repeat_interval: 4m // 收到告警后，一个分组被创建，等待5分钟发送组内告警，如果后续组内的告警信息相同，这些告警会在6分钟后发送，但是6分钟内这些告警不会被发送，后续就会按每6（2 + 4）分钟发送一次警告
```

- 是否继续匹配子路由

```
continue: false // 匹配到就发送
continue: true // 继续匹配子路由，alert会被发送到多个receiver
```

- awesome prometheus alets

```
https://awesome-prometheus-alerts.grep.to/rules.html
```

- 在线验证relabeling

```
https://relabeler.promlabs.com/
```

- 配置错误信息汇总

  - url配置格式不对
  ```
  $ amtool check-configt tmp.yaml
  Checking 'tmp.yaml'  FAILED: unsupported scheme "" for URL

  amtool: error: failed to validate 1 file(s)

  ```

- 判断某个prometheus job down

```
absent(up{job="kube-controller-manager"} == 1)
```

> :) 未完待续......
