---
layout: post
title: argocd配置插件
date: 2022-01-12 00:12:05
---

argocd提供了插件功能，方便集成更多个配置管理工具，这里演示如何配置一个插件：

### 配置插件

修改argocd的配置，在configmap中添加以下字段：

```
data:
  configManagementPlugins: |
    - name: updateReplicas
      init:
        command: [sh, -c, 'sed -i "s/replicas: 2/replicas: 1/" hostname.yaml']
      generate:
        command: [sh, -c, 'cat hostname.yaml']
      lockRepo: true
```

需要注意的是，generate命令必须将有效的yaml流打印到标准输出。init和generate命令都在应用程序源目录中执行。该插件的主要功能是，在部署应用前，将replicas从2修改到1，实现参数的定制化。

### 为app启用插件

```
$ cat plugin-demo.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: hostname
  namespace: argocd
spec:
  destination:
    namespace: default
    server: 'https://kubernetes.default.svc'
  source:
    path: hostname
    repoURL: 'https://github.com/songleo/argocd-demo.git'
    targetRevision: HEAD
    plugin:
      name: updateReplicas
  project: default
  syncPolicy:
    automated: {}

$ k apply -f plugin-demo.yaml
application.argoproj.io/hostname created
$ k get po -n default
NAME                        READY   STATUS    RESTARTS   AGE
hostname-54fcb96656-f5rk4   1/1     Running   0          10s
```

可以看到，deployment启动后只有一个pod，实现在部署app前修改参数的目的。

还可以通过添加sidecar方式配置插件，build自己的image和argo server一起运行，实现更复杂的配置管理功能。

### 参考文档

- https://argo-cd.readthedocs.io/en/stable/user-guide/config-management-plugins/
