---
layout: post
title: 在ansible on clouds部署mesh
date: 2025-01-09 00:12:05
---

## 在azure创建aap 2.4

- 选择public模式，方便访问aap

## 在azure创建hop和exec node

- 2个node使用的rhel9.5
- 创建exec node时选择不同的vnet，确保2个node之间的子网不重叠，以免ip冲突，hop无法连接exec
- 配置hop node和exec node
```
sudo subscription-manager register --auto-attach
# aap 2.4
sudo subscription-manager repos --enable ansible-automation-platform-2.4-for-rhel-9-x86_64-rpms
# aap 2.5
sudo subscription-manager repos --enable ansible-automation-platform-2.5-for-rhel-9-x86_64-rpms
sudo dnf install -y ansible-core
ansible-galaxy collection install ansible.receptor
sudo firewall-cmd --permanent --zone=public --add-port=27199/tcp
```
- 配置hop node ssh免登录到exec node
```
ssh-keygen -t rsa -b 4096
ssh-copy-id -i ~/.ssh/id_rsa.pub ssli@exec_node
ssh-copy-id -i ~/.ssh/id_rsa.pub ssli@hop_node
# 在exec node执行
ssh-keygen -t rsa -b 4096
ssh-copy-id -i ~/.ssh/id_rsa.pub ssli@exec_node
```

## 配置automation controller

参考这个文章配置automation controller：https://www.redhat.com/en/blog/deploying-automation-mesh-ansible-clouds

## 配置hop和exec node

参考这个文档配置hop和exec node：https://www.redhat.com/en/blog/deploying-automation-mesh-ansible-clouds

## 网络配置

- aap到hop node的双向peering
- hop node到exec node的双向peering
- hop node到exec node的网络安全组中打开相应的端口22和27199

## 故障排查

- 重启hop node和exec node
- 重启controller pod
- 在credentials添加exec node的登录用户和密码用于执行作业
- 增加磁盘空间

```
Error: copying system image from manifest list: writing blob: adding layer with blob "sha256:d865617f929d019bc8240e48ac30981f27cf3f56ab30b05c99164d4d7b904438"/""/"sha256:f06049f87c01a63cd0d784d9fef445e7381cceccaa7c5a05ab9306fbe6939e5a": unpacking failed (error: exit status 1; output: open /usr/local/lib/python3.9/site-packages/azure/mgmt/network/v2019_06_01/aio/operations/__pycache__/_network_security_groups_operations.cpython-39.pyc: no space left on device)
WARN[0035] Failed to add pause process to systemd sandbox cgroup: dbus: couldn't determine address of session bus
```

增加磁盘空间：

```
[ssli@ssli-mesh-exec ~]$ podman info |egrep 'graphRoot|overlay'
  graphDriverName: overlay
  graphRoot: /home/ssli/.local/share/containers/storage
  graphRootAllocated: 1006632960
  graphRootUsed: 380014592
[ssli@ssli-mesh-exec ~]$ df -hP /home/ssli/
Filesystem                 Size  Used Avail Use% Mounted on
/dev/mapper/rootvg-homelv  960M  363M  598M  38% /home
[ssli@ssli-mesh-exec ~]$ sudo lvextend -L +4G /dev/mapper/rootvg-homelv
  Size of logical volume rootvg/homelv changed from 1.00 GiB (256 extents) to 5.00 GiB (1280 extents).
  Logical volume rootvg/homelv successfully resized.
[ssli@ssli-mesh-exec ~]$ sudo xfs_growfs /home
meta-data=/dev/mapper/rootvg-homelv isize=512    agcount=4, agsize=65536 blks
         =                       sectsz=4096  attr=2, projid32bit=1
         =                       crc=1        finobt=1, sparse=1, rmapbt=0
         =                       reflink=1    bigtime=1 inobtcount=1 nrext64=0
data     =                       bsize=4096   blocks=262144, imaxpct=25
         =                       sunit=0      swidth=0 blks
naming   =version 2              bsize=4096   ascii-ci=0, ftype=1
log      =internal log           bsize=4096   blocks=16384, version=2
         =                       sectsz=4096  sunit=1 blks, lazy-count=1
realtime =none                   extsz=4096   blocks=0, rtextents=0
data blocks changed from 262144 to 1310720
[ssli@ssli-mesh-exec ~]$ df -hP /home/ssli/
Filesystem                 Size  Used Avail Use% Mounted on
/dev/mapper/rootvg-homelv  5.0G  393M  4.6G   8% /home
```

## 确认automation mesh

在controller的instances页面，hop node和exec node状态都是ready。

## 参考

- https://www.redhat.com/en/blog/deploying-automation-mesh-ansible-clouds
- https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform/2.4/html/red_hat_ansible_automation_platform_automation_mesh_for_operator-based_installations/assembly-automation-mesh-operator-aap#proc-define-mesh-node-types
