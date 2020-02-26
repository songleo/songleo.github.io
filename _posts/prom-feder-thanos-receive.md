
ocp 4自带的prometheus是由openshift cluster monitoring operator管理，且默认就开始抓取ocp集群的指标信息。一般情况下，我们不能修改集群自带的prometheus。


prometheus通过remote_write功能，将所有指标数据发送给thanos receiver。thanos receiver负责从不同的prometheus实例中接收指标数据，并将这些指标数据备份到云存储如s3。然后通过部署thanos store gateway去查询存储在云端的指标数据。thanos querier负责响应用户的查询请求，从thanos receiver和thanos store gateway获取用户请求的指标数据。



### ref

https://blog.openshift.com/federated-prometheus-with-thanos-receive/
