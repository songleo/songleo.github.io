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

- ansible运行命令格式如下：

```
ansible host-pattern -m module [-a 'module arguments'] [-i inventory]
```

- 检查playbook语法

```
 ansible-playbook --syntax-check webserver.yml
```

- 执行空运行playbook使用-C选项

- 查看模块文档

```
ansible-doc -l # 列出所有模块
ansible-doc service
ansible-doc -s service # 仅输出示例
```

> :) 未完待续......
