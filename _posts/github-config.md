ssh-keygen -t rsa -b 4096 -C "soli@redhat.com"
cat ~/.ssh/id_rsa.pub
git config --global user.email "soli@redhat.com"
git config --global user.name "Song Song Li"
