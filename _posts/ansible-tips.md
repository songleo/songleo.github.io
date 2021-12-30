---
layout: post
title: ansible tips
date: 2021-12-15 00:12:05
---

- all表示所有host
- ungrouped表示未分组的host
- 列出所有host

```
$ ansible all --list-hosts
  hosts (3):
    192.168.0.141
    192.168.0.142
    192.168.0.140
```

- -i选项可以指定hosts文件
- ansible配置文件使用顺序

```
ANSIBLE_CONFIG -> ./ansible.cfg -> ~/.ansible.cfg -> /etc/ansible/ansible.cfg
```
- 

> :) 未完待续......
