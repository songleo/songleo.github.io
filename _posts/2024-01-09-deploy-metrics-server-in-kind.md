---
layout: post
title: 在kind中部署metrics-server
date: 2024-01-09 00:12:05
---

### 使用kind创建k8s集群

```
kind create cluster --name private-cloud --config kind/kind-config.yaml
kind export kubeconfig --name private-cloud
kubectl label nodes private-cloud-worker node-role.kubernetes.io/worker=worker
kubectl label nodes private-cloud-worker2 node-role.kubernetes.io/worker=worker
```

### 部署metrics-server

```
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

你会发现不work，需要在metrics-server的deployment中args部分添加一行`- --kubelet-insecure-tls`，让kubelet忽略tls证书验证，这样才能正常工作。

### 验证

```
$ k top no
NAME                          CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
private-cloud-control-plane   225m         3%     1375Mi          8%
private-cloud-worker          59m          0%     2522Mi          15%
private-cloud-worker2         59m          0%     2059Mi          12%
$ kubectl get --raw /api/v1/nodes/private-cloud-worker/proxy/metrics/resource
# HELP container_cpu_usage_seconds_total [ALPHA] Cumulative cpu time consumed by the container in core-seconds
# TYPE container_cpu_usage_seconds_total counter
container_cpu_usage_seconds_total{container="awx-manager",namespace="awx",pod="awx-operator-controller-manager-7577b7567d-pjzp5"} 176.721419 1704815762740
container_cpu_usage_seconds_total{container="awx-rsyslog",namespace="awx",pod="awx-web-5d5d7ccf85-7jjgm"} 56.16757 1704815766953
container_cpu_usage_seconds_total{container="awx-web",namespace="awx",pod="awx-web-5d5d7ccf85-7jjgm"} 60.11334 1704815757326
container_cpu_usage_seconds_total{container="kindnet-cni",namespace="kube-system",pod="kindnet-j6kct"} 29.708938 1704815767374
container_cpu_usage_seconds_total{container="kube-proxy",namespace="kube-system",pod="kube-proxy-54z4w"} 20.659198 1704815753172
container_cpu_usage_seconds_total{container="kube-rbac-proxy",namespace="awx",pod="awx-operator-controller-manager-7577b7567d-pjzp5"} 1.621941 1704815758361
container_cpu_usage_seconds_total{container="manager",namespace="flux-system",pod="helm-controller-865448769d-vq8q6"} 24.254694 1704815760124
container_cpu_usage_seconds_total{container="manager",namespace="flux-system",pod="source-controller-fc5555fb-j548x"} 42.873903 1704815764977
container_cpu_usage_seconds_total{container="metrics-server",namespace="kube-system",pod="metrics-server-75f45b4dd4-67fhz"} 74.301466 1704815756073
container_cpu_usage_seconds_total{container="nginx",namespace="default",pod="nginx-57d84f57dc-4497c"} 0.092544 1704815758476
container_cpu_usage_seconds_total{container="postgres",namespace="awx",pod="awx-postgres-13-0"} 41.471509 1704815766520
container_cpu_usage_seconds_total{container="redis",namespace="awx",pod="awx-web-5d5d7ccf85-7jjgm"} 28.026551 1704815765480
# HELP container_memory_working_set_bytes [ALPHA] Current working set of the container in bytes
# TYPE container_memory_working_set_bytes gauge
container_memory_working_set_bytes{container="awx-manager",namespace="awx",pod="awx-operator-controller-manager-7577b7567d-pjzp5"} 3.7474304e+07 1704815762740
container_memory_working_set_bytes{container="awx-rsyslog",namespace="awx",pod="awx-web-5d5d7ccf85-7jjgm"} 1.62619392e+08 1704815766953
container_memory_working_set_bytes{container="awx-web",namespace="awx",pod="awx-web-5d5d7ccf85-7jjgm"} 9.64734976e+08 1704815757326
container_memory_working_set_bytes{container="kindnet-cni",namespace="kube-system",pod="kindnet-j6kct"} 2.275328e+07 1704815767374
container_memory_working_set_bytes{container="kube-proxy",namespace="kube-system",pod="kube-proxy-54z4w"} 3.2546816e+07 1704815753172
container_memory_working_set_bytes{container="kube-rbac-proxy",namespace="awx",pod="awx-operator-controller-manager-7577b7567d-pjzp5"} 1.4041088e+07 1704815758361
container_memory_working_set_bytes{container="manager",namespace="flux-system",pod="helm-controller-865448769d-vq8q6"} 2.6689536e+07 1704815760124
container_memory_working_set_bytes{container="manager",namespace="flux-system",pod="source-controller-fc5555fb-j548x"} 3.9497728e+07 1704815764977
container_memory_working_set_bytes{container="metrics-server",namespace="kube-system",pod="metrics-server-75f45b4dd4-67fhz"} 3.3697792e+07 1704815756073
container_memory_working_set_bytes{container="nginx",namespace="default",pod="nginx-57d84f57dc-4497c"} 7.729152e+06 1704815758476
container_memory_working_set_bytes{container="postgres",namespace="awx",pod="awx-postgres-13-0"} 6.8030464e+07 1704815766520
container_memory_working_set_bytes{container="redis",namespace="awx",pod="awx-web-5d5d7ccf85-7jjgm"} 1.1104256e+07 1704815765480
# HELP container_start_time_seconds [ALPHA] Start time of the container since unix epoch in seconds
# TYPE container_start_time_seconds gauge
container_start_time_seconds{container="awx-manager",namespace="awx",pod="awx-operator-controller-manager-7577b7567d-pjzp5"} 1.704801651080639e+09 1704801651080
container_start_time_seconds{container="awx-rsyslog",namespace="awx",pod="awx-web-5d5d7ccf85-7jjgm"} 1.7048017268389955e+09 1704801726838
container_start_time_seconds{container="awx-web",namespace="awx",pod="awx-web-5d5d7ccf85-7jjgm"} 1.704801726697293e+09 1704801726697
container_start_time_seconds{container="kindnet-cni",namespace="kube-system",pod="kindnet-j6kct"} 1.704770136932521e+09 1704770136932
container_start_time_seconds{container="kube-proxy",namespace="kube-system",pod="kube-proxy-54z4w"} 1.7047701366248121e+09 1704770136624
container_start_time_seconds{container="kube-rbac-proxy",namespace="awx",pod="awx-operator-controller-manager-7577b7567d-pjzp5"} 1.7048016509739342e+09 1704801650973
container_start_time_seconds{container="manager",namespace="flux-system",pod="helm-controller-865448769d-vq8q6"} 1.7047992586468384e+09 1704799258646
container_start_time_seconds{container="manager",namespace="flux-system",pod="source-controller-fc5555fb-j548x"} 1.7047992587381313e+09 1704799258738
container_start_time_seconds{container="metrics-server",namespace="kube-system",pod="metrics-server-75f45b4dd4-67fhz"} 1.7048000201414006e+09 1704800020141
container_start_time_seconds{container="nginx",namespace="default",pod="nginx-57d84f57dc-4497c"} 1.7048029014110909e+09 1704802901411
container_start_time_seconds{container="postgres",namespace="awx",pod="awx-postgres-13-0"} 1.7048016726135042e+09 1704801672613
container_start_time_seconds{container="redis",namespace="awx",pod="awx-web-5d5d7ccf85-7jjgm"} 1.7048017264993064e+09 1704801726499
# HELP node_cpu_usage_seconds_total [ALPHA] Cumulative cpu time consumed by the node in core-seconds
# TYPE node_cpu_usage_seconds_total counter
node_cpu_usage_seconds_total 5716.152579 1704815761870
# HELP node_memory_working_set_bytes [ALPHA] Current working set of the node in bytes
# TYPE node_memory_working_set_bytes gauge
node_memory_working_set_bytes 2.642427904e+09 1704815761870
# HELP pod_cpu_usage_seconds_total [ALPHA] Cumulative cpu time consumed by the pod in core-seconds
# TYPE pod_cpu_usage_seconds_total counter
pod_cpu_usage_seconds_total{namespace="awx",pod="awx-operator-controller-manager-7577b7567d-pjzp5"} 178.369587 1704815761838
pod_cpu_usage_seconds_total{namespace="awx",pod="awx-postgres-13-0"} 41.45968 1704815754559
pod_cpu_usage_seconds_total{namespace="awx",pod="awx-web-5d5d7ccf85-7jjgm"} 144.355584 1704815767669
pod_cpu_usage_seconds_total{namespace="default",pod="nginx-57d84f57dc-4497c"} 0.119925 1704815760678
pod_cpu_usage_seconds_total{namespace="flux-system",pod="helm-controller-865448769d-vq8q6"} 24.275009 1704815753716
pod_cpu_usage_seconds_total{namespace="flux-system",pod="source-controller-fc5555fb-j548x"} 42.901885 1704815767346
pod_cpu_usage_seconds_total{namespace="kube-system",pod="kindnet-j6kct"} 29.72152 1704815753410
pod_cpu_usage_seconds_total{namespace="kube-system",pod="kube-proxy-54z4w"} 20.674736 1704815762614
pod_cpu_usage_seconds_total{namespace="kube-system",pod="metrics-server-75f45b4dd4-67fhz"} 74.329734 1704815757020
# HELP pod_memory_working_set_bytes [ALPHA] Current working set of the pod in bytes
# TYPE pod_memory_working_set_bytes gauge
pod_memory_working_set_bytes{namespace="awx",pod="awx-operator-controller-manager-7577b7567d-pjzp5"} 5.175296e+07 1704815761838
pod_memory_working_set_bytes{namespace="awx",pod="awx-postgres-13-0"} 6.7960832e+07 1704815754559
pod_memory_working_set_bytes{namespace="awx",pod="awx-web-5d5d7ccf85-7jjgm"} 1.13872896e+09 1704815767669
pod_memory_working_set_bytes{namespace="default",pod="nginx-57d84f57dc-4497c"} 7.950336e+06 1704815760678
pod_memory_working_set_bytes{namespace="flux-system",pod="helm-controller-865448769d-vq8q6"} 2.691072e+07 1704815753716
pod_memory_working_set_bytes{namespace="flux-system",pod="source-controller-fc5555fb-j548x"} 3.9723008e+07 1704815767346
pod_memory_working_set_bytes{namespace="kube-system",pod="kindnet-j6kct"} 2.2859776e+07 1704815753410
pod_memory_working_set_bytes{namespace="kube-system",pod="kube-proxy-54z4w"} 3.3345536e+07 1704815762614
pod_memory_working_set_bytes{namespace="kube-system",pod="metrics-server-75f45b4dd4-67fhz"} 3.3923072e+07 1704815757020
# HELP scrape_error [ALPHA] 1 if there was an error while getting container metrics, 0 otherwise
# TYPE scrape_error gauge
scrape_error 0
```

### 参考

- https://github.com/songleo/private-cloud
- https://github.com/kubernetes-sigs/metrics-server
