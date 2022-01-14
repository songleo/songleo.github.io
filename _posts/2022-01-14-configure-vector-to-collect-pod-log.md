---
layout: post
title: 在kubernetes中配置vector收集pod日志
date: 2022-01-14 00:12:05
---


### 安装vector

使用helm方式安装vector，这里只安装Agent，Agent主要负责收集kubernetes集群节点上的所有日志。

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

查看vector pod正常运行：

```
$ kubectl -n vector get po
NAME           READY   STATUS    RESTARTS   AGE
vector-qdxzs   1/1     Running   0          20s
vector-zhpmt   1/1     Running   0          20s
vector-zjrql   1/1     Running   0          20s
```

查看vector配置文件：

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
      host_metrics:
        filesystem:
          devices:
            excludes: [binfmt_misc]
          filesystems:
            excludes: [binfmt_misc]
          mountPoints:
            excludes: ["*/proc/sys/fs/binfmt_misc"]
        type: host_metrics
      internal_metrics:
        type: internal_metrics
    sinks:
      prom_exporter:
        type: prometheus_exporter
        inputs: [host_metrics, internal_metrics]
        address: 0.0.0.0:9090
      stdout:
        type: console
        inputs: [kubernetes_logs]
        encoding:
          codec: json
...
```
### 修改vector配置文件收集指定pod日志

删除其他配置，最终配置如下：

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
        extra_label_selector: "component=metrics-collector"
    sinks:
      stdout:
        type: console
        inputs: [kubernetes_logs]
        encoding:
          codec: json
```

这里只收集label为component=metrics-collector的pod日志。

### 验证日志收集

找到pod运行节点，这里看到运行节点是aks-agentpool-35516588-vmss000001：

```
$ k get po -l component=metrics-collector -o wide
NAME                                            READY   STATUS    RESTARTS   AGE   IP            NODE                                NOMINATED NODE   READINESS GATES
metrics-collector-deployment-5487dd7f6d-r9dt2   1/1     Running   0          72m   10.244.2.24   aks-agentpool-35516588-vmss000001   <none>           <none>
$ k logs metrics-collector-deployment-5487dd7f6d-r9dt2 | grep 'Metrics pushed successfully'
level=info caller=logger.go:45 ts=2022-01-14T08:32:16.784534925Z component=forwarder component=metricsclient msg="Metrics pushed successfully"
```

然后查看运行在该节点的vector的pod日志：

```
$ k get po -o wide
NAME           READY   STATUS    RESTARTS   AGE     IP            NODE                                NOMINATED NODE   READINESS GATES
vector-4nqd5   1/1     Running   0          7m23s   10.244.1.16   aks-agentpool-35516588-vmss000000   <none>           <none>
vector-6shzj   1/1     Running   0          7m20s   10.244.2.25   aks-agentpool-35516588-vmss000001   <none>           <none>
vector-slmdp   1/1     Running   0          7m26s   10.244.0.15   aks-agentpool-35516588-vmss000002   <none>           <none>
$ k logs vector-6shzj | grep 'Metrics pushed successfully'
{"file":"/var/log/pods/open-cluster-management-addon-observability_metrics-collector-deployment-5487dd7f6d-r9dt2_1baddb2f-7ae6-4ded-ba05-7c02a7385b91/metrics-collector/0.log","kubernetes":{"container_id":"containerd://d82f8325c383a133d61988b0397700486649c786e3bb50c4089964299c1c7ff5","container_image":"quay.io/open-cluster-management/metrics-collector@sha256:24fda89c8661fb21fcf6850bafee6f43f329251b24dfbf36f6fd7e6e619ab3d0","container_name":"metrics-collector","namespace_labels":{"kubernetes.io/metadata.name":"open-cluster-management-addon-observability"},"pod_annotations":{"cni.projectcalico.org/containerID":"53b22ec50ab336b6a24d5ae0622bc66e47197525cd236a4234de83f566f90212","cni.projectcalico.org/podIP":"10.244.2.24/32","cni.projectcalico.org/podIPs":"10.244.2.24/32"},"pod_ip":"10.244.2.24","pod_ips":["10.244.2.24"],"pod_labels":{"component":"metrics-collector","pod-template-hash":"5487dd7f6d"},"pod_name":"metrics-collector-deployment-5487dd7f6d-r9dt2","pod_namespace":"open-cluster-management-addon-observability","pod_node_name":"aks-agentpool-35516588-vmss000001","pod_owner":"ReplicaSet/metrics-collector-deployment-5487dd7f6d","pod_uid":"1baddb2f-7ae6-4ded-ba05-7c02a7385b91"},"message":"level=info caller=logger.go:45 ts=2022-01-14T08:32:16.784534925Z component=forwarder component=metricsclient msg=\"Metrics pushed successfully\"","source_type":"kubernetes_logs","stream":"stderr","timestamp":"2022-01-14T08:32:16.784656526Z"}
```

可以看到，vector收集到指定pod的日志。

### 参考文档

- https://vector.dev/docs/setup/installation/platforms/kubernetes/
- https://vector.dev/docs/reference/configuration/sources/kubernetes_logs/
