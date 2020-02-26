
ocp 4自带的prometheus是由openshift cluster monitoring operator管理，且默认就开始抓取ocp集群的指标信息。一般情况下，我们不能修改集群自带的prometheus。借助prometheus联邦功能，用户可以通过安装自己的prometheus去收集集群指标信息。


prometheus通过remote_write功能，将所有指标数据发送给thanos receiver。thanos receiver负责从不同的prometheus实例中接收指标数据，并将这些指标数据备份到云存储如s3。然后通过部署thanos store gateway去查询存储在云端的指标数据。thanos querier负责响应用户的查询请求，从thanos receiver和thanos store gateway获取用户请求的指标数据。

### 部署thanos store gateway

1) 云存储的访问凭证，如aws、gcp等，一般以secret方式提供，例如：

```
oc -n thanos create secret generic store-s3-credentials --from-file=store-s3-secret.yaml
```

2) 在ocp 4中运行thanos store gateway，需要赋予其anyuid权限，如下：

```
oc -n thanos create serviceaccount thanos-store-gateway
oc -n thanos adm policy add-scc-to-user anyuid -z thanos-store-gateway
```

3）安装[thanos store gateway](https://raw.githubusercontent.com/mvazquezc/thanos-multicluster/master/store-gateway.yaml)

```
oc -n thanos create -f store-gateway.yaml
```


### ref

https://blog.openshift.com/federated-prometheus-with-thanos-receive/
