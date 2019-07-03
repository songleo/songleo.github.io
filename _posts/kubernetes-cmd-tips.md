## kubectl使用指定的配置文件

kubectl --kubeconfig /path/to/kubeconfig get no

## 进入pod中容器

k exec -it  -n ns pod-name /bin/sh

## 设置KUBECONFIG对进行访问

export KUBECONFIG=path/to/kubeconfig