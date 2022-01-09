---
layout: post
title: 在docker上启用opa
date: 2022-01-09 00:12:05
---

docker可以启用很多插件，这里主要介绍opa插件，用于做策略控制。

### 定义一个策略

```
$ cat /etc/docker/policies/authz.rego
package docker.authz

default allow = false

allow {
    not deny
}

deny {
    seccomp_unconfined
}

seccomp_unconfined {
    # This expression asserts that the string on the right-hand side is equal
    # to an element in the array SecurityOpt referenced on the left-hand side.
    input.Body.HostConfig.SecurityOpt[_] == "seccomp:unconfined"
}
```

该策略会拒绝disable seccomp的容器运行，策略文件rego语言定义规则。

### 安装opa插件

```
$ docker plugin install openpolicyagent/opa-docker-authz-v2:0.4 opa-args="-policy-file /opa/policies/authz.rego"
$ cat > /etc/docker/daemon.json <<EOF
{
    "authorization-plugins": ["openpolicyagent/opa-docker-authz-v2:0.4"]
}
EOF
$ systemctl daemon-reload ; systemctl restart docker
$ docker plugin ls
ID                  NAME                                      DESCRIPTION                                     ENABLED
cba3d1fa9b61        openpolicyagent/opa-docker-authz-v2:0.4   A policy-enabled authorization plugin for Do…   true
$ docker info | grep opa
  Authorization: openpolicyagent/opa-docker-authz-v2:0.4
```

这里需要注意的时，安装的插件默认会mount宿主机的/etc/docker/目录到插件中的/opa目录，这就是为什么我们创建的策略文件authz.rego是位于/etc/docker/目录，安装插件指定的策略文件目录却是/opa。

### 测试策略是否生效

```
$ docker run --security-opt seccomp:unconfined hello-world
docker: Error response from daemon: authorization denied by plugin openpolicyagent/opa-docker-authz-v2:0.4: request rejected by administrative policy.
See 'docker run --help'.
$ docker run hello-world

Hello from Docker!
This message shows that your installation appears to be working correctly.
...
```

可以看到，如果运行的容器没有启用seccomp，就会无法运行。

### 参考

- https://www.openpolicyagent.org/docs/latest/docker-authorization/
