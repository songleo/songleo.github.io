---
layout: post
title: kustomize学习
date: 2021-12-24 00:12:05
---

通过kustomize使用kustomization文件定制kubernetes对象

- 支持生成cm和secret，可以通过env文件、properties文件和literals
- 支持直接在其他对象中引用cm和secret
- 支持对生成对象定制，比如ns、名字的后缀、前缀、标签及注解等
- 支持组合不同的资源，比如deploy和svc一起
- 支持patch，通过patchesStrategicMerge和patchesJson6902实现
- 支持vars注入名称到对象中
- 支持bases和overlays，类似docker中img的原理，bases大家都可以使用，通过overlays定制不同环境的对象
- 目前主要支持以下参数
    - namespace
    - namePrefix
    - nameSuffix
    - commonLabels
    - commonAnnotations
    - resources
    - configMapGenerator
    - secretGenerator
    - generatorOptions
    - bases
    - patchesStrategicMerge
    - patchesJson6902
    - vars
    - images
    - configurations
    - crds

## faq

- `kubectl kustomize ./`会遇到错误，可以使用`kustomize build .`解决

    ```
    Error: json: unknown field "envs"
    ```

## ref

- https://kubernetes.io/zh/docs/tasks/manage-kubernetes-objects/kustomization/
