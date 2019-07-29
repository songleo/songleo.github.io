## kubectl使用指定的配置文件

kubectl --kubeconfig /path/to/kubeconfig get no

## 进入pod中容器

kubectl exec -it  -n ns pod-name /bin/sh

## 设置KUBECONFIG对进行访问

export KUBECONFIG=path/to/kubeconfig

## 删除所有po

kubectl delete po --all

## 查询所有ns下pod

kubectl get pods --all-namespaces

## 修改对象

kubectl edit deploy nginx-test

