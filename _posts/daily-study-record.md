
05-13

## kubernetes api扩展学习

crd定义，需要描述资源的组、版本、资源类型、资源的作用范围（namespace和cluster级别）。

kubernetes目前只支持2中方式扩展api：

- crd：简单且和kubernetes高度集成，适用于声明式api，它的controller是单独运行，通过client-go和api server交互，而内置的controller统一由kube-controller管理，类似外挂和内置的关系

- api aggregation：独立的api server，由主api server委托该独立的api server处理自定义的资源，更加灵活，但是不支持kubectl，和kubernetes不够统一，适用于命令模式

声明式api:
kubectl apply命令（声明式请求），可以实现多个客户端同时写一个api对象，借助类似git merge的功能，kubernetes自动merge对api对象的修改，实现一种类似patch的操作，如果出现merge冲突，才需要人为干扰。如果使用replace之类的命令式请求，就不能实现多个客户端同时写一个api对象（api server实现）。yaml配置文件，用于描述api对象的期望状态。


编写自定义控制器步骤：
- 编写main：定义并初始化一个自定义控制器（rc）,然后启动它
- 编写自定义控制器的定义
- 编写控制器的业务逻辑

除了control loop之外，其他代码都是kubernetes自动生成的。开发者主要关注的是获取api对象的实际状态（kubernetes维护），然后和它的期望状态（yaml文件定义）做对比，从而决定想要的业务逻辑。

主要分为2部分：

informer：自带本地缓存（store）和索引（index），并可以注册和触发event handler的client，它使用了reflector包中的listandwatch机制获取并监视api对象的变化，reflector和informer之间使用了增量先进先出队列进行协同，informer和control loop之间通过工作队列进行协同

另外，还可以使kubernetes默认的api对象的informer，例如使用deployment的informer，那么该自定义的资源就可以获取集群中所有的deployment对象，然后就可以实现对deployment的控制


control loop：控制循环，一个死循环，不断的通过lister从informer的缓存中获取对象，然后对比对象的实际状态和期望状态，如果不一致则执行相应的业务逻辑。

分成informer和control loop是为了解耦，防止control loop执行过慢把informer拖死，通过引入工作队列，防止双发速度不一致导致相互卡死，也为了解耦。

faq:

- 在自定义控制器中，如何同时使用kubernetes默认的api对象的informer工厂，例如deployment的informer？done

05-14

## rabc

通过kubernetes api动态配置策略。

operator是一个可以处理某种类型的自定义资源的自定义控制器，开发和部署分布式应用的事实标准。operator本身在实现上，其实是在kubernetes声明式api基础上的一种“微创新”。它合理的利用了kubernetes api可以添加自定义api类型的能力，然后又巧妙的通过kubernetes原生的“控制器模式”，完成了一个面向分布式应用终态的调谐过程。诞生于2016秋天。operator只是一个围绕kubernetes api对象的“终态”进行调谐的一个控制器（controller）而已。

05-15

## istio operator design


## helm

主要功能是封装kubernetes原因应用，并对应用进行版本管理、依赖管理、升级回滚，方便对kubernetes应用部署。通过helm部署应用时，实际是将templates渲染成kubernetes能是别的yaml格式的文件。

安装：

提前安装kubernetes集群

```
# brew install kubernetes-helm
# helm init --upgrade

# curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get > get_helm.sh
# chmod 700 get_helm.sh
# ./get_helm.sh
# kubectl create serviceaccount --namespace kube-system tiller
# kubectl create clusterrolebinding tiller-cluster-rule --clusterrole=cluster-admin --serviceaccount=kube-system:tiller
# helm init --upgrade
# kubectl patch deploy --namespace kube-system tiller-deploy -p '{"spec":{"template":{"spec":{"serviceAccount":"tiller"}}}}'
# kubectl -n kube-system get pods|grep tiller
```

c/s架构，由helm cli（客户端）和tiller（服务端）组成。helm cl就是一个可执行文件，方便对应用进行配置、部署、升级和回滚。

核心概念：

- helm：kubernetes的包管理工具，类似rhel的yum或者ubuntu的apt-get，chart管理器，负责create、pull、search和verify chart，并通过helm安装tiller，调用tiller执行相应操作，如根据chart创建一个release

- tiller：helm的服务端，由helm安装（helm init --upgrade）在kubernetes集群中的一个pod，用来执行helm cli发送的命令，管理release

- chart：helm管理的应用安装包，也可以称为kubernetes的资源包描述，结构固定的目录或者压缩文件，多个chart之间可以相互依赖，类似rhel中的rpm一样，是一组配置好的kubernetes资源定义组合，至少包含自描述文件chart.yaml，和一个模板文件values.yaml

- release：部署一个chart后的实例，即执行helm install后生成一个release，是一组已经部署到kubernetes集群的资源集合

chart文件结构：

- chart.yaml：chart本身的版本和配置信息
- charts：依赖的chart
- templates：配置模板目录，按照go template语法
- notes.txt：helm的提示信息
- _helpers.tpl：用于修改kubernetes api对象的配置模板
- deployment.yaml：kubernetes的deployment对象配置
- service.yaml：kubernetes的service对象配置
- valus.yaml：kubernetes对象的配置

faq：

- Error: no available release name found

```
kubectl create serviceaccount --namespace kube-system tiller
kubectl create clusterrolebinding tiller-cluster-rule --clusterrole=cluster-admin --serviceaccount=kube-system:tiller
kubectl patch deploy --namespace kube-system tiller-deploy -p '{"spec":{"template":{"spec":{"serviceAccount":"tiller"}}}}'
```

tiller没有正确的角色权限导致。


ref：
```
https://ezmo.me/2017/09/24/helm-quick-toturial/
https://jimmysong.io/kubernetes-handbook/practice/helm.html
```







