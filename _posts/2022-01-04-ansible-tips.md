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

- playbook中定义变量

```
 - hosts: nfs
   become: yes
   vars:
     share_path: /mnt/nfsroot
     nfs_ip: "{{ hostvars['nfs']['ansible_default_ipv4']['address'] }}"
     nfs_hostname: "{{ hostvars['nfs']['ansible_hostname'] }}"


   vars_files:
     - /home/ansible/user-list.txt

```

- 循环使用

```
tasks:
  - name: Ensure users are present
    user:
      name: “{{item}}” state: present
      loop:
        - dev_user
        - qa_user
        - prod_user
```

- 命令行调用module

```
ansible host-pattern -m module [-a 'module arguments'] [-i inventory]

ansible qa-servers -b -m unarchive -a "src=/tmp/enigma.tgz dest=/opt/ remote_src=yes"

ansible qa-servers -b -m lineinfile -a "regexp=DEPLOY_CODE line=CODE_RED path=/opt/enigma/details.txt"
```

- 定义handler

```
     - name: configure exports
       template:
         src: /home/ansible/exports.j2
         dest: /etc/exports
       notify: update nfs
   handlers:
     - name: update nfs exports
       command: exportfs -a
       listen: update nfs
```

- 加密文件

```
ansible-vault encrypt /home/ansible/confidential
```

- 查看facts变量

```
ansible <hostname> -m ansible.builtin.setup
```

- 使用magic变量

```
{{ hostvars['test.example.com']['ansible_facts']['distribution'] }}
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

- 常见模块

```
       // copy file
       copy:
         src: /home/ansible/scripts.tgz
         dest: /mnt/storage/
       
       // create user
       user:
         name: xyzcorp_network
         state: present

       // install pkg
       yum:
         name: nmap-ncat
         state: latest

       // install pkg
       package:
         name: elinks
         state: latest

       // update fine
       lineinfile:
         path: /etc/hosts
         line: "ansible.xyzcorp.com 169.168.0.1"

       // manage service
       service:
         name: nfs-server
         state: started
         enabled: yes

       // create file or dir
       file:
         state: directory
         path: /home/noc/.ssh
         mode: 0600
         owner: noc
         group: noc

       // use template
       template:
         src: /home/ansible/exports.j2
         dest: /etc/exports

       // check file status
       stat:
         path: /opt/user-agreement.txt
         register: filestat

       // run cmd
       command: /opt/data-job.sh
       async: 600
       poll: 0
       tags:
         - data-job

       // create user when file exist
       user:
         name: "{{ item }}"
       when:  filestat.stat.exists
       loop: "{{ users }}"
```

- ansible-navigator运行playbook

需要设置.ansible-navigator.yml文件和build相应的execution environment

```
ansible-navigator run playbook.yml -i inv --limit hostname -e "api_key=xxx ansible_python_interpreter=/usr/bin/python"
```

- 安装collection

```
ansible-galaxy collection install azure.azcollection
```

- 安装ansible

```
pip3 install ansible
```

> :) 未完待续......
