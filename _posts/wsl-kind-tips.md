---
layout: post
title: wsl kind tips
date: 2026-05-16 00:12:05
---

```
wsl --install

sudo apt update
sudo apt install -y openssh-server

sudo service ssh start

hostname -I

sudo apt install -y \
curl \
wget \
git \
vim \
unzip \
ca-certificates \
gnupg \
lsb-release

kind create cluster \
--name demo \
--image kindest/node:v1.30.13


[wsl2]
memory=24GB
processors=12
swap=8GB
localhostForwarding=true
```