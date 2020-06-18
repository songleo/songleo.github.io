## install tool from cmd

```
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

brew install wget

wget https://dl.google.com/go/go1.14.2.darwin-amd64.tar.gz

sudo tar -C /usr/local -xzf go1.14.2.darwin-amd64.tar.gz

curl -Lo ./kind https://github.com/kubernetes-sigs/kind/releases/download/v0.7.0/kind-$(uname)-amd64
chmod +x ./kind
mv kind /usr/local/bin

curl -LO "https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/darwin/amd64/kubectl"
chmod +x ./kubectl
mv kubectl /usr/local/bin


$ pwd
/Users/ssli
$ cat .bash_profile
source /Users/ssli/share/git/bashrc/my_bashrc.sh

$ chmod 400 soli-aws-ec2.pem


wget -O /usr/local/bin/jq https://github.com/stedolan/jq/releases/download/jq-1.6/jq-osx-amd64 && chmod +x /usr/local/bin/jq

wget https://mirror.openshift.com/pub/openshift-v4/x86_64/clients/ocp-dev-preview/latest-4.4/openshift-client-mac.tar.gz

tar -xzf openshift-client-mac.tar.gz
mv kubectl oc /usr/local/bin/

xcode-select --install

brew install helm

cp -rf ~/share/aws/soli-acmcluster01/auth/kubeconfig ~/.kube/config

## install tools
https://github.com/mikefarah/yq/releases/download/2.1.1/yq_darwin_amd64
http://storage.googleapis.com/kubernetes-helm/helm-v2.13.1-darwin-amd64.tar.gz

brew cask install chromedriver
sudo go get -u github.com/onsi/ginkgo/ginkgo

brew install bash

sudo vim /etc/shells
# add this line
/usr/local/bin/bash


curl -sfL https://raw.githubusercontent.com/securego/gosec/master/install.sh | sh -s v2.2.0

brew install minio/stable/mc

brew install https://raw.githubusercontent.com/kadwanev/bigboybrew/master/Library/Formula/sshpass.rb

ssh-keygen -t rsa -b 4096 -C "ssli@redhat.com"
cat ~/.ssh/id_rsa.pub
git config --global user.email "ssli@redhat.com"
git config --global user.name "Song Song Li"
git config --global color.ui auto
git config --global --add url."git@github.com:".insteadOf "https://github.com/"

wget https://mirror.openshift.com/pub/openshift-v4/x86_64/clients/ocp/stable-4.4/openshift-install-mac.tar.gz


curl -L https://github.com/operator-framework/operator-sdk/releases/download/v0.16.0/operator-sdk-v0.16.0-x86_64-apple-darwin -o operator-sdk && chmod a+x operator-sdk && mv operator-sdk /usr/local/bin/

go get golang.org/x/tools/cmd/goimports

brew install bash-completion

brew install tree

brew install github/gh/gh
```

## tool list

- dash
- youdaodict
- chrome
- iterm
	- 设置顶层显示：keys -> configure hotkey window -> floating window
- sublime
	- auto-save: 需要打开自动保存功能
	- filediffs
	- git
	- gitgutter
	- gofmt (go get golang.org/x/tools/cmd/goimports)
	- golang build
	- markdownlivepreview
	- package control
	- sidebarenhancements
	- terminalprojectfolder
	- terminalview
	```
	[{ "keys": ["ctrl+alt+t"], "command": "terminal_view_open" }]
	```
	- 取消自动删除tab：defaults write com.googlecode.iterm2 AboutToPasteTabsWithCancel 0
- wechat
- slack
- docker
- bluejeans
- vscode
	- go
- alfred：设置只搜索share目录下文件
- aws cli: https://aws.amazon.com/cli/
