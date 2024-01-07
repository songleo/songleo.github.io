---
layout: post
title: 使用playbook配置awx
date: 2024-01-07 00:12:05
---

当部署完awx后，一般需要配置awx以运行playbook执行各种自动化任务。参考这篇文章部署awx：http://reborncodinglife.com/2024/01/07/build-automation-system-based-on-awx/

### 前提条件

需要提前安装以下软件：

- ansible
- docker
- jq

### 准备vm加入awx

通过以下方式创建2个docker模拟的vm：

```
docker run -d -p 11111:22 --name vm1 songleo/ubuntu-ssh
docker run -d -p 22222:22 --name vm2 songleo/ubuntu-ssh
```

你可以在本地通过一下方式验证，登录这个2个vm：

```
ssh admin@192.168.0.106 -p 11111
ssh admin@192.168.0.106 -p 22222
```

这个image已经提前设定好用户名和密码，具体参考：http://reborncodinglife.com/2024/01/06/use-container-to-simulate-vm-as-ssh-server/

### 使用playbook配置awx

克隆仓库，使用playbooks/configure_awx.yml配置organization、project、inventory、machine credential、host和job template，配置好以后就可以运行新建的job template。详细的配置参数请直接查看playbooks/configure_awx.yml。

```
$ git clone git@github.com:songleo/automation-system.git
$ cd automation-system
$ git checkout 1.0.0
$ export CONTROLLER_HOST="http://www.automation-system.com/awx/"
$ export CONTROLLER_USERNAME="admin"
$ export CONTROLLER_PASSWORD="admin"
$ ansible-playbook playbooks/configure_awx.yml
[WARNING]: No inventory was parsed, only implicit localhost is available
[WARNING]: provided hosts list is empty, only localhost is available. Note that the implicit localhost does not match 'all'

PLAY [configure awx] *********************************************************************************************************

TASK [create organization] ***************************************************************************************************
changed: [localhost]

TASK [create project] ********************************************************************************************************
changed: [localhost]

TASK [create inventory] ******************************************************************************************************
changed: [localhost]

TASK [create machine credential] *********************************************************************************************
changed: [localhost]

TASK [add a new host to inventory] *******************************************************************************************
changed: [localhost] => (item={'name': 'vm1', 'variables': {'ansible_ssh_host': '192.168.0.106', 'ansible_ssh_port': 11111}})
changed: [localhost] => (item={'name': 'vm2', 'variables': {'ansible_ssh_host': '192.168.0.106', 'ansible_ssh_port': 22222}})

TASK [add a job template to ping host] ***************************************************************************************
changed: [localhost]

PLAY RECAP *******************************************************************************************************************
localhost                  : ok=6    changed=6    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

最后通过playbook运行新建的job template去ping 2个vm：

```
$ ansible-playbook playbooks/launch_job.yml
[WARNING]: No inventory was parsed, only implicit localhost is available
[WARNING]: provided hosts list is empty, only localhost is available. Note that the implicit localhost does not match
'all'

PLAY [launch job to ping host] ******************************************************************************************

TASK [launch job] *******************************************************************************************************
changed: [localhost]

TASK [wait for the job to finish] ***************************************************************************************
ok: [localhost]

TASK [print the job result] *********************************************************************************************
ok: [localhost] => {
    "job_result": {
        "changed": false,
        "elapsed": 4.665,
        "failed": false,
        "finished": "2024-01-07T03:40:45.066412Z",
        "id": 5,
        "started": "2024-01-07T03:40:40.401628Z",
        "status": "successful"
    }
}

PLAY RECAP **************************************************************************************************************
localhost                  : ok=3    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

可以看到，已经成功启动playbook，你也可以通过awx的api查看这个id为5的作业输出。如下：

```
$ curl -u admin:admin $CONTROLLER_HOST/api/v2/jobs/5/stdout/?format=txt
SSH password:

PLAY [ping host for testing] ***************************************************

TASK [ping host] ***************************************************************
ok: [vm2]
ok: [vm1]

PLAY RECAP *********************************************************************
vm1                        : ok=1    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
vm2                        : ok=1    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

可以看到playbook已经成功运行在vm1和vm2。awx的基本配置完成。

### 参考

- https://github.com/songleo/automation-system
