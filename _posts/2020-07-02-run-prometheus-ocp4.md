---
layout: post
title: 在ocp4上运行prometheus
date: 2020-07-02 12:12:05
---

## prometheus部署yaml

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus-server
  template:
    metadata:
      labels:
        app: prometheus-server
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus
          args:
            - "--config.file=/etc/prometheus/prometheus.yml"
            - "--storage.tsdb.path=/prometheus/"
          ports:
            - containerPort: 9090
          volumeMounts:
            - name: prometheus-config-volume
              mountPath: /etc/prometheus/
            - name: prometheus-storage-volume
              mountPath: /prometheus/
      volumes:
        - name: prometheus-config-volume
          configMap:
            defaultMode: 420
            name: prometheus-server-conf

        - name: prometheus-storage-volume
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus-service
  annotations:
      prometheus.io/scrape: 'true'
      prometheus.io/port:   '9090'
spec:
  selector:
    app: prometheus-server
  ports:
  - name: default
    protocol: TCP
    port: 80
    targetPort: 9090

---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  labels:
    app: prometheus-server
  name: prometheus-server-route
spec:
  host: prometheus-service-ssli.apps.soli-acm-hub.dev05.red-chesterfield.com
  port:
    targetPort: default
  to:
    kind: Service
    name: prometheus-service
    weight: 100
  wildcardPolicy: None
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-server-conf
  labels:
    name: prometheus-server-conf
data:
  prometheus.yml: |-
    global:
      scrape_interval:     60s
      evaluation_interval: 15s

    scrape_configs:
      - job_name: 'ssli-prometheus'
        scrape_interval: 3s
        static_configs:
        - targets: ['localhost:9090']

```

- deployment

  创建相应的prometheus，并挂载了相应的存储路径和配置文件。

- service

  创建svc以便访问prometheus服务。

- route

  讲prometheus暴露，方便集群外访问，这里可以使用prometheus-service-ssli.apps.soli-acm-hub.dev05.red-chesterfield.com访问到prometheus ui。

- configMap

  prometheus相关配置文件。

## 部署prometheus

```
$ k apply -f prometheus.yaml
deployment.apps/prometheus-deployment created
service/prometheus-service created
route.route.openshift.io/prometheus-server-route created
configmap/prometheus-server-conf created
$ k get all
NAME                                         READY   STATUS    RESTARTS   AGE
pod/prometheus-deployment-77cb49fb5d-vv7s8   1/1     Running   0          88s

NAME                         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
service/prometheus-service   ClusterIP   172.30.170.118   <none>        80/TCP    88s

NAME                                    READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/prometheus-deployment   1/1     1            1           88s

NAME                                               DESIRED   CURRENT   READY   AGE
replicaset.apps/prometheus-deployment-77cb49fb5d   1         1         1       88s

NAME                                               HOST/PORT                                                              PATH   SERVICES             PORT      TERMINATION   WILDCARD
route.route.openshift.io/prometheus-server-route   prometheus-service-ssli.apps.soli-acm-hub.dev05.red-chesterfield.com          prometheus-service   default                 None
$ curl prometheus-service-ssli.apps.soli-acm-hub.dev05.red-chesterfield.com
<a href="/graph">Found</a>.

```

也可以通过浏览器访问prometheus ui： http://prometheus-service-ssli.apps.soli-acm-hub.dev05.red-chesterfield.com/graph

## ref

- https://linuxacademy.com/blog/kubernetes/running-prometheus-on-kubernetes/