

### 1 命令设置

```
# echo "source <(kubectl completion bash)" >> ~/.bashrc
# source ~/.bashrc
```

### 2 安装kube-prompt

### 2.1 linux

```
# wget https://github.com/c-bata/kube-prompt/releases/download/v1.0.3/kube-prompt_v1.0.3_linux_amd64.zip
# unzip kube-prompt_v1.0.3_linux_amd64.zip
```

### 2.2 macos (darwin)

```
# wget https://github.com/c-bata/kube-prompt/releases/download/v1.0.3/kube-prompt_v1.0.3_darwin_amd64.zip
# unzip kube-prompt_v1.0.3_darwin_amd64.zip
```

安装后运行效果如下：

```
# chmod +x kube-prompt
# sudo mv ./kube-prompt /usr/local/bin/kube-prompt

# kube-prompt
kube-prompt v1.0.3 (rev-ba1a338)
Please use `exit` or `Ctrl-D` to exit this program..
>>>
```

设置iterm2一键登录。

```
brew install https://raw.githubusercontent.com/kadwanev/bigboybrew/master/Library/Formula/sshpass.rb

/usr/local/bin/sshpass -f "/Users/ssli/Box Sync/iterm2/ssh_passwd/icp-env" ssh -p 22 root@9.30.100.245
```


sshpass https://linux.cn/article-8086-1.html