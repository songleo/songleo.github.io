---
layout: post
title: let’s encrypt使用tips
date: 2023-03-07 00:12:05
---


## connect your vm

chmod 400 ssli-ssl-test_key.pem
ssh -i ssli-ssl-test_key.pem azureuser@ssl-test.eastus.cloudapp.azure.com

打开80和443端口

## install nginx

sudo apt update
sudo apt install nginx
sudo systemctl start nginx
systemctl status nginx

## install ansible

sudo apt-add-repository ppa:ansible/ansible
sudo apt update
sudo apt install ansible
ansible localhost -m ping

## ref

- https://letsencrypt.org/zh-cn/how-it-works/
