---
layout: post
title: 在pod中调试和测试playbook
date: 2024-11-13 00:12:05
---

我的playbook是在pod中运行的，因此每次修改playbook后，需要将代码更新到镜像，再将镜像推送到镜像仓库，最后启动pod来测试修改。

### 启动一个容器

首先，从现有的基础镜像启动一个容器，并进入交互式bash环境。

```
export container_name=container1
docker run -it --name $container_name quay.io/songleo/ssli-utility:test /bin/bash
```
此步骤会启动一个容器，并进入交互式模式，便于后续的文件操作。

### 将修改后的代码复制到容器中

在本地对playbook进行修改后，在新终端将修改内容复制到容器中指定的路径。

```
export container_name=container1
docker cp /my/playbooks/. $container_name:/runner/playbooks/
```
此命令会将本地路径/my/playbooks/下的所有文件复制到容器的/runner/playbooks/路径。

### 提交修改到镜像

当容器中已经包含最新的playbook后，我们需要将容器的状态保存为一个新的镜像。

```
docker commit $container_name quay.io/songleo/ssli-utility:test
```
此命令将当前容器的状态保存为quay.io/songleo/ssli-utility:test镜像。

### 推送镜像到镜像仓库

为了在kubernetes集群中使用最新的镜像，我们需要将更新的镜像推送到镜像仓库。

```
docker push quay.io/songleo/ssli-utility:test
```
此步骤会将新的镜像上传到指定的quay仓库。

### 在kubernetes中验证修改

最后，在kubernetes集群中启动一个pod来运行playbook，以验证修改是否生效。可以通过以下简单的yaml文件启动pod：

```
apiVersion: v1
kind: Pod
metadata:
  name: playbook-test
spec:
  containers:
  - name: playbook-runner
    image: quay.io/songleo/ssli-utility:test
    command: ["/bin/bash", "-c", "ansibleplaybook/runner/playbooks/test-playbook.yml"]
  restartPolicy: Never
```
