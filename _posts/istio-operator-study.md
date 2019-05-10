operator：利用kubernetes的自定义api资源（crd），描述我们想要部署的有状态应用，然后在自定义控制器中，根据自定义api对象的变化，来完成具体的部署和运维工作。

etcdcluster：一种custom resource definition，实例化后生成一个customer resource对象，通过该资源对象部署出一个etcd集群

编写一个etcd operator就是编写一个自定义控制器。


git clone https://github.com/coreos/etcd-operator

kubectl create -f example/deployment.yaml

kubectl describe crd  etcdclusters.etcd.database.coreos.com

kubectl apply -f example/example-etcd-cluster.yaml

kubectl get pods
