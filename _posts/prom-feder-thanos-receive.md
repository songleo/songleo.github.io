
ocp 4自带的prometheus是由openshift cluster monitoring operator管理，且默认就开始抓取ocp集群的指标信息。一般情况下，我们不能修改集群自带的prometheus。借助prometheus联邦功能，用户可以通过安装自己的prometheus去收集集群指标信息。


prometheus通过remote_write功能，将所有指标数据发送给thanos receiver。thanos receiver负责从不同的prometheus实例中接收指标数据，并将这些指标数据备份到云存储如s3。然后通过部署thanos store gateway去查询存储在云端的指标数据。thanos querier负责响应用户的查询请求，从thanos receiver和thanos store gateway获取用户请求的指标数据。

### 部署thanos store gateway

1) 云存储的访问凭证，如aws、gcp等，一般以secret方式提供，例如：

```
oc -n thanos create secret generic store-s3-credentials --from-file=store-s3-secret.yaml
```

主要用于访问云存储中备份的指标数据。

2) 在ocp 4中运行thanos store gateway，需要赋予其anyuid权限，如下：

```
oc -n thanos create serviceaccount thanos-store-gateway
oc -n thanos adm policy add-scc-to-user anyuid -z thanos-store-gateway
```

然后部署store gateway关联该serviceaccount即可。

3）安装[thanos store gateway](https://raw.githubusercontent.com/mvazquezc/thanos-multicluster/master/store-gateway.yaml)

```
oc -n thanos create -f store-gateway.yaml
oc -n thanos get pods -l "app=thanos-store-gateway"
```

### 部署thanos receiver

1) 云存储的访问凭证，如aws、gcp等，一般以secret方式提供，例如：

```
oc -n thanos create secret generic store-s3-credentials --from-file=store-s3-secret.yaml
```

主要用于将指标数据备份到云端，一般和store gateway共用一个。

2）部署反向代理验证客户端权限，如下：

```
oc -n thanos create serviceaccount thanos-receive
oc -n thanos create secret generic thanos-receive-proxy --from-literal=session_secret=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c43)
oc -n thanos annotate serviceaccount thanos-receive serviceaccounts.openshift.io/oauth-redirectreference.thanos-receive='{"kind":"OAuthRedirectReference","apiVersion":"v1","reference":{"kind":"Route","name":"thanos-receive"}}'
```

3）给service account添加用户权限以便进行身份验证和授权，如下：

```
oc -n thanos adm policy add-cluster-role-to-user system:auth-delegator -z thanos-receive
```

4）部署[receiver](https://raw.githubusercontent.com/mvazquezc/thanos-multicluster/master/thanos-receive.yaml)：

```
oc -n thanos create -f thanos-receive.yaml
oc -n thanos get pods -l "app=thanos-receive"
oc -n thanos create route reencrypt thanos-receive --service=thanos-receive --port=web-proxy --insecure-policy=Redirect
```

### ref

https://blog.openshift.com/federated-prometheus-with-thanos-receive/
