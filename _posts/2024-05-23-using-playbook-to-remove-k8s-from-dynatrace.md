---
layout: post
title: 使用playbook从dynatrace删除k8s集群
date: 2024-05-23 00:12:05
---

在删除被dynatrace监控的集群时，需要及时将集群从dynatrace删除，以免遇到下面错误：


```
Maximum number of monitored Kubernetes clusters reached. Please disable monitoring of some clusters.
```

playbook如下：

```
---
- name: Remove cluster from dynatrace
  hosts: localhost
  connection: local
  gather_facts: false
  vars:
    ansible_python_interpreter: "{{ ansible_playbook_python }}"
    excluded_labels:
      - cluster1
      - cluster2

  tasks:
    - name: List all kubernetes from dynatrace
      ansible.builtin.uri:
        url: https://{{ environment_id }}.live.dynatrace.com/api/v2/settings/objects?schemaIds=builtin%3Acloud.kubernetes&fields=objectId%2Cvalue&sort=created&pageSize=500
        method: GET
        headers:
          Authorization: Api-Token {{ rest_api_token }}
      register: cluster_list

    - name: Disable cluster monitoring from dynatrace
      ansible.builtin.uri:
        url: https://{{ environment_id }}.live.dynatrace.com/api/v2/settings/objects
        method: POST
        headers:
          Accept: "application/json; charset=utf-8"
          Content-Type: "application/json; charset=utf-8"
          Authorization: "Api-Token {{ rest_api_token }}"
        body_format: json
        body: |
          [
            {
              "schemaId": "builtin:cloud.kubernetes",
              "schemaVersion": "3.1",
              "value": {
                "enabled": false,
                "label": "{{ item.value.label }}",
                "clusterIdEnabled": true,
                "clusterId": "{{ item.value.clusterId }}"
              }
            }
          ]
      loop: "{{ cluster_list['json']['items'] }}"
      when: item.value.label not in excluded_labels
      register: post_response
      changed_when: post_response.status == 200

    - name: Delete cluster object from dynatrace
      ansible.builtin.uri:
        url: https://{{ environment_id }}.live.dynatrace.com/api/v2/settings/objects/{{ item.objectId }}
        method: DELETE
        status_code:
          - 204
        headers:
          Accept: "application/json; charset=utf-8"
          Content-Type: "application/json; charset=utf-8"
          Authorization: "Api-Token {{ rest_api_token }}"
      loop: "{{ cluster_list['json']['items'] }}"
      when: item.value.label not in excluded_labels
      register: delete_response
      changed_when: delete_response.status == 204
```
