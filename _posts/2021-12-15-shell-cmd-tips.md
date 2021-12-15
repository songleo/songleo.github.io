---
layout: post
title: shell命令tips
date: 2021-12-15 00:12:05
---

- 命令查找

```
# install fzf
brew install fzf
$(brew --prefix)/opt/fzf/install
```

- 判断cmd是否存在

```

if command -v cmd >/dev/null 2>&1; then
  echo 'exists cmd'
else 
  echo 'no exists cmd'
fi
```

- 判断变量是否存在

```
if [[ -z "${var}" ]]; then
  echo "var is not set"
fi

or 

if [[ -n "${var}" ]]; then
  echo "var is set"
fi
```

- 遇到不存在的变量终止执行

```
set -u
or
set -o nounset
```

- 脚本执行发生错误就终止执行

```
set -e

set -o pipefail # 适用于管道命令
```

- 调式shell脚本

```
set -x
```

- xargs传递变量

```
cat file | xargs -I line grep -r line /path/to/file
```

- virtual box在mac上共享文件夹设置
  
```
apt-get install virtualbox-guest-utils
mount -t vboxsf -o uid=0,gid=0 share /share
```

- 安装ansible

```
# centos
yum install epel-release
yum install ansible

# ubuntu
apt update
apt install software-properties-common
add-apt-repository --yes --update ppa:ansible/ansible
apt install ansible

# mac
brew install ansible
```

- 安装docker

```
# centos
# 阿里镜像源
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
yum install -y yum-utils
yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
yum install docker-ce docker-ce-cli containerd.io -y
systemctl start docker

# ubuntu
# 阿里镜像源
curl -fsSL http://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo apt-key add -
add-apt-repository "deb [arch=amd64] http://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"
apt-get remove docker docker-engine docker.io containerd runc
apt-get update
apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install docker-ce docker-ce-cli containerd.io -y
service docker start
```

- ssh免密登录

```
ssh-keygen
ssh-copy-id root@192.168.0.130
ssh root@192.168.0.130
```

- 配置github

```
ssh-keygen -t rsa -b 4096 -C "ssli@redhat.com"
cat ~/.ssh/id_rsa.pub
git config --global user.email "ssli@redhat.com"
git config --global user.name "Song Song Li"
git config --global color.ui auto
```

- curl从指定的url安装cmd

```
curl -Lo /usr/local/bin/cmd https://url/to/cmd
chmod +x /usr/local/bin/cmd
```

> :) 未完待续......
