---
layout: post
title: 配置新mac
date: 2024-03-07 00:12:05
---

### 软件

- chrome
- dash
- docker desktop
- iterm
- mysql workbench
- qq music
- redis insight
- slack
- visual studio code
- vmware fusion
- wechat
- youdao dictionary
- sogou

### 命令行工具

- ansible
- aws
- awx-cli
- az
- certbot
- flux
- git
- gitops
- grafana-cli
- golang
- helm
- jq
- jsonnet
- kubectl
- kustomize
- node_exporter
- oc
- operator-sdk
- prometheus
- promtool
- pulp
- rosa
- sops
- terraform
- tower-cli
- yq
- kind
- python: brew install python
- sshpass: brew install sshpass

### 配置

#### git

```
ssh-keygen -t rsa -b 4096 -C "ssli@redhat.com"
cat ~/.ssh/id_rsa.pub
git config --global user.email "ssli@redhat.com"
git config --global user.name "Song Song Li"
git config --global color.ui auto
```

### /etc/hosts

```
# local vm
192.168.0.121 h1
192.168.0.122 h2
192.168.0.133 h3

# private-cloud
192.168.0.107 www.private-cloud.com

# github
# 192.30.255.112 github.com
```

### cmd

```
mkdir -p ~/share/git
```

### bash

```
brew install bash-completion@2
echo "/opt/homebrew/bin/bash" >> /etc/shells
chsh -s /usr/local/bin/bash
```

### jumpvm

更新public key到authorized_key。
