---
layout: post
title: windows安装redis
date: 2018-02-08 12:05:00
---


redis[官方网站](https://redis.io/download)专门说明了，redis官方不支持Windows平台，但是 Microsoft Open Tech开发并维护了一个Windows版的redis，如下：

```
The Redis project does not officially support Windows. However, the Microsoft Open Tech group develops and maintains this Windows port targeting Win64. Learn more
```

找到Microsoft Open Tech的[github](https://github.com/MicrosoftArchive/redis/releases)，下载redis安装包[Redis-x64-3.2.100.msi](https://github.com/MicrosoftArchive/redis/releases/download/win-3.2.100/Redis-x64-3.2.100.msi)，下载完毕后，运行安装程序，如果出错，一般是系统的 .NET Framework版本过低，更新[.NET Framework](https://www.microsoft.com/en-us/download/confirmation.aspx?id=30653)即可。我这里下载的是 .NET Framework 4.5，下载完毕，直接运行安装更新。更新完.NET Framework，再次运行redis安装程序。成功安装后，找到安装目录，运行redis-server.exe启动redis。

或者直接下载[redis的zip格式的安装包](https://github.com/MicrosoftArchive/redis/releases/download/win-3.2.100/Redis-x64-3.2.100.zip)，解压即可使用，不需安装。

下面是一些使用示例：

### 1 将redis注册成系统服务

将redis注册成Windows系统服务，让redis实现开机自启动。

```
C:\redis\Redis-x64-3.2.100>redis-server.exe --service-install "c:\redis\Redis-x64-3.2.100\redis.windows.conf" --loglevel verbose
[2568] 08 Feb 11:23:52.441 # Granting read/write access to 'NT AUTHORITY\NetworkService' on: "c:\redis\Redis-x64-3.2.100" "C:\redis\Redis-x64-3.2.100\"
[2568] 08 Feb 11:23:52.441 # Redis successfully installed as a service.
```

查询注册的redis服务，并启动redis服务：

```
C:\redis\Redis-x64-3.2.100>sc query redis

SERVICE_NAME: redis
        TYPE               : 10  WIN32_OWN_PROCESS
        STATE              : 1  STOPPED
        WIN32_EXIT_CODE    : 1077  (0x435)
        SERVICE_EXIT_CODE  : 0  (0x0)
        CHECKPOINT         : 0x0
        WAIT_HINT          : 0x0

C:\redis\Redis-x64-3.2.100>sc start redis

SERVICE_NAME: redis
        TYPE               : 10  WIN32_OWN_PROCESS
        STATE              : 2  START_PENDING
                                (NOT_STOPPABLE, NOT_PAUSABLE, IGNORES_SHUTDOWN)
        WIN32_EXIT_CODE    : 0  (0x0)
        SERVICE_EXIT_CODE  : 0  (0x0)
        CHECKPOINT         : 0x0
        WAIT_HINT          : 0x7d0
        PID                : 1392
        FLAGS              :

```

### 2 将redis绑定到指定IP

redis的配置文件中默认值绑定了环回地址（127.0.0.1），这样会导致非本机的客户端链接不上redis，需要将本机的IP绑定，比如这里绑定了IP：192.168.63.7，这样就可以从其他机器链接本机的redis。

```
bind 127.0.0.1 192.168.63.7
```
或者将bind配置注释，这样redis会监听本机所有的IP地址，但是这样做有安全风险，一般不推荐。

### 3 加入认证机制

如果需要添加认证机制，让经过认证的redis节点之间同步数据和经过认证的客户端链接redis，可以通过添加一下字段：

```
masterauth YOU_PASSWORD
requirepass YOU_PASSWORD
```
将YOU_PASSWORD更换成你的密码即可，这样没有密码的客户端就会被拒绝链接。

### 4 以特定的配置文件启动redis

启动redis时，可以指定特定的配置文件，例如：

```
C:\redis\Redis-x64-3.2.100>redis-server.exe "c:\redis\Redis-x64-3.2.100\redis.windows.conf"
```

这里按redis.windows.conf的配置信息启动redis。
