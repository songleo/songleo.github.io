---
layout: post
title: 使用vector收集pod日志并转发到prometheus remote write
date: 2022-01-21 00:12:05
---

## 集群环境介绍

- ACM Hub：启用了observability service
- AKS cluster：将AKS导入到ACM

本文主要实现将AKS cluster上某个pod的日志转发汇总到ACH Hub端，并在ACM Hub端定义相应的alert rule，如果在Hub端检测到相应错误日志，触发alert，用户能及时知道远端AKS集群某个服务出现问题。

## 安装vector

```
$ helm repo add vector https://helm.vector.dev
$ helm repo update
$ helm show values vector/vector
$ cat <<-'VALUES' > values.yaml
role: Agent
VALUES
$ helm install vector vector/vector \
  --namespace vector \
  --create-namespace \
  --values values.yaml
```

## pod的日志格式

pod会打印很多格式的日志，这里只关注apache格式的日志。

```
10.244.0.142 - admin [13/Dec/2021:12:20:36 +0000] "GET /api/v2/metrics/ HTTP/1.1" 200 7983 "http://10.244.2.22:8052/api/v2/metrics" "Prometheus/2.26.1" "-"

10.244.0.142 - admin [13/Dec/2021:12:21:35 +0000] "GET /api/v2/metrics HTTP/1.1" 301 0 "-" "Prometheus/2.26.1" "-"

10.244.0.142 - admin [09/Dec/2021:19:32:13 +0000] "GET /api/v2/metrics/ HTTP/1.1" 500 41 "http://10.244.2.22:8052/api/v2/metrics" "Prometheus/2.26.1" "-"
```

## 在deployment上配置忽略部分container日志

因为pod中有多个container，这里我们只希望收集automation-controller-web容器的日志，给pod添加annotation后，vector会忽略指定的container日志。

```
$ k get deploy automation-controller -o yaml | grep -B 3 'vector.dev/exclude-containers: redis'
  template:
    metadata:
      annotations:
        vector.dev/exclude-containers: redis,automation-controller-task,automation-controller-ee
```

在deployment中配置了相应的annotation。

## 配置vector收集并转发日志

vector完整配置如下，我会解释相关配置含义：

```
$ k get cm vector -o yaml
apiVersion: v1
data:
  agent.yaml: |
    data_dir: /vector-data-dir
    api:
      enabled: true
      address: 127.0.0.1:8686
      playground: false
    sources:
      kubernetes_logs:
        type: kubernetes_logs
        extra_label_selector: "app.kubernetes.io/name=automation-controller"
    sinks:
      prometheus_remote_write:
        type: prometheus_remote_write
        inputs:
          - log_to_metric_id
        endpoint: endpoint: https://prometheus_remote_write_url/v1/receive
        default_namespace: automation_controller_web
        tls:
          ca_file: /tlscerts/ca/ca.crt
          crt_file: /tlscerts/certs/tls.crt
          key_file: /tlscerts/certs/tls.key
      stdout:
        type: console
        inputs:
          - log_to_metric_id
          - non_2xx_log
        encoding:
          codec: json
    transforms:
      remap_id:
        type: remap
        inputs:
          - kubernetes_logs
        source: . = .message
      filter_id:
        type: filter
        inputs:
          - remap_id
        condition: match!(.message, r'GET /api/v2/metrics[/]? HTTP/1.1')
      apache_log:
        type: remap
        inputs:
          - filter_id
        source: . = parse_apache_log!(.message, "combined")
      non_2xx_log:
        type: filter
        inputs:
          - apache_log
        condition: .status != 200
      log_to_metric_id:
        type: log_to_metric
        inputs:
          - non_2xx_log
        metrics:
          - type: counter
            field: status
            name: response_total
            tags:
              cluster: aap-azure-demo
              host: "{{host}}"
              method: "{{method}}"
              status: "{{status}}"
kind: ConfigMap
metadata:
  annotations:
    meta.helm.sh/release-name: vector
    meta.helm.sh/release-namespace: vector
  creationTimestamp: "2022-01-20T03:03:08Z"
  labels:
    app.kubernetes.io/component: Agent
    app.kubernetes.io/instance: vector
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/name: vector
    app.kubernetes.io/version: 0.19.0-distroless-libc
    helm.sh/chart: vector-0.4.0
  name: vector
  namespace: vector
  resourceVersion: "29901478"
  uid: ae118ac9-e38a-4770-9468-1896a1c4d4bb
```

只收集具有该标签app.kubernetes.io/name=automation-controller的pod日志：

```
    sources:
      kubernetes_logs:
        type: kubernetes_logs
        extra_label_selector: "app.kubernetes.io/name=automation-controller"
```

将收集的日志转发到prometheus remote write，并启用tls，这里需要提前创建相应的tls配置，并挂载到vector pod：

```
    sinks:
      prometheus_remote_write:
        type: prometheus_remote_write
        inputs:
          - log_to_metric_id
        endpoint: https://prometheus_remote_write_url/v1/receive
        default_namespace: automation_controller_web
        tls:
          ca_file: /tlscerts/ca/ca.crt
          crt_file: /tlscerts/certs/tls.crt
          key_file: /tlscerts/certs/tls.key
```

将相关日志打印到终端，方便调试：

```
      stdout:
        type: console
        inputs:
          - log_to_metric_id
          - non_2xx_log
        encoding:
          codec: json
```

提取pod日志：

```
      remap_id:
        type: remap
        inputs:
          - kubernetes_logs
        source: . = .message
```

仅保留apache相关日志

```
      filter_id:
        type: filter
        inputs:
          - remap_id
        condition: match!(.message, r'GET /api/v2/metrics[/]? HTTP/1.1')
```

将日志解析成apache标准格式：

```
      apache_log:
        type: remap
        inputs:
          - filter_id
        source: . = parse_apache_log!(.message, "combined")
```

过滤状态码不是200的日志：

```
      non_2xx_log:
        type: filter
        inputs:
          - apache_log
        condition: .status != 200
```

将日志装换成metric方便发送给prometheus remote write：

```
      log_to_metric_id:
        type: log_to_metric
        inputs:
          - non_2xx_log
        metrics:
          - type: counter
            field: status
            name: response_total
            tags:
              cluster: aap-azure-demo
              host: "{{host}}"
              method: "{{method}}"
              status: "{{status}}"
```

这里使用的是counter类型的指标。最后可以从vector pod中查看打印的日志，如下：

- 装换成apache标准格式日志

```
{
  "agent": "Prometheus/2.26.1",
  "host": "10.244.0.227",
  "message": "GET /api/v2/metrics HTTP/1.1",
  "method": "GET",
  "path": "/api/v2/metrics",
  "protocol": "HTTP/1.1",
  "referrer": "-",
  "size": 0,
  "status": 301,
  "timestamp": "2022-01-21T07:03:51Z",
  "user": "admin"
}
```

- apache日志转换成metric

```
{
  "name": "response_total",
  "tags": {
    "cluster": "aap-azure-demo",
    "host": "10.244.0.227",
    "method": "GET",
    "status": "301"
  },
  "timestamp": "2022-01-21T07:03:51Z",
  "kind": "incremental",
  "counter": {
    "value": 1.0
  }
}
```

最后在grafana中查询到的metric如下：

```
automation_controller_web_response_total{
  cluster="aap-azure-demo",
  host="10.244.0.227",
  method="GET",
  receive="true",
  status="301",
  tenant_id="d031e62c-c103-4df4-a899-3671d0236640"
}

automation_controller_web_response_total{
  cluster="aap-azure-demo",
  host="10.244.0.227",
  method="GET",
  receive="true",
  status="500",
  tenant_id="d031e62c-c103-4df4-a899-3671d0236640"
}
```

可以基于上面的metric定义相应的alert rule，如果pod打印非200的日志，就可以触发一条alert，知道某个集群上的服务出现问题，在ACM Hub端创建相应的alert rule：

```
kind: ConfigMap
apiVersion: v1
metadata:
  name: thanos-ruler-custom-rules
  namespace: open-cluster-management-observability
data:
  custom_rules.yaml: |
    groups:
    - name: automation-controller-web-health
      rules:
      - alert: responseError
        expr: automation_controller_web_response_total{status="500"} > 3
        for: 1m
        labels:
          cluster: aap-azure-demo
          severity: warning
```

等待几分钟，就可以在grafana中查看到相应的alert，如下：

```
ALERTS{
  alertname="responseError",
  alertstate="firing",
  cluster="aap-azure-demo",
  host="10.244.0.227",
  method="GET",
  receive="true",
  severity="warning",
  status="500",
  tenant_id="d031e62c-c103-4df4-a899-3671d0236640"
}
```
