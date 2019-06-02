---
layout: post
title: helm学习（一）
date: 2019-05-16 00:12:05
---

helm的主要功能是封装kubernetes应用，并对应用进行版本管理、依赖管理、升级回滚，方便部署kubernetes应用。通过helm部署kubernetes应用时，实际是将templates渲染成kubernetes能识别的yaml格式的资源描述文件。helm采用c/s架构，由helm cli（客户端）和tiller（服务端，在最新版已经移除）组成，helm cl就是一个可执行文件，方便对应用进行配置、部署、升级和回滚。

核心概念如下：

- helm：kubernetes的包管理工具，类似rhel的yum或者ubuntu的apt-get，chart管理器，负责create、pull、search和verify chart，并通过helm安装tiller，调用tiller执行相应操作，如根据chart创建一个release

- tiller：helm的服务端，由helm安装（helm init --upgrade）在kubernetes集群中的一个pod，用来执行helm cli发送的命令，管理release，最新版已经移除该组件

- chart：helm管理的应用安装包，也可以称为kubernetes的资源包描述，结构固定的目录或者压缩文件，多个chart之间可以相互依赖，类似rhel中的rpm一样，是一组配置好的kubernetes资源定义组合，至少包含自描述文件chart.yaml，和一个模板文件values.yaml

- release：部署一个chart后的实例，即执行helm install后生成一个release，是一组已经部署到kubernetes集群的资源集合

chart文件结构：

```
├── Chart.yaml
├── README.md
├── templates
│   ├── NOTES.txt
│   ├── _helpers.tpl
│   ├── deployment.yaml
│   ├── pvc.yaml
│   ├── secrets.yaml
│   └── svc.yaml
└── values.yaml
```


- chart.yaml：chart本身的版本和配置信息
- charts：依赖的chart
- templates：配置模板目录，按照go template语法，按照不通的配置安装release
- notes.txt：helm的提示信息
- _helpers.tpl：用于修改kubernetes api对象的配置模板
- deployment.yaml：kubernetes的deployment对象配置
- service.yaml：kubernetes的service对象配置
- valus.yaml：kubernetes对象的配置

提前安装kubernetes集群后，helm的安装步骤如下：

```
# curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get > get_helm.sh
# chmod 700 get_helm.sh
# ./get_helm.sh
# kubectl create serviceaccount --namespace kube-system tiller
# kubectl create clusterrolebinding tiller-cluster-rule --clusterrole=cluster-admin --serviceaccount=kube-system:tiller
# helm init --upgrade
# kubectl patch deploy --namespace kube-system tiller-deploy -p '{"spec":{"template":{"spec":{"serviceAccount":"tiller"}}}}'
# kubectl -n kube-system get pods|grep tiller
```

常用命令如下：

release管理：

- install：安装一个release
- delete：删除一个release
- upgrade/rollback：升级和回滚
- list：查询安装的release
- history：查询release的历史信息
- status：查询release的状态

chart管理：

- create：创建一个chart
- fetch：获取一个chart
- search：查询chart
- inspect：查看chart信息
- package：打包一个chart
- verify：验证一个chart
- lint：查看chart是否存在问题

如果安装过程中出现该错误：

```
Error: no available release name found
```

一般是tiller没有正确的角色权限导致，执行以下命令解决：

```
kubectl create serviceaccount --namespace kube-system tiller
kubectl create clusterrolebinding tiller-cluster-rule --clusterrole=cluster-admin --serviceaccount=kube-system:tiller
kubectl patch deploy --namespace kube-system tiller-deploy -p '{"spec":{"template":{"spec":{"serviceAccount":"tiller"}}}}'
```

若由于某些不能描述的原因导致镜像下载失败，更换国内镜像源就可以了。

### 参考

- https://ezmo.me/2017/09/24/helm-quick-toturial/
- https://jimmysong.io/kubernetes-handbook/practice/helm.html
