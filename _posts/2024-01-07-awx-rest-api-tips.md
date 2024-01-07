---
layout: post
title: awx rest api tips
date: 2024-01-07 00:12:05
---

- 查看api版本信息

```
$ curl -s $CONTROLLER_HOST/api/ | jq .
{
  "description": "AWX REST API",
  "current_version": "/awx/api/v2/",
  "available_versions": {
    "v2": "/awx/api/v2/"
  },
  "oauth2": "/awx/api/o/",
  "custom_logo": "",
  "custom_login_info": "",
  "login_redirect_override": ""
}
```

- 所有可用api

```
$ curl -s $CONTROLLER_HOST/api/v2/ | jq .
{
  "ping": "/awx/api/v2/ping/",
  "instances": "/awx/api/v2/instances/",
  "instance_groups": "/awx/api/v2/instance_groups/",
  "config": "/awx/api/v2/config/",
  "settings": "/awx/api/v2/settings/",
  "me": "/awx/api/v2/me/",
  "dashboard": "/awx/api/v2/dashboard/",
  "organizations": "/awx/api/v2/organizations/",
  "users": "/awx/api/v2/users/",
  "execution_environments": "/awx/api/v2/execution_environments/",
  "projects": "/awx/api/v2/projects/",
  "project_updates": "/awx/api/v2/project_updates/",
  "teams": "/awx/api/v2/teams/",
  "credentials": "/awx/api/v2/credentials/",
  "credential_types": "/awx/api/v2/credential_types/",
  "credential_input_sources": "/awx/api/v2/credential_input_sources/",
  "applications": "/awx/api/v2/applications/",
  "tokens": "/awx/api/v2/tokens/",
  "metrics": "/awx/api/v2/metrics/",
  "inventory": "/awx/api/v2/inventories/",
  "constructed_inventory": "/awx/api/v2/constructed_inventories/",
  "inventory_sources": "/awx/api/v2/inventory_sources/",
  "inventory_updates": "/awx/api/v2/inventory_updates/",
  "groups": "/awx/api/v2/groups/",
  "hosts": "/awx/api/v2/hosts/",
  "host_metrics": "/awx/api/v2/host_metrics/",
  "host_metric_summary_monthly": "/awx/api/v2/host_metric_summary_monthly/",
  "job_templates": "/awx/api/v2/job_templates/",
  "jobs": "/awx/api/v2/jobs/",
  "ad_hoc_commands": "/awx/api/v2/ad_hoc_commands/",
  "system_job_templates": "/awx/api/v2/system_job_templates/",
  "system_jobs": "/awx/api/v2/system_jobs/",
  "schedules": "/awx/api/v2/schedules/",
  "roles": "/awx/api/v2/roles/",
  "notification_templates": "/awx/api/v2/notification_templates/",
  "notifications": "/awx/api/v2/notifications/",
  "labels": "/awx/api/v2/labels/",
  "unified_job_templates": "/awx/api/v2/unified_job_templates/",
  "unified_jobs": "/awx/api/v2/unified_jobs/",
  "activity_stream": "/awx/api/v2/activity_stream/",
  "workflow_job_templates": "/awx/api/v2/workflow_job_templates/",
  "workflow_jobs": "/awx/api/v2/workflow_jobs/",
  "workflow_approvals": "/awx/api/v2/workflow_approvals/",
  "workflow_job_template_nodes": "/awx/api/v2/workflow_job_template_nodes/",
  "workflow_job_nodes": "/awx/api/v2/workflow_job_nodes/",
  "mesh_visualizer": "/awx/api/v2/mesh_visualizer/",
  "bulk": "/awx/api/v2/bulk/",
  "analytics": "/awx/api/v2/analytics/"
}
```

- 查看awx系统状态

```
curl -s $CONTROLLER_HOST/api/v2/ping/ | jq .
```

- 查看作业列表

```
curl -u admin:admin $CONTROLLER_HOST/api/v2/jobs/
```

- 启动作业

```
curl -u admin:admin $CONTROLLER_HOST/api/v2/job_templates/{id}/launch/
```

- 查看某个作业信息

```
curl -u admin:admin $CONTROLLER_HOST/api/v2/jobs/5/
```

- 查看某个作业输出

```
curl -u admin:admin $CONTROLLER_HOST/api/v2/jobs/5/stdout/?format=txt
```

- 同步项目

```
curl -u admin:admin $CONTROLLER_HOST/api/v2/projects/{id}/update/
```
