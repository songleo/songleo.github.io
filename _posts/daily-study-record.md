# 05-13

## kubernetes api扩展学习

crd定义，需要描述资源的组、版本、资源类型、资源的作用范围（namespace和cluster级别）。

kubernetes目前只支持2中方式扩展api：

- crd：简单且和kubernetes高度集成，适用于声明式api，它的controller是单独运行，通过client-go和api server交互，而内置的controller统一由kube-controller管理，类似外挂和内置的关系

- api aggregation：独立的api server，由主api server委托该独立的api server处理自定义的资源，更加灵活，但是不支持kubectl，和kubernetes不够统一，适用于命令模式

声明式api:
kubectl apply命令（声明式请求），可以实现多个客户端同时写一个api对象，借助类似git merge的功能，kubernetes自动merge对api对象的修改，实现一种类似patch的操作，如果出现merge冲突，才需要人为干扰。如果使用replace之类的命令式请求，就不能实现多个客户端同时写一个api对象（api server实现）。

yaml配置文件，用于描述api对象的期望状态。


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
