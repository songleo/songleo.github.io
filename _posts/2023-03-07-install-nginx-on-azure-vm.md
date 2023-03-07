---
layout: post
title: 在azure vm中安装nginx
date: 2023-03-07 00:12:05
---

## 在azure创建vm

我创建的是ubuntu，记得打开80和443端口，如果你需要支持https的话。给vm设置相应的域名，如your_vm.eastus.cloudapp.azure.com

## 连接vm

chmod 400 your_key.pem
ssh -i your_key.pem azureuser@your_vm.eastus.cloudapp.azure.com

## install nginx

```
sudo apt update
sudo apt install nginx
sudo systemctl start nginx
systemctl status nginx
```

## install ansible

```
sudo apt-add-repository ppa:ansible/ansible
sudo apt update
sudo apt install ansible
ansible localhost -m ping
```

## 浏览器打开域名

```
your_vm.eastus.cloudapp.azure.com
```
