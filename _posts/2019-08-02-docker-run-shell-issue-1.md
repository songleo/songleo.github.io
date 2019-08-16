---
layout: post
title: docker运行shell脚本问题
date: 2019-08-02 20:04:01
---

这里有2个文件，分别是dockerfile和shell脚本，dockerfile的主要功能就是将shell脚本复制到容器中运行，shell脚本只有一个echo语句，表示脚本运行完毕。

```
$ cat Dockerfile
FROM alpine

COPY test.sh /test.sh

CMD ["/test.sh"]

$ cat test.sh
#!/bin/sh

echo "run test.sh done"

$ ./test.sh
run test.sh done

```

build镜像，然后运行容器：

```
$ docker build -t demo .
Sending build context to Docker daemon  3.072kB
Step 1/3 : FROM alpine
 ---> b7b28af77ffe
Step 2/3 : COPY test.sh /test.sh
 ---> Using cache
 ---> 789ef128fa38
Step 3/3 : CMD ["/test.sh"]
 ---> Using cache
 ---> a77d4f4b892e
Successfully built a77d4f4b892e
Successfully tagged demo:latest
$ docker run demo
run test.sh done
```

可以看到，容器启动后正常运行shell脚本，没有任何问题。下面我修改一下shell脚本，在顶部添加一句注释，然后再build镜像并运行容器：

```
$ cat Dockerfile
FROM alpine

COPY test.sh /test.sh

CMD ["/test.sh"]

$ cat test.sh
# this is comment

#!/bin/sh

echo "run test.sh done"

$ ./test.sh
run test.sh done
$ docker build -t demo .
Sending build context to Docker daemon  3.072kB
Step 1/3 : FROM alpine
 ---> b7b28af77ffe
Step 2/3 : COPY test.sh /test.sh
 ---> 9ba543d4ee3b
Step 3/3 : CMD ["/test.sh"]
 ---> Running in d011297358c4
Removing intermediate container d011297358c4
 ---> 436d81e71aee
Successfully built 436d81e71aee
Successfully tagged demo:latest
$ docker run demo
standard_init_linux.go:207: exec user process caused "exec format error"

```

这时候发现容器运行失败，打印了一个错误信息：`standard_init_linux.go:207: exec user process caused "exec format error"`，如果对docker比较熟悉的话，大概知道这句话原因一般都是因为平台不兼容导致，比如在amd64上面运行了一个arm程序，会打印这种错误。但是我们发现，这里并没有什么二进制文件，只有一个shell脚本。于是，我使用指定的cmd再次运行docker：

```
$ docker run -it demo sh
/ # ./test.sh
run test.sh done
/ #
```

发现脚本也能正常运行，到这里，大家应该能猜测到问题所在了，就是顶部的注释导致的。如果docker直接运行shell脚本，且脚本顶部不是正确的shebang的话，就会出现这种错误。这是最近工作中遇到的一个小问题，当时由于环境复杂，没有及时定位出原因。因为在顶部写了一些license信息导致这个问题，正确的使用方式如下：

```
$ cat Dockerfile
FROM alpine

COPY test.sh /test.sh

CMD ["/bin/sh", "-c", "/test.sh"]

$ cat test.sh
# this is comment

#!/bin/sh

echo "run test.sh done"

$ ./test.sh
run test.sh done
$ docker build -t demo .
Sending build context to Docker daemon  3.072kB
Step 1/3 : FROM alpine
 ---> b7b28af77ffe
Step 2/3 : COPY test.sh /test.sh
 ---> Using cache
 ---> 9ba543d4ee3b
Step 3/3 : CMD ["/bin/sh", "-c", "/test.sh"]
 ---> Using cache
 ---> 6d413aeb816a
Successfully built 6d413aeb816a
Successfully tagged demo:latest
$ docker run demo
run test.sh done

```

即在dockerfile中的cmd部分指定shell类型，或者将shebang写在顶部，这才是标准的写法。
