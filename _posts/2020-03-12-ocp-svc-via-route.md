---
layout: post
title: route方式访问ocp应用
date: 2020-03-12 12:12:05
---

### 创建project

```
$ oc new-project route-demo
Now using project "route-demo" on server "https://api.ssli-ocp1.os.fyre.ibm.com:6443".

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
hello-openshift-1-deploy   0/1     Completed   0          20s
hello-openshift-1-fb8wc    1/1     Running     0          12s
$ oc get svc
NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)             AGE
hello-openshift   ClusterIP   172.30.92.136   <none>        8080/TCP,8888/TCP   27s
```

### 创建route暴露应用

```
$ oc expose svc/hello-openshift
route.route.openshift.io/hello-openshift exposed
$ oc get svc
NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)             AGE
hello-openshift   ClusterIP   172.30.92.136   <none>        8080/TCP,8888/TCP   81s
$ oc get route
NAME              HOST/PORT                                                   PATH   SERVICES          PORT       TERMINATION   WILDCARD
hello-openshift   hello-openshift-route-demo.apps.ssli-ocp1.os.fyre.ibm.com          hello-openshift   8080-tcp                 None
```

这里需要注意，如果你是通过手动方式创建route，那么需要在你的/etc/hosts文件中添加相应的ip和host映射，例如：

```
192.168.0.125  www.your-host.com
```

然后就可以通过以下方式访问应用：

```
$ curl www.your-host.com
Hello OpenShift!
```

### 通过route访问应用


```
$ curl hello-openshift-route-demo.apps.ssli-ocp1.os.fyre.ibm.com
Hello OpenShift!
```

### 卸载应用

```
$ oc delete all -l app=hello-openshift
```
