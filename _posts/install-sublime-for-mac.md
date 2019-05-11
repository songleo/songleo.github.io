
手动下载[Package Control.sublime-package](https://packagecontrol.io/Package%20Control.sublime-package)到本地，Preferences -> Browse Packages，找到移本地包安装目录`Installed Packages/`，将下载的文件复制到该目录，重启sublime即可。

mac安装sublime时，报错：`There are no packages available for installation`

解决办法：

```
Preferences -> Package Settings -> Package Control -> Settings - User
```

添加以下内容：

```
{
"channels":
    [
        "https://packagecontrol.io/channel_v3.json",
        "http://cst.stu.126.net/u/json/cms/channel_v3.json",
        "https://web.archive.org/web/20150905194312/https://packagecontrol.io/channel_v3.json"
    ]
}
```
