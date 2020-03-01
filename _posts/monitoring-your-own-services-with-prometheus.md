### 启用监控用户应用的功能

在[cluster-monitoring-config](https://docs.openshift.com/container-platform/4.3/monitoring/cluster_monitoring/configuring-the-monitoring-stack.html#configuring-the-monitoring-stack)中添加以下字段：

```
data:
  config.yaml: |
    techPreviewUserWorkload:
      enabled: true
```

编辑cluster-monitoring-config，然后查询：

```
oc -n openshift-monitoring edit configmap cluster-monitoring-config
oc get configmap  cluster-monitoring-config -oyaml
apiVersion: v1
data:
  config.yaml: |
    techPreviewUserWorkload:
      enabled: true
kind: ConfigMap
metadata:
  creationTimestamp: "2020-02-28T09:19:16Z"
  name: cluster-monitoring-config
  namespace: openshift-monitoring
  resourceVersion: "2548521"
  selfLink: /api/v1/namespaces/openshift-monitoring/configmaps/cluster-monitoring-config
  uid: fb71b542-80a3-4d73-ad06-0092d56e7ddf
```

修改完毕后，查询相关prometheus-user-workload pod已经启动：

```
[root@ssli-ocp1-inf ~]# oc -n openshift-user-workload-monitoring get pod
NAME                                  READY   STATUS    RESTARTS   AGE
prometheus-operator-5598448b4-t8fcb   1/1     Running   0          55s
prometheus-user-workload-0            5/5     Running   1          43s
prometheus-user-workload-1            5/5     Running   1          43s
```

### 部署用户应用

应用yaml文件prometheus-example-app.yaml如下：

```
apiVersion: v1
kind: Namespace
metadata:
  name: ns1
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: prometheus-example-app
  name: prometheus-example-app
  namespace: ns1
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus-example-app
  template:
    metadata:
      labels:
        app: prometheus-example-app
    spec:
      containers:
      - image: quay.io/brancz/prometheus-example-app:v0.2.0
        imagePullPolicy: IfNotPresent
        name: prometheus-example-app
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app: prometheus-example-app
  name: prometheus-example-app
  namespace: ns1
spec:
  ports:
  - port: 8080
    protocol: TCP
    targetPort: 8080
    name: web
  selector:
    app: prometheus-example-app
  type: ClusterIP
```

部署应用并查询prometheus-example-app pod：

```
oc create ns ns1
oc apply -f prometheus-example-app.yaml
oc -n ns1 get pod
```

ref:

https://docs.openshift.com/container-platform/4.3/monitoring/monitoring-your-own-services.html
