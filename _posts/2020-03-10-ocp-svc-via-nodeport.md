---
layout: post
title: nodeport方式访问ocp应用
date: 2020-03-10 12:12:05
---


### 创建project

```
$ oc new-project nodeport-demo
Now using project "nodeport-demo" on server "https://api.ssli-ocp1.os.fyre.ibm.com:6443".

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
NAME                       READY   STATUS              RESTARTS   AGE
hello-openshift-1-deploy   0/1     ContainerCreating   0          8s
$ oc get svc
NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)             AGE
hello-openshift   ClusterIP   172.30.168.25   <none>        8080/TCP,8888/TCP   14s
```

### 修改service type为NodePort

```
$ oc edit svc hello-openshift
$ oc get svc hello-openshift
NAME              TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)                         AGE
hello-openshift   NodePort   172.30.168.25   <none>        8080:32624/TCP,8888:31823/TCP   71s
```

### 通过node-ip:node-port访问应用

```
$ oc describe no worker0.ssli-ocp1.os.fyre.ibm.com | grep InternalIP
  InternalIP:  10.16.60.170
$ curl 10.16.60.170:32624
Hello OpenShift!
$ curl 10.16.60.170:31823
Hello OpenShift!
```

### 卸载应用

```
$ oc delete all -l app=hello-openshift
```

