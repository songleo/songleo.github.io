---
layout: post
title: ocp4安装argocd
date: 2021-12-23 00:12:05
---

## 安装argocd

```
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

## 安装argocd cli

```
curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x /usr/local/bin/argocd
```

## expose svc

```
oc -n argocd patch deployment argocd-server -p '{"spec":{"template":{"spec":{"$setElementOrder/containers":[{"name":"argocd-server"}],"containers":[{"command":["argocd-server","--insecure","--staticassets","/shared/app"],"name":"argocd-server"}]}}}}'
oc -n argocd create route edge argocd-server --service=argocd-server --port=http --insecure-policy=Redirect
k get route
NAME            HOST/PORT                                                                PATH   SERVICES        PORT   TERMINATION     WILDCARD
argocd-server   argocd-server-argocd.apps.demo-aws-495-hdgv2.demo.red-chesterfield.com          argocd-server   http   edge/Redirect   None
```

## 登录argocd

通过一下命令获取登录密码：

```
k get secret argocd-initial-admin-secret -o jsonpath="{.data.password}"| base64 -d
```

进入 https://argocd-server-argocd.apps.demo-aws-495-hdgv2.demo.red-chesterfield.com 登录。或者通过argocd cli登录：

```
argocd login argocd-server-argocd.apps.demo-aws-495-hdgv2.demo.red-chesterfield.com
```

## 创建应用

```
argocd app create guestbook --repo https://github.com/argoproj/argocd-example-apps.git --path guestbook --dest-server https://kubernetes.default.svc --dest-namespace default
argocd app get guestbook
argocd app sync guestbook
oc expose svc guestbook-ui
```

## ref

- https://argo-cd.readthedocs.io/en/stable/getting_started/