---
layout: post
title: go技巧分享（一）
date: 2018-05-09 00:05:00
---

这是一个系列文章，主要分享go的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 命令行查看文档

```
$ go doc strings.Trim
func Trim(s string, cutset string) string
    Trim returns a slice of the string s with all leading and trailing Unicode
    code points contained in cutset removed.

$ go doc os.Exit
func Exit(code int)
    Exit causes the current program to exit with the given status code.
    Conventionally, code zero indicates success, non-zero an error. The program
    terminates immediately; deferred functions are not run.

```

go doc命令会从go代码中提取顶级声明的首行注释以及每个对象的相关注释，并生成相应文档，通过go doc命令，可以很方便查看go语言相关API的文档信息，例如示例中查看了strings.Trim和os.Exit的文档信息。

使用示例如下：

- go doc package：获取包的文档信息
- go doc package/subpackage：获取子包的文档信息
- go doc package.function：获取包中函数的文档信息

或者通过godoc，可以生成web版的文档信息，在命令行输入godoc -http=:6060，然后使用浏览器打开[http://localhost:6060](http://localhost:6060)，就可以看到web版的文档信息。

### 2 检测代码错误

示例代码demo.go如下：

```go
package main

import "fmt"

func Func(num int) {
    fmt.Printf("call Func\n")
    fmt.Printf("num = %s\n", num)
    fmt.Printf("num = %d\n", 1, 2, 3)
}

func main() {
    Func(1)
}
```

使用vet工具检测代码：

```
$ go build demo.go
$ go tool vet demo.go
demo.go:7: arg num for printf verb %s of wrong type: int
demo.go:8: wrong number of args for format in Printf call: 1 needed but 3 args
```

通过go tool vet工具，可以检测到go代码中一些可疑的结构，虽然vet不确保发现的问题都是真正的错误，但是它可以发现一些编译器无法捕获到的错误。例如示例中，这段代码能正常的编译通过，但是通过vet检测出2个问题，第一个问题是打印的格式与参数类型不匹配，第二个问题需要打印的参数和所给参数数量不一致。

### 3 编译时传递参数

示例代码demo.go如下：

```go
package main

import "fmt"

var BuildDate = "no build date"

func main() {
    fmt.Printf("build date: %s\n", BuildDate)
}
```

传递参数步骤：

```
$ go build demo.go
$ ./demo
build date: no build date
$ DATE=`date '+%Y-%m-%d-%I:%M:%S'`
$ go build -ldflags "-X main.BuildDate=$DATE" demo.go
$ ./demo
build date: 2018-05-03-03:15:35
```

通过-X选项，可以给go程序传递相关参数。例如示例中，借助-X选项，将编译时间BuildDate实时传递到程序中，另外，如版本信息之类也可以通过该方式实现。



