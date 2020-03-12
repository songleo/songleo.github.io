---
layout: post
title: ingress方式访问ocp应用
date: 2020-03-13 12:12:05
---

### 创建project

```
$ oc new-project ing-demo
Already on project "ing-demo" on server "https://api.ssli-ocp1.os.fyre.ibm.com:6443".

You can add applications to this project with the 'new-app' command. For example, try:

    oc new-app django-psql-example

to build a new example application in Python. Or use kubectl to deploy a simple Kubernetes application:

    kubectl create deployment hello-node --image=gcr.io/hello-minikube-zero-install/hello-node

```

### 部署应用


```
$ oc new-app openshift/hello-openshift
--> Found container image 7af3297 (23 months old) from Docker Hub for "openshift/hello-openshift"

    * An image stream tag will be created as "hello-openshift:latest" that will track this image
    * This image will be deployed in deployment config "hello-openshift"
    * Ports 8080/tcp, 8888/tcp will be load balanced by service "hello-openshift"
      * Other containers can access this service through the hostname "hello-openshift"

--> Creating resources ...
    imagestream.image.openshift.io "hello-openshift" created
    deploymentconfig.apps.openshift.io "hello-openshift" created
    service "hello-openshift" created
--> Success
    Application is not exposed. You can expose services to the outside world by executing one or more of the commands below:
     'oc expose svc/hello-openshift'
    Run 'oc status' to view your app.
$ oc get po
NAME                       READY   STATUS      RESTARTS   AGE
hello-openshift-1-deploy   0/1     Completed   0          23s
hello-openshift-1-h9nfx    1/1     Running     0          15s
$ oc get svc
NAME              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)             AGE
hello-openshift   ClusterIP   172.30.230.220   <none>        8080/TCP,8888/TCP   31s
```

### 创建ingress暴露应用


```
$ cat ingress.yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: hello-openshift
spec:
  rules:
  - host: www.ssli-test.com
    http:
      paths:
      - backend:
          serviceName: hello-openshift
          servicePort: 8080
        path: /
$ oc apply -f ingress.yaml
ingress.extensions/hello-openshift created
$ oc describe ing hello-openshift
Name:             hello-openshift
Namespace:        ing-demo
Address:
Default backend:  default-http-backend:80 (<none>)
Rules:
  Host               Path  Backends
  ----               ----  --------
  www.ssli-test.com
                     /   hello-openshift:8080 (10.254.4.48:8080)
Annotations:
  kubectl.kubernetes.io/last-applied-configuration:  {"apiVersion":"extensions/v1beta1","kind":"Ingress","metadata":{"annotations":{},"name":"hello-openshift","namespace":"ing-demo"},"spec":{"rules":[{"host":"www.ssli-test.com","http":{"paths":[{"backend":{"serviceName":"hello-openshift","servicePort":8080},"path":"/"}]}}]}}

Events:  <none>
```

这里需要注意，需要在你的/etc/hosts文件中添加相应的ip和host映射，例如：

```
192.168.0.125  www.ssli-test.com
```

如果你查看route，会发现ocp会针对该ingress创建相应的route，如果你删除这个route，ocp会自动重新创建，其实最后还是靠route将服务暴露：

```
$ oc get route
NAME                    HOST/PORT           PATH   SERVICES          PORT   TERMINATION   WILDCARD
hello-openshift-bz6sg   www.ssli-test.com   /      hello-openshift   8080                 None
$ oc describe route hello-openshift-bz6sg
Name:           hello-openshift-bz6sg
Namespace:      ing-demo
Created:        About a minute ago
Labels:         <none>
Annotations:        kubectl.kubernetes.io/last-applied-configuration={"apiVersion":"extensions/v1beta1","kind":"Ingress","metadata":{"annotations":{},"name":"hello-openshift","namespace":"ing-demo"},"spec":{"rules":[{"host":"www.ssli-test.com","http":{"paths":[{"backend":{"serviceName":"hello-openshift","servicePort":8080},"path":"/"}]}}]}}

Requested Host:     www.ssli-test.com
              exposed on router default (host apps.ssli-ocp1.os.fyre.ibm.com) about a minute ago
Path:           /
TLS Termination:    <none>
Insecure Policy:    <none>
Endpoint Port:      8080

Service:    hello-openshift
Weight:     100 (100%)
Endpoints:  10.254.4.48:8888, 10.254.4.48:8080
```

### 通过ingress访问应用

```
$ curl www.ssli-test.com
Hello OpenShift!
```

### 卸载应用

```
$ oc delete all -l app=hello-openshift
```
