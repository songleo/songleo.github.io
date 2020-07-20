---
layout: post
title: 通过rbac给用户配置权限
date: 2020-07-20 12:12:05
---


## rbac配置如下：

```
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""] # "" indicates the core API group
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
# This role binding allows "viewer" to read pods in the "default" namespace.
# You need to already have a Role named "pod-reader" in that namespace.
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
# You can specify more than one "subject"
- kind: User
  name: viewer # "name" is case sensitive
  apiGroup: rbac.authorization.k8s.io
roleRef:
  # "roleRef" specifies the binding to a Role / ClusterRole
  kind: Role #this must be Role or ClusterRole
  name: pod-reader # this must match the name of the Role or ClusterRole you wish to bind to
  apiGroup: rbac.authorization.k8s.io

```

这里给viewer用户查看default namespace pod的权限，如下：

```
$ oc apply -f pod-reader-role.yaml
$ oc get users
NAME     UID                                    FULL NAME   IDENTITIES
admin    83ea55bf-b33c-4df5-8d90-b74f5df752d8               my_htpasswd_provider:admin
viewer   0d0a3d16-b9ce-425a-87f3-1874468a9ad8               my_htpasswd_provider:viewer
$ oc login -u viewer -p admin
Login successful.

You don't have any projects. You can try to create a new project, by running

    oc new-project <projectname>

$ oc get po -n default
No resources found in default namespace.
$ oc get po -n openshift-config
Error from server (Forbidden): pods is forbidden: User "viewer" cannot list resource "pods" in API group "" in the namespace "openshift-config"
```

可以看到，当使用viewer用户登录ocp后，只能查看default namespace中的pod，如果查询其他namespace的pod会被禁止。
