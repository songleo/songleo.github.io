---
layout: post
title: 导出和导入aap资源
date: 2022-04-15 00:12:05
---

- 获取aap controller管理员密码:

```
$ oc get secret automation-controller-admin-password -n ansible-automation-platform -o json | jq -r '.data.password' | base64 -d
```

- 确保可以登录到aap controller:

```
$ awx login --conf.host https://app-controller.com/ --conf.username $USERNAME --conf.password $PASSWORD
```

- 从aap导出资源:

```
$ awx export --conf.host https://app-controller.com/ --conf.username $USERNAME --conf.password $PASSWORD > resource.json
```

- 将资源导入到另一个aap环境:

```
$ awx import < resource.json --conf.host https://app-controller.com/ --conf.username $USERNAME --conf.password $PASSWORD
```

## links

- https://docs.ansible.com/ansible-tower/latest/html/towercli/examples.html#import-export
- https://docs.ansible.com/ansible-tower/latest/html/towercli/usage.html#installation
