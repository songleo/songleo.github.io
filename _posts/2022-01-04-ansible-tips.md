---
layout: post
title: ansible使用tips
date: 2022-01-04 00:12:05
---

- all表示所有host

- ungrouped表示未分组的host

- 常用选项
  - -m：指定module
  - -a：指定module参数
  - -b：提升权限运行命令
  - -e：指定变量

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

- 命令行调用module

```
ansible host-pattern -m module [-a 'module arguments'] [-i inventory]

ansible qa-servers -b -m unarchive -a "src=/tmp/enigma.tgz dest=/opt/ remote_src=yes"

ansible qa-servers -b -m lineinfile -a "regexp=DEPLOY_CODE line=CODE_RED path=/opt/enigma/details.txt"
```

- 加密文件

```
ansible-vault encrypt /home/ansible/confidential
```

- 查看facts变量

```
ansible <hostname> -m ansible.builtin.setup
```

- 执行空运行playbook使用-C选项

- 查看模块文档

```
ansible-doc -l # 列出所有模块
ansible-doc service
ansible-doc -s service # 仅输出示例
```

- 安装collection

```
ansible-galaxy collection install azure.azcollection
```

- 安装ansible

```
pip3 install ansible
```

- 查询最新一个作业

```
curl -X GET \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  "https://controller.ansiblecloud.com/api/v2/jobs/?order_by=-id&page_size=1&search=Demo+Job+Template"
```

> :) 未完待续......
