---
layout: post
title: centos安装hadoop
date: 2018-07-23 19:05:00
---

1）如果系统已经安装java，通过以下方式设置java相关环境变量：

```
$ ls -lrt /usr/bin/java
lrwxrwxrwx. 1 root root 22 Mar 20 14:49 /usr/bin/java -> /etc/alternatives/java
$ ls -lrt  /etc/alternatives/java
lrwxrwxrwx. 1 root root 73 Mar 20 14:49 /etc/alternatives/java -> /usr/lib/jvm/java-1.8.0-openjdk-1.8.0.161-0.b14.el7_4.x86_64/jre/bin/java
```

设置java相关环境变量：

```
export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk-1.8.0.161-0.b14.el7_4.x86_64
export JRE_HOME=$JAVA_HOME/jre
export PATH=$JAVA_HOME/bin:$PATH
```

如果系统没有安装java，下载相应java安装，然后设置相应的java环境变量即可。

2）设置ssh免登录

```
$ ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa
$ cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
$ chmod 0600 ~/.ssh/authorized_keys
```

3）以伪分布式模式安装hadoop-2.7.6

从官方网站下载hadoop 2.7.6：https://mirrors.tuna.tsinghua.edu.cn/apache/hadoop/common/hadoop-2.7.6/hadoop-2.7.6.tar.gz

将hadoop-2.7.6.tar.gz拷贝到/usr/local，解压即可。然后设置相应的环境变量：

```
export HADOOP_HOME=/usr/local/hadoop-2.7.6
export PATH=$HADOOP_HOME/bin:$PATH
```

这里以伪分布式安装为例，进入/usr/local/hadoop-2.7.6/etc，依次修改以下配置文件：

- core-site.xml

```
<configuration>
    <property>
        <name>fs.defaultFS</name>
        <value>hdfs://localhost:9000</value>
    </property>
</configuration>
```

- hdfs-site.xml

```
<configuration>
    <property>
        <name>dfs.replication</name>
        <value>1</value>
    </property>
</configuration>
```

格式化文件系统：

```
$ hdfs namenode -format
```

启动hdfs:

```
$ /usr/local/hadoop-2.7.6/sbin/start-dfs.sh
```

在浏览器输入：`http://localhost:50070/`，可以看到NameNode相关信息。

4）运行示例程序

在HDFS上创建相应目录，并上传相应的文件到该目录：

```
$ cat log 
hello hadoop
hello hdfs
hello mapreduce
$ hdfs dfs -mkdir -p /user/root/input
$ hdfs dfs -put log input
$ hdfs dfs -ls /user/root/input
Found 1 items
-rw-r--r--   1 root supergroup         40 2018-07-23 06:33 /user/root/input/log
```

运行示例程序：

```
$ hadoop jar /usr/local/hadoop-2.7.6/share/hadoop/mapreduce/hadoop-mapreduce-examples-2.7.6.jar grep input output 'he[a-z.]+'
```

查看运行结果：

```
$ hdfs dfs -cat output/*
3   hello
```

### 参考：
https://hadoop.apache.org/docs/r2.7.6/hadoop-project-dist/hadoop-common/SingleCluster.html#Pseudo-Distributed_Operation