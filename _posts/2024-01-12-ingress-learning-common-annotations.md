---
layout: post
title: ingress学习之常用annotations
date: 2024-01-12 00:12:05
---

### nginx.ingress.kubernetes.io/backend-protocol: "https"

指定与后端服务的通信协议。如果后端服务配置为只接受https连接，不使用此注解会导致连接失败，因为ingress默认使用http。

### nginx.ingress.kubernetes.io/force-ssl-redirect: "true"

强制http请求重定向到https。如果不使用此注解，通过http发起的请求不会自动重定向到https，可能导致安全风险。

### nginx.ingress.kubernetes.io/ssl-passthrough: "true"

允许ssl流量直接传递到后端服务。如果后端服务需要直接处理tls加密（如进行ssl证书验证），不使用此注解会导致tls加密在ingress层被解密。

### nginx.ingress.kubernetes.io/rewrite-target: /

将请求url重写为指定路径。如果ingress路径为"/oldpath"，而服务期望在根路径"/"接收请求，不使用此注解将导致服务接收到错误的路径请求

### nginx.ingress.kubernetes.io/rewrite-target: /$1

使用捕获的url路径部分重写目标路径。对于路径"/oldpath/(.*)"，若需将捕获的部分重写到"/$1"，不使用此注解将无法实现路径的正确重写。

### nginx.ingress.kubernetes.io/use-regex: "true"

在路径匹配中启用正则表达式。如果需要复杂的路径匹配，如"/user/(.+)"来匹配所有用户相关的路径，不启用此注解将无法实现这种匹配。

## nginx.ingress.kubernetes.io/app-root: "test"

这意味着当用户访问Ingress所代理的根路径（即"/"）时，Ingress会自动将请求重定向到"/test"路径。例如，如果用户尝试访问你的网站根路径（如 http://yourwebsite.com/ ），他们会被自动重定向到 http://yourwebsite.com/test 。这样可以确保用户总是访问到正确的入口页面，即使他们直接访问根路径。这个注解特别适用于应用程序的主页不在根路径或者需要特定入口的场景。

### ref

- https://github.com/kubernetes/ingress-nginx/blob/main/docs/user-guide/nginx-configuration/annotations.md
