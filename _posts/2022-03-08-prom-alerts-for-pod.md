---
layout: post
title: 用于监控pod的alerts
date: 2022-03-08 00:12:05
---

最近需要使用prometheus监控kubernetes环境下的一些pod状态，定义了一些alert，分享一下：


- PodRestartingTooMuch：pod重启次数过多，重启次数大于10

```
sum(kube_pod_container_status_restarts_total{namespace="your_service_ns"}) by (cluster, namespace, pod, container) > 10
```

- PodFrequentlyRestarting：pod频繁重启，1分钟之内重启了3次

```
increase(kube_pod_container_status_restarts_total{namespace="your_service_ns"}[1m]) > 3
```

- PodContainerTerminated：pod出于退出状态，比如因为OOM、错误退出和不能正常运行

```
kube_pod_container_status_terminated_reason{reason=~"OOMKilled|Error|ContainerCannotRun", namespace="your_service_ns"} > 0
```

- PodNotReady：pod未处于ready状态，15分钟之内pod没有ready

```
min_over_time(sum by (cluster, namespace, pod, container) (kube_pod_status_phase{phase=~"Pending|Unknown|Failed",namespace="your_service_ns"})[15m:1m]) > 0
```

- DeploymentReplicasMismatch：deployment未按预期replicas运行

```
kube_deployment_status_replicas_available{namespace="your_service_ns"} != kube_deployment_spec_replicas{namespace="your_service_ns"}
```

- StatefulSetReplicasMismatch：statefulset未按预期replicas运行

```
kube_statefulset_status_replicas_available{namespace="your_service_ns"} != kube_statefulset_replicas{namespace="your_service_ns"}
```
