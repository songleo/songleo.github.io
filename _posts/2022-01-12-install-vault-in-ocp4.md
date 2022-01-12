---
layout: post
title: openshift安装vault
date: 2022-01-12 00:12:05
---

### 安装helm

```
$ curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
$ chmod 700 get_helm.sh
$ ./get_helm.sh
```

### 安装vault

将vault的helm repo克隆到本地，并checkout到最新版本v0.18.0：

```
$ git clone https://github.com/hashicorp/vault-helm.git
$ git checkout -b v0.18.0 v0.18.0
```

修改values.yaml文件适配openshift：

```
global:
  openshift: true
server:
  route: true
ui:
  enabled: true
```

安装vault：

```
$ kubectl create namespace vault
$ helm install vault . -n vault
$ helm status vault
```

查看vault pod，会发现pod没有正常运行，是因为vault需要初始化和解封才能使用：

```
$ k get po -n vault
NAME                                    READY   STATUS    RESTARTS   AGE
vault-0                                 0/1     Running   0          5m4s
vault-agent-injector-5bcd77b757-fdbmf   1/1     Running   0          5m4s
```

进入vault pod初始化和解封vault：

```
$ k exec -it vault-0 -- /bin/sh
/ $ vault operator init
Unseal Key 1: JARc0mJEWYp1yBcZP8D5YafP0HnugiUmTw+StK+uEzQL
Unseal Key 2: e0O1/SzWuya0RZ73R3qnDN+sNqvJEgURQfFp3/m6omh2
Unseal Key 3: K7xdTB5Hv8xgyEUZPm64ZJG/Iof8RTiXm3BjAVF/hRGD
Unseal Key 4: +AsMO/4+cJdcKl9YIbqvRpPizfeCsw9eevKy774R9ixu
Unseal Key 5: 36h+/LXye45qfD8Fugad2tXNT4Q3bxx392rpwiCjoHb/

Initial Root Token: s.Fh3XkXxzxJmJmEIlKkNkfVDe

Vault initialized with 5 key shares and a key threshold of 3. Please securely
distribute the key shares printed above. When the Vault is re-sealed,
restarted, or stopped, you must supply at least 3 of these keys to unseal it
before it can start servicing requests.

Vault does not store the generated master key. Without at least 3 keys to
reconstruct the master key, Vault will remain permanently sealed!

It is possible to generate new unseal keys, provided you have a quorum of
existing unseal keys shares. See "vault operator rekey" for more information.
/ $ vault operator unseal JARc0mJEWYp1yBcZP8D5YafP0HnugiUmTw+StK+uEzQL
/ $ vault operator unseal e0O1/SzWuya0RZ73R3qnDN+sNqvJEgURQfFp3/m6omh2
/ $ vault operator unseal K7xdTB5Hv8xgyEUZPm64ZJG/Iof8RTiXm3BjAVF/hRGD
$ k get po -n vault
NAME                                    READY   STATUS    RESTARTS   AGE
vault-0                                 1/1     Running   0          10m
vault-agent-injector-5bcd77b757-fdbmf   1/1     Running   0          10m
```

可以看到pod已经正常运行。

### 测试vault

先登录到vault：

```
$ k exec -it vault-0 -- /bin/sh
/ $ vault login s.Fh3XkXxzxJmJmEIlKkNkfVDe
Success! You are now authenticated. The token information displayed below
is already stored in the token helper. You do NOT need to run "vault login"
again. Future Vault requests will automatically use this token.

Key                  Value
---                  -----
token                s.Fh3XkXxzxJmJmEIlKkNkfVDe
token_accessor       F9a5FtCSi75rxDAKPbr5I2EN
token_duration       ∞
token_renewable      false
token_policies       ["root"]
identity_policies    []
policies             ["root"]
```

创建secret测试vault：

```
/ $ vault secrets enable -path=demo kv-v2
Success! Enabled the kv-v2 secrets engine at: demo/
/ $ vault kv put demo/secret k1=v1 k2=v2
Key                Value
---                -----
created_time       2022-01-12T09:55:22.474848432Z
custom_metadata    <nil>
deletion_time      n/a
destroyed          false
version            1
/ $ vault kv get demo/secret
======= Metadata =======
Key                Value
---                -----
created_time       2022-01-12T09:55:22.474848432Z
custom_metadata    <nil>
deletion_time      n/a
destroyed          false
version            1

=== Data ===
Key    Value
---    -----
k1     v1
k2     v2
```

可以看到，已经能正常创建secret，至此，安装完毕。

### 参考

- https://medium.com/hybrid-cloud-engineering/vault-integration-into-openshift-container-platform-b57c175a79da
