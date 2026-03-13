---
layout: post
title: clowder tips
date: 2026-03-13 00:12:05
---

假设要部署一个hello-api app,目录结构如下：

```
services/
  hello-api/
      app.yml
      deploy-clowder.yml
      clowderapp.yaml

```

## app.yml

定义应用是什么。用于定义应用的metadata，它类似一个应用注册表，在平台中注册一个应用。平台通过这个文件知道：

- 应用名称
- 应用属于哪个service
- 属于哪个platform
- 相关metadata

不会部署任何资源，由schema: /app-sre/app-1.yml校验。

```
$schema: /app-sre/app-1.yml

name: hello-api
description: demo hello api

labels:
  service: hello-api
  platform: demo
```

## deploy-clowder.yml

是saas deployment definition，定义 deployment configuration，包括使用哪个template、参数来源以及cicd pipeline如何处理该应用。resourceTemplates指定cicd pipeline需要处理的资源模板，通常会关联到clowderapp.yaml这样的openshift template。

```
$schema: /app-sre/saas-file-2.yml

name: hello-api-clowder

app:
  $ref: /services/hello-api/app.yml

resourceTemplates:
- name: hello-template
```

## clowderapp.yaml

定义应用如何运行，创建ClowdApp，通过ClowdApp描述应用需要什么资源，比如s3，db等。实际是通过openshift template来创建ClowdApp。

```
apiVersion: template.openshift.io/v1
kind: Template

parameters:
- name: IMAGE

objects:

- apiVersion: cloud.redhat.com/v1alpha1
  kind: ClowdApp
  metadata:
    name: hello-api

  spec:
    envName: stage

    deployments:
    - name: web
      webServices:
        public:
          enabled: true

      podSpec:
        image: ${IMAGE}
```

最终会在ocp集群中创建相应的应用，生成以下资源：

- clowdapp
- deployment
- service
- route

clowder的核心思想是：应用声明依赖（database、s3、kafka等），平台通过clowder operator自动创建并注入这些资源。
