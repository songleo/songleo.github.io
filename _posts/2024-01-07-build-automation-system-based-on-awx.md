---
layout: post
title: 基于awx构建自动化系统
date: 2024-01-07 00:12:05
---

### 前提条件

需要提前安装以下软件：

- [Docker Desktop](https://docs.docker.com/desktop/) 4.26.1
- [kind](https://github.com/kubernetes-sigs/kind) v0.20.0
- [jq](https://github.com/jqlang/jq)

### 构建awx自动化系统

```
$ git clone git@github.com:songleo/automation-system.git
$ git checkout 1.0.0
$ cd automation-system
$ ./install.sh
```

install.sh脚本使用kind创建一个k8s集群，部署ingress-nginx和awx operator v2.10.0，然后安装awx。如果kind中下载pod镜像很慢，可以先在本地下载好镜像，然后使用kind将本地镜像导入kind集群，方便pod快速创建启动，命令如下：

```
kind load docker-image quay.io/ansible/awx-operator:2.10.0 --name awx
kind load docker-image postgres:13 --name awx
kind load docker-image docker.io/redis:7 --name awx
kind load docker-image quay.io/ansible/awx:23.6.0 --name awx
kind load docker-image quay.io/ansible/awx-ee:latest --name awx
```

### 查看部署的awx

可以看到awx和ingress-nginx operator都已经部署完成。

```
$ k get po -n awx
NAME                                               READY   STATUS    RESTARTS   AGE
awx-operator-controller-manager-7577b7567d-5smb4   2/2     Running   0          6m48s
awx-postgres-13-0                                  1/1     Running   0          5m47s
awx-task-58fd4c5c84-fm8j5                          4/4     Running   0          5m5s
awx-web-854949c456-sghg7                           3/3     Running   0          3m23s
$ k get po -n ingress-nginx
NAME                                        READY   STATUS      RESTARTS   AGE
ingress-nginx-admission-create-9vmdp        0/1     Completed   0          6m57s
ingress-nginx-admission-patch-nq78p         0/1     Completed   2          6m57s
ingress-nginx-controller-864894d997-q5bvn   1/1     Running     0          6m56s
```

### 访问awx

安装awx时指定了用户名和密码为admin/admin，方便测试使用。并且通过ingress方式暴露服务，并指定了ingress path和hostname，awx cr如下：

```
$ cat awx/awx.yaml
apiVersion: awx.ansible.com/v1beta1
kind: AWX
metadata:
  name: awx
  namespace: awx
spec:
  admin_user: admin
  admin_password_secret: awx-admin-password
  service_type: clusterip
  ingress_type: ingress
  ingress_path: /awx
  ingress_annotations: |
    kubernetes.io/ingress.class: nginx
  hostname: www.automation-system.com
---
apiVersion: v1
kind: Secret
metadata:
  name: awx-admin-password
  namespace: awx
stringData:
  password: admin
```

如果你在本机/etc/hosts文件添加了相应的hostname和ip映射，例如：

```
$ cat /etc/hosts | grep automation
192.168.0.106 www.automation-system.com
```

现在就可以通过访问：http://www.automation-system.com/awx/#/home 登录awx。你也可以在命令行验证awx服务状态：

```
$ curl -s http://www.automation-system.com/awx/api/v2/ping/ | jq .
{
  "ha": false,
  "version": "23.6.0",
  "active_node": "awx-web-854949c456-sghg7",
  "install_uuid": "2bb6183a-2ca0-426d-b4d5-2d35280eb81b",
  "instances": [
    {
      "node": "awx-task-58fd4c5c84-fm8j5",
      "node_type": "control",
      "uuid": "a03703f2-f1f5-42b8-9e51-ba66d173e153",
      "heartbeat": "2024-01-07T00:53:21.513707Z",
      "capacity": 160,
      "version": "23.6.0"
    }
  ],
  "instance_groups": [
    {
      "name": "controlplane",
      "capacity": 160,
      "instances": [
        "awx-task-58fd4c5c84-fm8j5"
      ]
    },
    {
      "name": "default",
      "capacity": 0,
      "instances": []
    }
  ]
}
```

至此，基于awx构建的自动化系统完成，后面会介绍如何通过ansible playbook配置awx，然后运行playbook。

### 参考

- https://github.com/songleo/automation-system
