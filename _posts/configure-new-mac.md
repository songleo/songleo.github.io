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


## tool list

- dash
- youdaodict
- chrome
- iterm
- sublime
- wechat
- slack
- docker