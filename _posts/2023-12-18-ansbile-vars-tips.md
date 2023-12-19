---
layout: post
title: ansible变量tips
date: 2023-12-18 00:12:05
---

在ansible中，定义和传递变量是一个非常重要的功能，因为它允许你管理和使用不同的配置和环境。以下是ansible中定义和传递变量的主要方式，以及它们的使用示例：

### inventory var

这些变量定义在inventory文件中，适用于指定的主机或主机组。常用于设置特定主机的配置。例如：

```
[webservers]
web1 ansible_host=192.168.1.100 http_port=80 max_clients=200
```

### playbook var

在playbook中直接定义变量。适用于特定任务或play中的配置。例如：

```
- hosts: webservers
  vars:
    http_port: 80
    max_clients: 200
```

### role var

在角色的vars目录中定义。这些变量与特定角色紧密相关。例如：

```
# roles/example/vars/main.yml
http_port: 80
max_clients: 200
```

### group var and host var

这些变量定义在inventory文件同目录下的group_vars和host_vars目录中。适用于为特定主机组或主机设置变量。例如：

```
# group_vars/webservers.yml
http_port: 80

# host_vars/web1.yml
max_clients: 200
```
### command line var

在命令行中使用-e或--extra-vars选项传递变量。适合临时变量或覆盖其他变量。例如：

```
ansible-playbook playbook.yml -e "http_port=80 max_clients=200"
```

### var file

通过vars_files在playbook中引入外部变量文件。适用于组织大量变量。例如：

```
- hosts: webservers
  vars_files:
    - /vars/external_vars.yml
```

### environment var

在playbook中使用环境变量。这些变量通常用于依赖系统环境的配置。例如：

```
- hosts: webservers
  tasks:
    - shell: echo $HOME
      environment:
        home: /home/user
```

### registered var

执行任务后，通过register关键字将任务输出注册为变量。适用于根据前一任务的结果进行操作。例如：

```
- hosts: webservers
  tasks:
    - shell: echo "hello"
      register: result

    - debug: msg="{{ result.stdout }}"
```

### fact var

使用 set_fact模块在ansible中动态设置变量，例如：

```
- name: set var
  ansible.builtin.set_fact:
    http_port: 80
    max_clients: 200
```
