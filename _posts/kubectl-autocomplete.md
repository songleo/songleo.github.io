

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