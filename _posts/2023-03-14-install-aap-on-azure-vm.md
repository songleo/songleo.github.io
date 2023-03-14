---
layout: post
title: 在azure vm中安装aap
date: 2023-03-014 00:12:05
---

## 在azure创建vm

在azure中创建2个rhel 8.7 vm，一个用于安装controller，一个用于安装hub，并开发相应的端口。具体要求参考：https://access.redhat.com/documentation/en-us/red_hat_ansible_automation_platform/2.2/html/red_hat_ansible_automation_platform_installation_guide/planning-installation#red_hat_ansible_automation_platform_system_requirements

## 连接vm配置ssh免登录

通过ssh-copy-id配置controller到自己和hub节点ssh节点免登录。

## 注册系统

```
subscription-manager register --username user1 --password ****** --auto-attach
```

## 运行下面命令更新yum证书

azure vm有个bug，因为证书过期，导致无法更新yum源。

```
yum --disablerepo='*' remove 'rhui-azure-rhel8' -y
wget https://rhelimage.blob.core.windows.net/repositories/rhui-microsoft-azure-rhel8.config
yum --config=rhui-microsoft-azure-rhel8.config install rhui-azure-rhel8
yum update ca-certificates
yum clean all
```

## 删除vm中/etc/locale.conf文件的首行注释

这个文件中的首行注释会导致安装失败，运行安装脚本前先删除。

## 下载安装包

我安装的版本是aap 2.2，从该网站下载相应安装包并解压：https://access.redhat.com/downloads/content/480/ver=2.2/rhel---8/2.2/x86_64/product-software

## 选定安装模式

aap支持很多种安装方式，我这里是选择安装controller和hub，并在controller节点安装postgres数据库，具体安装配置参考：https://access.redhat.com/documentation/en-us/red_hat_ansible_automation_platform/2.2/html/red_hat_ansible_automation_platform_installation_guide/assembly-platform-install-scenario#ref-standlone-platform-inventory_platform-non-inst-database

## 运行安装脚本

在controller运行安装脚本：

```
./setup.sh
```

## 登录controller和hub验证安装是否成功
