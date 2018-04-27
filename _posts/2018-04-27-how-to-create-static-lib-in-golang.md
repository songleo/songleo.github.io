---
layout: post
title: go语言静态库制作和使用
date: 2018-04-27 22:30:00
---

本文主要介绍go语言静态库的制作和使用方法，以windows平台为例，linux平台步骤一样，具体环境如下：

```
>echo %GOPATH%
E:\share\git\go_practice\

>echo %GOROOT%
C:\Go\

>tree /F %GOPATH%\src
卷 work 的文件夹 PATH 列表
卷序列号为 0009-D8C8
E:\SHARE\GIT\GO_PRACTICE\SRC
│  main.go
│
└─demo
        demo.go

```

在GOPATH下的src目录，有demo包和使用demo包的应用程序main.go，main.go代码如下：

```go
package main

import "demo"

func main() {
    demo.Demo()
}
```

demo包中的demo.go代码如下：

```go
package demo

import "fmt"

func Demo() {
    fmt.Println("call demo ...")
}
```

由于demo.go是在GOPATH\src目录下的一个包，main.go在import该包后，可以直接使用，运行main.go：

```
>go run main.go
call demo ...
```

现在，需要将demo.go编译成静态库demo.a，不提供demo.go的源代码，让main.go也能正常编译运行，详细步骤如下：

### 1 编译静态库demo.a

```
>go install demo
```

在命令行运行go install demo命令，会在GOPATH目录下生相应的静态库文件demo.a（windows平台一般在GOPATH\pkg\windows_amd64目录）。

### 2 编译main.go

进入main.go所在目录，编译main.go。

```
>go tool compile -I E:\share\git\go_practice\pkg\win
dows_amd64 main.go
```

-I选项指定了demo包安装的路径，供main.go导入使用，即E:\share\git\go_practice\pkg\win
dows_amd64目录，编译成功后会生成相应的main.go文件。

### 3 链接main.o

```
>go tool link -o main.exe -L E:\share\git\go_practice\pkg\windows_amd64 main.o
```

-L选项指定了静态库demo.a所在路径，即E:\share\git\go_practice\pkg\win
dows_amd64目录，链接成功后生成相应的main.exe。

### 4 运行main.exe

```
>main.exe
call demo ...
```

现在，就算把demo目录删除，再次编译链接main.go，也能正确生成main.exe:

```
>go tool compile -I E:\share\git\go_practice\pkg\win
dows_amd64 main.go

>go tool link -o main.exe -L E:\share\git\go_practic
e\pkg\windows_amd64 main.o

>main.exe
call demo ...
```

但是，如果删除了静态库demo.a，就不能编译链接main.go了，如下：

```
>go tool compile -I E:\share\git\go_practice\pkg\win
dows_amd64 main.go
main.go:3: can't find import: "demo"
```

这就是go语言静态库的制作和使用方式，下次介绍动态库的制作和使用方式。