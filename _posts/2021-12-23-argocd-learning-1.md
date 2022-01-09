---
layout: post
title: argocd学习（一）
date: 2021-12-23 00:12:05
---

## 安装argocd

```
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

## expose svc

```
oc -n argocd patch deployment argocd-server -p '{"spec":{"template":{"spec":{"$setElementOrder/containers":[{"name":"argocd-server"}],"containers":[{"command":["argocd-server","--insecure","--staticassets","/shared/app"],"name":"argocd-server"}]}}}}'
oc -n argocd create route edge argocd-server --service=argocd-server --port=http --insecure-policy=Redirect
k get route
NAME            HOST/PORT                                                                PATH   SERVICES        PORT   TERMINATION     WILDCARD
argocd-server   argocd-server-argocd.apps.demo.com          argocd-server   http   edge/Redirect   None
```

或者直接通过ocp的operatorhub安装，ocp的gitops实际是通过argocd实现，在operatorhub查找openshift gitops后，按照默认配置安装到ocp：

![](/images/install-ocp-gitops.png)

安装成功后如下：

![](/images/installed-ocp-gitops.png)

直接从ocp的ui中就可以登录到argocd。

## 安装argocd cli

```
curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x /usr/local/bin/argocd
```
## 登录argocd

通过以下命令获取admin用户的登录密码：

```
k get secret -n argocd argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

进入 https://argocd-server-argocd.apps.demo.com 登录。或者通过argocd cli登录：

```
argocd login argocd-server-argocd.apps.demo.com
```

## 创建应用

```
$ cat hostname.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: hostname
  namespace: argocd
spec:
  destination:
    namespace: default
    server: https://kubernetes.default.svc
  project: default
  source:
    path: hostname
    repoURL: https://github.com/songleo/argocd-demo.git
    targetRevision: HEAD
  syncPolicy:
    automated: {}
$ k apply -f hostname.yaml
$ k get route
NAME       HOST/PORT                                                            PATH   SERVICES   PORT   TERMINATION   WILDCARD
hostname   hostname-default.apps.demo.com          hostname   8080                 None
$ curl hostname-default.apps.demo.com
hostname: hostname-54fcb96656-k2lxx
app version: v1.0
```

ui展示应用如下：

![](/images/argocd-hostname.png)

## 使用applicationset在多集群创建应用

- 添加集群

```
$ kubectl config get-contexts -o name
$ argocd cluster add admin --name soli-mc
$ argocd cluster list
SERVER                                                         NAME        VERSION  STATUS  MESSAGE  PROJECT
https://api.demo.com:6443                                      soli-mc
https://kubernetes.default.svc                                 in-cluster
```

- 创建applicationset

```
$ cat appset.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: hostname
spec:
  generators:
  - list:
      elements:
      - cluster: in-cluster
        url: https://kubernetes.default.svc
      - cluster: soli-mc
        url: https://api.demo.com:6443
  template:
    metadata:
      name: '{{cluster}}-hostname'
    spec:
      project: "default"
      source:
        repoURL: https://github.com/songleo/argocd-demo.git
        targetRevision: HEAD
        path: hostname-no-route
      destination:
        server: '{{url}}'
        namespace: hostname
$ k apply -f appset.yaml
```

ui展示多集群应用如下：

![](/images/argocd-appset.png)

## ref

- https://argo-cd.readthedocs.io/en/stable/getting_started/
- https://argocd-applicationset.readthedocs.io/en/stable/Getting-Started/
