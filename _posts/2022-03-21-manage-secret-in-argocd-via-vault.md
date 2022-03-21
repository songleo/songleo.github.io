---
layout: post
title: 在argocd中使用vault管理secret
date: 2022-03-21 00:12:05
---

secret如下：

```
$ cat vault-secret.yaml
kind: Secret
apiVersion: v1
metadata:
  name: example-secret
  annotations:
    avp.kubernetes.io/path: "/cred/data/user"
type: Opaque
stringData:
  username: <username>
  password: <passwd>
```

可以看到，这里的username和password字段都是占位符，不是一个有效的value。借助vault，可以将该secret部署到集群时自动替换相应的secret信息，达到如下效果：

```
$ k get secret example-secret -o yaml
apiVersion: v1
data:
  password: YWRtaW4=
  username: dXNlcjE=
kind: Secret
metadata:
  annotations:
    avp.kubernetes.io/path: /cred/data/user
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"Secret","metadata":{"annotations":{"avp.kubernetes.io/path":"/cred/data/user"},"labels":{"app.kubernetes.io/instance":"vault-demo"},"name":"example-secret","namespace":"argocd"},"stringData":{"password":"admin","username":"user1"},"type":"Opaque"}
  creationTimestamp: "2022-03-21T01:42:12Z"
  labels:
    app.kubernetes.io/instance: vault-demo
  name: example-secret
  namespace: argocd
  resourceVersion: "169480071"
  uid: 80a81c73-e08c-4dbd-93de-359ee0376baf
type: Opaque
```

这样可以将机密信息保存在vault，而不是repo中，确保机密信息的安全。要实现以上功能，需要在argocd中安装相应的vault插件，具体步骤如下：

## 安装vault插件

参考该文档安装vault插件到argocd：https://argocd-vault-plugin.readthedocs.io/en/stable/installation/ 其原理是部署一个initContainer将vault插件argocd-vault-plugin二进制下载到argocd-repo-server容器中，然后修改argocd的配置文件启用vault插件：

```
apiVersion: v1
kind: ConfigMap
metadata:
  labels:
    app.kubernetes.io/name: argocd-cm
    app.kubernetes.io/part-of: argocd
  name: argocd-cm
data:
  configManagementPlugins: |-
    - name: argocd-vault-plugin
      generate:
        command: ["argocd-vault-plugin"]
        args: ["generate", "./"]
```

这里需要特别将vault的连接信息已环境变量的方式传递给argocd，vault插件提供了3中方式连接vault，这里以token方式连接vault获取secret信息：

```
$ cat vault-secret.yaml
apiVersion: v1
stringData:
  VAULT_ADDR: http://vault.vault.svc:8200
  AVP_AUTH_TYPE: token
  VAULT_TOKEN: s.6gGJ7BvKUP34nhGXxBphp2Ue
  AVP_TYPE: vault
kind: Secret
metadata:
  name: argocd-vault-plugin-credentials
  namespace: argocd
type: Opaque
```

确保将该连接信息已环境变量形式传递给argocd-repo-server容器，配置如下：

```
        envFrom:
          - secretRef:
              name: argocd-vault-plugin-credentials
```

## 在vault中创建secret信息

在vault中创建secret信息，避免将机密信息存储在repo：

```
$ k exec -n vault -it vault-0 -- /bin/sh
/ $ vault kv put cred/user username=user1 passwd=admin
Key                Value
---                -----
created_time       2022-03-21T02:07:28.103063682Z
custom_metadata    <nil>
deletion_time      n/a
destroyed          false
version            1
/ $ vault kv get cred/user
======= Metadata =======
Key                Value
---                -----
created_time       2022-03-21T02:07:28.103063682Z
custom_metadata    <nil>
deletion_time      n/a
destroyed          false
version            1

====== Data ======
Key         Value
---         -----
passwd      admin
username    user1
```

## 以gitop方式部署secret

部署secret到argo，并启用vault插件：

```
$ cat vault-demo.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: vault-demo
  namespace: argocd
spec:
  destination:
    namespace: argocd
    server: https://kubernetes.default.svc
  project: default
  source:
    path: vault
    repoURL: https://github.com/songleo/argocd-demo.git
    targetRevision: HEAD
    plugin:
      name: argocd-vault-plugin
  syncPolicy:
    automated: {}
[soli.hosts.dev.upshift.rdu2.redhat.com] [10:10:45 AM]
$ k apply -f vault-demo.yaml
application.argoproj.io/vault-demo created
```

## 验证secret

```
$ k get secret example-secret -o yaml
apiVersion: v1
data:
  password: YWRtaW4=
  username: dXNlcjE=
kind: Secret
metadata:
  annotations:
    avp.kubernetes.io/path: /cred/data/user
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"Secret","metadata":{"annotations":{"avp.kubernetes.io/path":"/cred/data/user"},"labels":{"app.kubernetes.io/instance":"vault-demo"},"name":"example-secret","namespace":"argocd"},"stringData":{"password":"admin","username":"user1"},"type":"Opaque"}
  creationTimestamp: "2022-03-21T02:11:09Z"
  labels:
    app.kubernetes.io/instance: vault-demo
  name: example-secret
  namespace: argocd
  resourceVersion: "169530652"
  uid: 46117309-b762-4bc6-9622-9ed5ff8fb01e
type: Opaque
$ echo YWRtaW4= | base64 -d
admin
$ echo  dXNlcjE= | base64 -d
user1
```

可以看到，secret已经被成功替换成在vault中设置的机密信息。

## ref

- argocd安装vault插件：https://argocd-vault-plugin.readthedocs.io/en/stable/installation/
- argocd安装：http://reborncodinglife.com/2021/12/23/argocd-learning-1/
- vault安装：http://reborncodinglife.com/2022/01/12/install-vault-in-ocp4/
