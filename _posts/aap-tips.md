
## ansible

ansible：免费使用
ansible tower：带ui的ansible，不需要熟悉ansible cli就可以使用ansible，更易用和集中管理


## red hat ansible automation platform

- ansible core：ansible核心模块，以前叫ansible engine，可以理解成搜身版的ansible engine
- automation controller：扩展版的ansible tower，带ui的ansible，上游项目是awx
- automation execution environments：替代ansible engine，提供一个一致环境，在容器中运行playbook
- automation mesh
- ansible content collections：一些module和role，有社区版（galaxy.ansible.com）和认证版collection
- automation hub：下载受支持和认证的collection，社区版是annsible galaxy
- ansible content tools：构建automation execution environments，运行playbook
  - ansible-builder
  - ansible-navigator：https://access.redhat.com/articles/6192641
  - ansible-lint
- automation analytics and red hat insights for ansible automation platform
- automation services catalog

awx -> ansible tower -> ansible automation controller
annsible galaxy -> ansible automation hub


## ref

- https://www.redhat.com/en/resources/ansible-automation-platform-datasheet
- https://www.rogerperkin.co.uk/network-automation/ansible/ansible-tower-vs-ansible-automation-platform/
- https://www.ansible.com/products/awx-project/faq
- https://www.redhat.com/en/technologies/management/ansible/ansible-vs-red-hat-ansible-automation-platform
