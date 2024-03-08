---
layout: post
title: 如何在kubernetes使用dynatrace收集prometheus指标
date: 2024-03-08 00:12:05
---

### 前提条件

需要确保kubernetes集群已经被dynatrace监控，即已经安装了dynatrace组件比如activegate、oneagent等。

### 详细步骤

#### 查看metrics endpoint

这里以external-secrets为例子，通过查看external-secrets deployment获取指标的url：

```
$ k get deployment cluster-external-secrets -o yaml | grep metric
        - --metrics-addr=:8080
          name: metrics
```

可以看到external-secrets将指标数据暴露在8080端口。

#### 验证指标

通过端口转发，并使用curl命令验证指标url可用：

```
$ k port-forward po/cluster-external-secrets-5c667cb8d6-q7d65 8080:8080
Forwarding from 127.0.0.1:8080 -> 8080
Forwarding from [::1]:8080 -> 8080
```

在另外一个中端运行下面命令查看指标数据：

```
$ curl -s http://localhost:8080/metrics
```

可以看到比如externalsecret_status_condition指标。

#### 创建service暴露指标给dynatrace

在service的annotations中配置相应参数，比如端口、路径等，dynatrace会自动收集该端口和路径暴露的指标，这里使用过滤器，只收集clusterexternalsecret_status_condition和clustersecretstore_status_condition指标。

```
$ kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  annotations:
    metrics.dynatrace.com/scrape: 'true'
    metrics.dynatrace.com/port: '8080'
    metrics.dynatrace.com/secure: 'false'
    metrics.dynatrace.com/path: '/metrics'
    metrics.dynatrace.com/filter: |
        {
            "mode": "include",
            "names": [
                "clusterexternalsecret_status_condition",
                "clustersecretstore_status_condition"
            ]
        }
  name: cluster-external-secrets-metrics
  namespace: external-secrets
spec:
  clusterIP: None
  ports:
  - name: metrics-port
    port: 8080
  selector:
    app.kubernetes.io/instance: cluster
    app.kubernetes.io/name: external-secrets
EOF
```

等待几分钟，就可以在dynatrace的console中查询到收集的指标数据。

### 参考

- https://docs.dynatrace.com/docs/platform-modules/infrastructure-monitoring/container-platform-monitoring/kubernetes-monitoring/monitor-prometheus-metrics
