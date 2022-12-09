


## demystifying ansible automation platform












## ansible

ansible：免费使用
ansible tower：带ui的ansible，不需要熟悉ansible cli就可以使用ansible，更易用和集中管理


## red hat ansible automation platform

- ansible core：ansible核心模块，以前叫ansible engine，可以理解成搜身版的ansible engine
- automation controller：扩展版的ansible tower，带ui的ansible，上游项目是awx，aap核心
- automation execution environments：替代ansible engine，提供一个一致环境，在容器中运行playbook，确保在本地和controller中playbook的运行环境一致
- automation mesh
- ansible content collections：一些module和role，有社区版（galaxy.ansible.com）和认证版collection
- automation hub：提供受支持和认证的collection和role，annsible galaxy的本地部署
  - 提供collection和image
  - 受支持和认证的、社区的（annsible galaxy）以及私有的collection
  - 上游项目是galaxy_ng
- ansible content tools：构建automation execution environments，运行playbook
  - ansible-builder：构建执行环境
  - ansible-navigator：在执行环境中运行playbook，https://access.redhat.com/articles/6192641
  - ansible-lint
- automation analytics and red hat insights for ansible automation platform：提供aap的指标数据，方便分析性能和开销， https://console.redhat.com/ansible/ansible-dashboard.
- automation services catalog：https://www.youtube.com/watch?v=Ry_ZW78XYc0.


## ref

- https://www.redhat.com/en/resources/ansible-automation-platform-datasheet
- https://www.rogerperkin.co.uk/network-automation/ansible/ansible-tower-vs-ansible-automation-platform/
- https://www.ansible.com/products/awx-project/faq
- https://www.redhat.com/en/technologies/management/ansible/ansible-vs-red-hat-ansible-automation-platform
