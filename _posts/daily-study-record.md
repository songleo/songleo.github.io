
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

## kustomize

不用维护多份yaml配置文件，比如，已经有一份v1的yaml，现在需要修改成v2，一般需要复制v1，然后修改成v2，就存在2份配置文件，这样维护多分配置文件不合理。应该通过类似diff和patch的机制，简化yaml配置文件。

```
~/someApp
├── base
│   ├── deployment.yaml
│   ├── kustomization.yaml
│   └── service.yaml
└── overlays
    ├── development
    │   ├── cpu_count.yaml
    │   ├── kustomization.yaml
    │   └── replica_count.yaml
    └── production
        ├── cpu_count.yaml
        ├── kustomization.yaml
        └── replica_count.yaml
```

- base：基础的配置文件
- overlays：用于存储不同的配置文件，需要和base部分存在一定diff，部署时结合base，生成不同的配置文件

安装：

```
$ OP_SYSTEM=linux
$ curl -s https://api.github.com/repos/kubernetes-sigs/kustomize/releases/latest | \
  grep browser_download | \
  grep ${OP_SYSTEM} | \
  cut -d '"' -f 4 | \
  xargs curl -O -L
$ mv kustomize_*_${OP_SYSTEM}_amd64 /usr/local/bin/kustomize
$ chmod u+x /usr/local/bin/kustomize
```

ref:
https://ellis-wu.github.io/2018/07/26/kustomize-introduction/

may-16

## push docker

## travis

may-17

## makefile




ref:
https://www.cnblogs.com/wanqieddy/archive/2011/09/21/2184257.html
docker build -f Dockerfile.install-cni -t istio-cni .
docker tag istio-cni songleo/istio-cni
docker push songleo/istio-cni
docker pull songleo/istio-cni

## travis 

提供的是持续集成服务。只要有新的代码，就会自动抓取。然后，提供一个运行环境，执行测试，完成构建，还能部署到服务器。对一些敏感的信息，提供文字加密后和文件加密功能。

code -> build -> integrate -> test -> deliver -> deploy

前4个阶段叫CI，持续集成
前5个阶段叫CD，继续发布
所有阶段叫CD，持续部署



关联travis和github。

.travis.yml语法：

language指定运行环境
script指定运行脚本，设置成true表示不运行，支持多个命令，如果一个命令失败，还会继续执行，但是构建结果是失败，支持&&操作符
sudo表示是否需要sudo权限
install用来指定安装脚本，支持多个命令，一个命令失败就停止，设置为true表示不需要安装
go/python/node_js用于指定特定语言的相关配置，比如版本信息、环境变量
env用于指定环境变量，脚本中可以使用这些环境变量，还可以在每个项目的页面中设置相应的环境变量，这些环境变量只有管理员可以看到
service用于指定需要依赖的服务
branches用于指定需要监听的分支
before_install用于install阶段之前执行，比如安装一些依赖，提前准备的环境
before_script用于script阶段之前执行
after_failure用于script阶段失败时执行
after_success用于script阶段成功时执行
before_deploy用于deploy步骤之前执行
after_deploy用于deploy步骤之后执行
after_script用于script阶段之后执行


完整的流程如下：
before_install -> install -> before_script -> script ->
after_failure|after_success -> before_deploy -> deploy ->
after_deploy -> after_script



ref:
http://www.ruanyifeng.com/blog/2017/12/travis_ci_tutorial.html
https://github.com/nukc/how-to-use-travis-ci

May 20, 2019


## dockerfile

FROM
支持变量


May 22, 2019

语法规则如下：

```
target:prerequisites
  command
```

target为需要生成的目标，prerequisites为依赖项，command为make需要执行的命令（任意的Shell命令），command前必须以tab键开始。也就是说，target这一个或多个的目标文件依赖于prerequisites中的文件，其生成规则定义在command中。prerequisites中如果有一个以上的文件比target文件要新的话，command所定义的命令就会被执行。这就是makefile的规则。也就是makefile中最核心的内容。

make命令将makefile中第一个出现的目标作为最终目标。

$$ 在makefile中表示$，引用变量时可以使用${VAR}或者$(VAR)。
使用shell的方式：

cur_dir=$(shell pwd)

或者在规则下面直接写，每行shell命令都是一个单独的进程，所以上一行的变量在下一行是无效的。所以最好写在一行。通过;或者\连接，否则变量就不能共享。

如果在命令前加上@符号，这不显示命令，只显示命令的执行结果。如果在命令前加上-，命令出错后make也会继续运行。


shell在target里面才能生效。

= 是最基本的赋值，会覆盖以前的赋值，以makefile中最后赋值为准
:= 是覆盖之前的值，但以当前赋值为准
?= 是如果没有被赋值过就赋予等号后面的值
+= 是添加等号后面的值

$@ 表示目标文件
$^ 表示所有的依赖文件
$< 表示第一个依赖文件
$? 表示比目标还要新的依赖文件列表


patsubst：

res=$(patsubst %.c,%.o,$(var) )

将变量$(var)中所有以.c结尾的字符串变成.o结尾

foo:=a.c b.c
bar=$(foo:%.c=%.o)

bar变成a.o b.o

faq:

make时makefile报下面错误：

```
/bin/sh: 1: Syntax error: word unexpected (expecting ")")
```

一般是因为shell类型不一致导致或者空格和tab的错误使用导致。
可以在makefile中添加SHELL := /bin/bash解决

ref:

https://blog.csdn.net/ruglcc/article/details/7814546
https://blog.csdn.net/K346K346/article/details/50222577


May 23, 2019


root@ibmz:/share/apps# docker run --rm golang go version
go version go1.12.5 linux/s390x
root@ibmz:/share/apps# docker pull golang
Using default tag: latest
latest: Pulling from library/golang
Digest: sha256:cf0b9f69ad1edd652a7f74a1586080b15bf6f688c545044407e28805066ef2cb
Status: Image is up to date for golang:latest

root@power:/share/apps# docker run --rm golang go version
go version go1.12.5 linux/ppc64le
root@power:/share/apps# docker pull golang
Using default tag: latest
latest: Pulling from library/golang
Digest: sha256:cf0b9f69ad1edd652a7f74a1586080b15bf6f688c545044407e28805066ef2cb
Status: Image is up to date for golang:latest

Digest是manifest文件的sha256sum
image id是所有层的文件的sha256sum，可以直接使用来下载镜像
layerid是docker的每个层的所有文件的sha256sum

docker的镜像主要由一组有序的层（创建容器后所有文件来之这些层）和配置参数构成，

ref:
https://yq.aliyun.com/articles/57752
