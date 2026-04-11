# OpenFuyao智算系统方案面试准备

## 1. 智算平台整体架构

### 1.1 什么是智算平台？核心组件有哪些？

**回答要点：**

智算平台（AI Computing Platform）是为AI训练和推理提供统一资源管理、调度和运维的基础设施平台。

**核心组件：**

1. **资源层**
   - GPU集群：NVIDIA A100/H100/H800
   - 网络：RoCE/InfiniBand高速互联
   - 存储：分布式文件系统(Lustre/GPFS)、对象存储

2. **调度层**
   - Kubernetes集群管理
   - GPU调度器(Volcano/Kueue)
   - 多集群管理(Karmada)

3. **框架层**
   - 训练框架：PyTorch、TensorFlow、Megatron-LM
   - 推理框架：vLLM、TGI、Triton
   - 分布式通信：NCCL、RDMA

4. **平台层**
   - 任务管理和编排
   - 资源配额和计费
   - 监控告警
   - 数据管理

5. **应用层**
   - 模型训练任务
   - 在线推理服务
   - 模型管理和版本控制

**架构图：**

```
┌─────────────────────────────────────────────────────────────┐
│                        应用层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  模型训练    │  │  模型推理    │  │  模型管理    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                        平台层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  任务编排    │  │  资源管理    │  │  监控运维    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                        框架层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PyTorch     │  │  vLLM        │  │  NCCL        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                        调度层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Kubernetes  │  │  Volcano     │  │  Karmada     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                        资源层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  GPU集群     │  │  高速网络    │  │  分布式存储  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 OpenFuyao平台的特点是什么？

**回答要点：**

OpenFuyao是一个开源的智算平台解决方案，特点包括：

1. **统一资源管理**
   - 多集群统一视图
   - GPU资源池化
   - 弹性扩缩容

2. **智能调度**
   - Gang Scheduling保证分布式训练
   - GPU亲和性调度
   - 优先级和抢占

3. **全生命周期管理**
   - 数据准备
   - 模型训练
   - 模型评估
   - 模型部署

4. **高可用性**
   - 任务自动恢复
   - Checkpoint管理
   - 故障检测和迁移

5. **可观测性**
   - GPU利用率监控
   - 训练指标跟踪
   - 成本分析

## 2. 资源管理和调度

### 2.1 如何设计GPU资源池化方案？

**回答要点：**

GPU资源池化让GPU资源可以在多个任务间灵活分配，提高利用率。

**设计方案：**

```yaml
# GPU资源池定义
apiVersion: v1
kind: ConfigMap
metadata:
  name: gpu-resource-pool
data:
  pools.yaml: |
    pools:
      - name: training-pool
        description: "用于模型训练的GPU池"
        gpu_type: "A100-80G"
        total_gpus: 128
        reserved_gpus: 8  # 预留给紧急任务
        quotas:
          - namespace: "ml-team-1"
            max_gpus: 32
            priority: 1
          - namespace: "ml-team-2"
            max_gpus: 48
            priority: 2
        
      - name: inference-pool
        description: "用于模型推理的GPU池"
        gpu_type: "A100-40G"
        total_gpus: 64
        sharing_strategy: "mig"  # 使用MIG切分
        quotas:
          - namespace: "inference-prod"
            max_gpus: 48
            priority: 1
          - namespace: "inference-test"
            max_gpus: 16
            priority: 3
```

**实现GPU Pool Controller：**

```python
from kubernetes import client, config
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class GPUPool:
    """GPU资源池"""
    def __init__(self, name: str, gpu_type: str, total_gpus: int):
        self.name = name
        self.gpu_type = gpu_type
        self.total_gpus = total_gpus
        self.allocated_gpus = {}  # namespace -> gpu_count
        self.reserved_gpus = 0
    
    def allocate(self, namespace: str, requested_gpus: int) -> bool:
        """分配GPU"""
        current_allocated = sum(self.allocated_gpus.values())
        available = self.total_gpus - current_allocated - self.reserved_gpus
        
        if requested_gpus <= available:
            self.allocated_gpus[namespace] = \
                self.allocated_gpus.get(namespace, 0) + requested_gpus
            logger.info(f"Allocated {requested_gpus} GPUs to {namespace}")
            return True
        else:
            logger.warning(f"Insufficient GPUs in pool {self.name}")
            return False
    
    def release(self, namespace: str, gpus: int):
        """释放GPU"""
        if namespace in self.allocated_gpus:
            self.allocated_gpus[namespace] -= gpus
            if self.allocated_gpus[namespace] <= 0:
                del self.allocated_gpus[namespace]
    
    def get_utilization(self) -> Dict:
        """获取利用率"""
        allocated = sum(self.allocated_gpus.values())
        return {
            "total": self.total_gpus,
            "allocated": allocated,
            "available": self.total_gpus - allocated - self.reserved_gpus,
            "utilization": allocated / self.total_gpus if self.total_gpus > 0 else 0
        }


class GPUPoolManager:
    """GPU资源池管理器"""
    
    def __init__(self):
        self.pools: Dict[str, GPUPool] = {}
        config.load_kube_config()
        self.v1 = client.CoreV1Api()
        self.custom_api = client.CustomObjectsApi()
    
    def create_pool(self, pool_config: Dict):
        """创建资源池"""
        pool = GPUPool(
            name=pool_config['name'],
            gpu_type=pool_config['gpu_type'],
            total_gpus=pool_config['total_gpus']
        )
        pool.reserved_gpus = pool_config.get('reserved_gpus', 0)
        self.pools[pool.name] = pool
        logger.info(f"Created GPU pool: {pool.name}")
    
    def schedule_workload(self, workload: Dict) -> bool:
        """为workload调度GPU"""
        namespace = workload['metadata']['namespace']
        requested_gpus = self._get_requested_gpus(workload)
        pool_name = workload['spec'].get('poolName', 'training-pool')
        
        if pool_name not in self.pools:
            logger.error(f"Pool {pool_name} not found")
            return False
        
        pool = self.pools[pool_name]
        
        # 检查配额
        if not self._check_quota(namespace, pool_name, requested_gpus):
            logger.warning(f"Quota exceeded for {namespace}")
            return False
        
        # 分配GPU
        if pool.allocate(namespace, requested_gpus):
            self._update_workload_status(workload, "Scheduled", pool_name)
            return True
        else:
            self._update_workload_status(workload, "Pending", pool_name)
            return False
    
    def _get_requested_gpus(self, workload: Dict) -> int:
        """获取请求的GPU数量"""
        replicas = workload['spec'].get('replicas', 1)
        gpus_per_replica = workload['spec']['template']['spec']['containers'][0]\
            .get('resources', {}).get('limits', {}).get('nvidia.com/gpu', 0)
        return replicas * int(gpus_per_replica)
    
    def _check_quota(self, namespace: str, pool_name: str, requested_gpus: int) -> bool:
        """检查配额"""
        # 从ResourceQuota中读取配额限制
        try:
            quota = self.v1.read_namespaced_resource_quota(
                name=f"gpu-quota-{pool_name}",
                namespace=namespace
            )
            
            hard_limit = int(quota.status.hard.get('requests.nvidia.com/gpu', 0))
            used = int(quota.status.used.get('requests.nvidia.com/gpu', 0))
            
            return (used + requested_gpus) <= hard_limit
        except client.exceptions.ApiException:
            # 如果没有配额限制，允许调度
            return True
    
    def _update_workload_status(self, workload: Dict, status: str, pool: str):
        """更新workload状态"""
        # 更新CRD状态
        pass
    
    def get_pool_stats(self) -> List[Dict]:
        """获取所有资源池统计"""
        return [
            {
                "name": pool.name,
                "gpu_type": pool.gpu_type,
                **pool.get_utilization()
            }
            for pool in self.pools.values()
        ]


# 使用示例
manager = GPUPoolManager()

# 创建资源池
manager.create_pool({
    "name": "training-pool",
    "gpu_type": "A100-80G",
    "total_gpus": 128,
    "reserved_gpus": 8
})

# 获取统计
stats = manager.get_pool_stats()
for stat in stats:
    print(f"Pool: {stat['name']}, Utilization: {stat['utilization']:.2%}")
```

### 2.2 如何实现多租户资源隔离？

**回答要点：**

多租户隔离需要在多个层面实现：

1. **Namespace隔离**
2. **ResourceQuota限制**
3. **NetworkPolicy网络隔离**
4. **PodSecurityPolicy安全策略**

**完整实现：**

```yaml
# 1. 创建租户命名空间
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-ml-team-1
  labels:
    tenant: ml-team-1
    tier: training

---
# 2. 资源配额
apiVersion: v1
kind: ResourceQuota
metadata:
  name: gpu-quota
  namespace: tenant-ml-team-1
spec:
  hard:
    requests.nvidia.com/gpu: "32"
    limits.nvidia.com/gpu: "32"
    requests.cpu: "512"
    requests.memory: "2Ti"
    persistentvolumeclaims: "50"

---
# 3. LimitRange - 限制单个Pod资源
apiVersion: v1
kind: LimitRange
metadata:
  name: resource-limits
  namespace: tenant-ml-team-1
spec:
  limits:
    - max:
        nvidia.com/gpu: "8"  # 单个Pod最多8卡
        memory: "500Gi"
        cpu: "128"
      type: Pod
    - max:
        nvidia.com/gpu: "8"
        memory: "500Gi"
        cpu: "128"
      type: Container

---
# 4. NetworkPolicy - 网络隔离
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-isolation
  namespace: tenant-ml-team-1
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # 只允许同namespace内的Pod访问
    - from:
      - podSelector: {}
  egress:
    # 允许访问DNS和外部服务
    - to:
      - namespaceSelector: {}
      ports:
      - protocol: UDP
        port: 53
    # 允许访问存储和监控
    - to:
      - namespaceSelector:
          matchLabels:
            name: storage
      - namespaceSelector:
          matchLabels:
            name: monitoring

---
# 5. PriorityClass - 优先级
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: ml-team-1-high-priority
value: 1000
globalDefault: false
description: "High priority for ml-team-1 production workloads"

---
# 6. 租户训练任务模板
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: training-job
  namespace: tenant-ml-team-1
spec:
  minAvailable: 4
  schedulerName: volcano
  priorityClassName: ml-team-1-high-priority
  
  queue: ml-team-1-queue  # 绑定到租户队列
  
  plugins:
    svc: []
    env: []
  
  tasks:
    - replicas: 4
      name: worker
      template:
        spec:
          restartPolicy: OnFailure
          
          # 亲和性：尽量调度到同一节点或rack
          affinity:
            podAntiAffinity:
              preferredDuringSchedulingIgnoredDuringExecution:
                - weight: 100
                  podAffinityTerm:
                    labelSelector:
                      matchExpressions:
                        - key: app
                          operator: In
                          values:
                            - training-job
                    topologyKey: kubernetes.io/hostname
          
          containers:
            - name: trainer
              image: pytorch/pytorch:2.0.0-cuda11.8-cudnn8-runtime
              
              resources:
                limits:
                  nvidia.com/gpu: 8
                  memory: 400Gi
                  cpu: 96
                requests:
                  nvidia.com/gpu: 8
                  memory: 400Gi
                  cpu: 96
              
              env:
                - name: NCCL_DEBUG
                  value: "INFO"
                - name: NCCL_IB_DISABLE
                  value: "0"
              
              volumeMounts:
                - name: data
                  mountPath: /data
                - name: workspace
                  mountPath: /workspace
                - name: shm
                  mountPath: /dev/shm
          
          volumes:
            - name: data
              persistentVolumeClaim:
                claimName: ml-team-1-data-pvc
            - name: workspace
              persistentVolumeClaim:
                claimName: ml-team-1-workspace-pvc
            - name: shm
              emptyDir:
                medium: Memory
                sizeLimit: 32Gi
```

**租户管理脚本：**

```python
#!/usr/bin/env python3
"""
租户管理工具
"""
import yaml
from kubernetes import client, config
from typing import Dict, List

class TenantManager:
    """租户管理器"""
    
    def __init__(self):
        config.load_kube_config()
        self.v1 = client.CoreV1Api()
        self.rbac_v1 = client.RbacAuthorizationV1Api()
        self.custom_api = client.CustomObjectsApi()
    
    def create_tenant(self, tenant_config: Dict):
        """创建租户"""
        tenant_name = tenant_config['name']
        namespace = f"tenant-{tenant_name}"
        
        # 1. 创建Namespace
        self._create_namespace(namespace, tenant_config)
        
        # 2. 创建ResourceQuota
        self._create_resource_quota(namespace, tenant_config['quota'])
        
        # 3. 创建LimitRange
        self._create_limit_range(namespace, tenant_config['limits'])
        
        # 4. 创建NetworkPolicy
        self._create_network_policy(namespace)
        
        # 5. 创建Volcano Queue
        self._create_volcano_queue(namespace, tenant_config)
        
        # 6. 创建RBAC
        self._create_rbac(namespace, tenant_config['users'])
        
        print(f"Tenant {tenant_name} created successfully")
    
    def _create_namespace(self, namespace: str, config: Dict):
        """创建命名空间"""
        ns = client.V1Namespace(
            metadata=client.V1ObjectMeta(
                name=namespace,
                labels={
                    "tenant": config['name'],
                    "tier": config.get('tier', 'training')
                }
            )
        )
        try:
            self.v1.create_namespace(ns)
        except client.exceptions.ApiException as e:
            if e.status != 409:  # Ignore if already exists
                raise
    
    def _create_resource_quota(self, namespace: str, quota: Dict):
        """创建资源配额"""
        quota_obj = client.V1ResourceQuota(
            metadata=client.V1ObjectMeta(name="gpu-quota"),
            spec=client.V1ResourceQuotaSpec(
                hard={
                    "requests.nvidia.com/gpu": str(quota['gpu']),
                    "limits.nvidia.com/gpu": str(quota['gpu']),
                    "requests.cpu": str(quota['cpu']),
                    "requests.memory": quota['memory'],
                }
            )
        )
        try:
            self.v1.create_namespaced_resource_quota(namespace, quota_obj)
        except client.exceptions.ApiException as e:
            if e.status != 409:
                raise
    
    def _create_limit_range(self, namespace: str, limits: Dict):
        """创建LimitRange"""
        limit_range = client.V1LimitRange(
            metadata=client.V1ObjectMeta(name="resource-limits"),
            spec=client.V1LimitRangeSpec(
                limits=[
                    client.V1LimitRangeItem(
                        type="Pod",
                        max={
                            "nvidia.com/gpu": str(limits['max_gpu_per_pod']),
                            "memory": limits['max_memory_per_pod'],
                            "cpu": str(limits['max_cpu_per_pod'])
                        }
                    )
                ]
            )
        )
        try:
            self.v1.create_namespaced_limit_range(namespace, limit_range)
        except client.exceptions.ApiException as e:
            if e.status != 409:
                raise
    
    def _create_network_policy(self, namespace: str):
        """创建网络策略"""
        # 实现网络隔离策略
        pass
    
    def _create_volcano_queue(self, namespace: str, config: Dict):
        """创建Volcano队列"""
        queue_name = f"{config['name']}-queue"
        queue = {
            "apiVersion": "scheduling.volcano.sh/v1beta1",
            "kind": "Queue",
            "metadata": {
                "name": queue_name
            },
            "spec": {
                "weight": config.get('priority', 1),
                "capability": {
                    "cpu": config['quota']['cpu'],
                    "memory": config['quota']['memory'],
                    "nvidia.com/gpu": config['quota']['gpu']
                }
            }
        }
        
        try:
            self.custom_api.create_cluster_custom_object(
                group="scheduling.volcano.sh",
                version="v1beta1",
                plural="queues",
                body=queue
            )
        except client.exceptions.ApiException as e:
            if e.status != 409:
                raise
    
    def _create_rbac(self, namespace: str, users: List[str]):
        """创建RBAC权限"""
        # 创建Role和RoleBinding
        pass
    
    def get_tenant_usage(self, tenant_name: str) -> Dict:
        """获取租户资源使用情况"""
        namespace = f"tenant-{tenant_name}"
        
        try:
            quota = self.v1.read_namespaced_resource_quota("gpu-quota", namespace)
            
            return {
                "tenant": tenant_name,
                "namespace": namespace,
                "quota": {
                    "gpu": {
                        "hard": quota.status.hard.get('requests.nvidia.com/gpu', '0'),
                        "used": quota.status.used.get('requests.nvidia.com/gpu', '0')
                    },
                    "cpu": {
                        "hard": quota.status.hard.get('requests.cpu', '0'),
                        "used": quota.status.used.get('requests.cpu', '0')
                    },
                    "memory": {
                        "hard": quota.status.hard.get('requests.memory', '0'),
                        "used": quota.status.used.get('requests.memory', '0')
                    }
                }
            }
        except client.exceptions.ApiException:
            return {"error": f"Tenant {tenant_name} not found"}


# 使用示例
if __name__ == "__main__":
    manager = TenantManager()
    
    # 创建租户
    tenant_config = {
        "name": "ml-team-1",
        "tier": "training",
        "quota": {
            "gpu": 32,
            "cpu": 512,
            "memory": "2Ti"
        },
        "limits": {
            "max_gpu_per_pod": 8,
            "max_cpu_per_pod": 128,
            "max_memory_per_pod": "500Gi"
        },
        "priority": 1,
        "users": ["user1@company.com", "user2@company.com"]
    }
    
    manager.create_tenant(tenant_config)
    
    # 查询使用情况
    usage = manager.get_tenant_usage("ml-team-1")
    print(yaml.dump(usage, default_flow_style=False))
```

## 3. 任务编排和生命周期管理

### 3.1 如何设计训练任务的完整生命周期管理？

**回答要点：**

训练任务生命周期包括：数据准备 -> 任务提交 -> 资源调度 -> 执行训练 -> Checkpoint -> 完成/失败处理

**实现Workflow Controller：**

```yaml
# TrainingWorkflow CRD定义
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: trainingworkflows.ai.openfuyao.io
spec:
  group: ai.openfuyao.io
  names:
    kind: TrainingWorkflow
    plural: trainingworkflows
    singular: trainingworkflow
    shortNames:
      - tw
  scope: Namespaced
  versions:
    - name: v1alpha1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                # 数据配置
                data:
                  type: object
                  properties:
                    source:
                      type: string
                    preprocessing:
                      type: object
                
                # 模型配置
                model:
                  type: object
                  properties:
                    name:
                      type: string
                    framework:
                      type: string  # pytorch, tensorflow
                    version:
                      type: string
                
                # 训练配置
                training:
                  type: object
                  properties:
                    replicas:
                      type: integer
                    gpusPerReplica:
                      type: integer
                    image:
                      type: string
                    command:
                      type: array
                      items:
                        type: string
                
                # Checkpoint配置
                checkpoint:
                  type: object
                  properties:
                    enabled:
                      type: boolean
                    intervalMinutes:
                      type: integer
                    storageClass:
                      type: string
                
                # 自动恢复
                autoRecovery:
                  type: object
                  properties:
                    enabled:
                      type: boolean
                    maxRetries:
                      type: integer
            
            status:
              type: object
              properties:
                phase:
                  type: string  # Pending, DataPrep, Training, Checkpointing, Completed, Failed
                startTime:
                  type: string
                completionTime:
                  type: string
                currentStep:
                  type: integer
                checkpoints:
                  type: array
                  items:
                    type: object

---
# TrainingWorkflow示例
apiVersion: ai.openfuyao.io/v1alpha1
kind: TrainingWorkflow
metadata:
  name: llama2-training
  namespace: tenant-ml-team-1
spec:
  data:
    source: "s3://datasets/llama2-pretrain"
    preprocessing:
      tokenizer: "sentencepiece"
      maxLength: 2048
  
  model:
    name: "llama2-7b"
    framework: "pytorch"
    version: "2.0"
  
  training:
    replicas: 16
    gpusPerReplica: 8
    image: "registry.company.com/ml/pytorch:2.0-cuda11.8"
    command:
      - "python"
      - "train.py"
      - "--config"
      - "/config/training_config.yaml"
    
    resources:
      limits:
        nvidia.com/gpu: 8
        memory: 400Gi
        cpu: 96
  
  checkpoint:
    enabled: true
    intervalMinutes: 30
    storageClass: "fast-ssd"
    maxCheckpoints: 5
  
  autoRecovery:
    enabled: true
    maxRetries: 3
    retryIntervalSeconds: 60
```

**Workflow Controller实现：**

```python
import kopf
from kubernetes import client, config
import logging

logger = logging.getLogger(__name__)

@kopf.on.create('ai.openfuyao.io', 'v1alpha1', 'trainingworkflows')
def create_workflow(spec, name, namespace, **kwargs):
    """处理TrainingWorkflow创建事件"""
    logger.info(f"Creating workflow: {name}")
    
    # 1. 创建数据准备Job
    if 'preprocessing' in spec.get('data', {}):
        create_data_prep_job(name, namespace, spec)
    
    # 2. 创建Volcano训练Job
    create_training_job(name, namespace, spec)
    
    # 3. 创建Checkpoint CronJob
    if spec.get('checkpoint', {}).get('enabled', False):
        create_checkpoint_cronjob(name, namespace, spec)
    
    return {"phase": "DataPrep" if 'preprocessing' in spec.get('data', {}) else "Training"}


@kopf.on.field('batch', 'v1', 'jobs', field='status.succeeded')
def job_succeeded(spec, status, name, namespace, **kwargs):
    """处理Job成功事件"""
    # 检查是否是数据准备Job
    if name.endswith('-dataprep'):
        workflow_name = name.replace('-dataprep', '')
        logger.info(f"Data prep completed for {workflow_name}, starting training")
        
        # 更新Workflow状态
        update_workflow_status(workflow_name, namespace, "Training")


def create_data_prep_job(workflow_name: str, namespace: str, spec: dict):
    """创建数据准备Job"""
    batch_v1 = client.BatchV1Api()
    
    job = client.V1Job(
        metadata=client.V1ObjectMeta(
            name=f"{workflow_name}-dataprep",
            namespace=namespace,
            labels={"workflow": workflow_name, "component": "dataprep"}
        ),
        spec=client.V1JobSpec(
            template=client.V1PodTemplateSpec(
                spec=client.V1PodSpec(
                    restart_policy="OnFailure",
                    containers=[
                        client.V1Container(
                            name="dataprep",
                            image="registry.company.com/ml/dataprep:latest",
                            command=["python", "preprocess.py"],
                            env=[
                                client.V1EnvVar(
                                    name="DATA_SOURCE",
                                    value=spec['data']['source']
                                ),
                                client.V1EnvVar(
                                    name="TOKENIZER",
                                    value=spec['data']['preprocessing']['tokenizer']
                                )
                            ],
                            volume_mounts=[
                                client.V1VolumeMount(
                                    name="data",
                                    mount_path="/data"
                                )
                            ]
                        )
                    ],
                    volumes=[
                        client.V1Volume(
                            name="data",
                            persistent_volume_claim=client.V1PersistentVolumeClaimVolumeSource(
                                claim_name=f"{workflow_name}-data-pvc"
                            )
                        )
                    ]
                )
            )
        )
    )
    
    batch_v1.create_namespaced_job(namespace, job)


def create_training_job(workflow_name: str, namespace: str, spec: dict):
    """创建Volcano训练Job"""
    custom_api = client.CustomObjectsApi()
    
    training_spec = spec['training']
    
    volcano_job = {
        "apiVersion": "batch.volcano.sh/v1alpha1",
        "kind": "Job",
        "metadata": {
            "name": f"{workflow_name}-training",
            "namespace": namespace,
            "labels": {
                "workflow": workflow_name,
                "component": "training"
            }
        },
        "spec": {
            "minAvailable": training_spec['replicas'],
            "schedulerName": "volcano",
            "plugins": {
                "svc": [],
                "env": []
            },
            "tasks": [
                {
                    "replicas": training_spec['replicas'],
                    "name": "worker",
                    "template": {
                        "spec": {
                            "restartPolicy": "OnFailure",
                            "containers": [
                                {
                                    "name": "trainer",
                                    "image": training_spec['image'],
                                    "command": training_spec['command'],
                                    "resources": training_spec['resources'],
                                    "env": [
                                        {
                                            "name": "CHECKPOINT_DIR",
                                            "value": "/checkpoints"
                                        },
                                        {
                                            "name": "WORKFLOW_NAME",
                                            "value": workflow_name
                                        }
                                    ],
                                    "volumeMounts": [
                                        {
                                            "name": "checkpoint",
                                            "mountPath": "/checkpoints"
                                        },
                                        {
                                            "name": "data",
                                            "mountPath": "/data"
                                        }
                                    ]
                                }
                            ],
                            "volumes": [
                                {
                                    "name": "checkpoint",
                                    "persistentVolumeClaim": {
                                        "claimName": f"{workflow_name}-checkpoint-pvc"
                                    }
                                },
                                {
                                    "name": "data",
                                    "persistentVolumeClaim": {
                                        "claimName": f"{workflow_name}-data-pvc"
                                    }
                                }
                            ]
                        }
                    }
                }
            ]
        }
    }
    
    custom_api.create_namespaced_custom_object(
        group="batch.volcano.sh",
        version="v1alpha1",
        namespace=namespace,
        plural="jobs",
        body=volcano_job
    )


def create_checkpoint_cronjob(workflow_name: str, namespace: str, spec: dict):
    """创建Checkpoint CronJob"""
    batch_v1 = client.BatchV1Api()
    
    checkpoint_spec = spec['checkpoint']
    interval_minutes = checkpoint_spec['intervalMinutes']
    
    # 转换为cron表达式
    cron_schedule = f"*/{interval_minutes} * * * *"
    
    cronjob = client.V1CronJob(
        metadata=client.V1ObjectMeta(
            name=f"{workflow_name}-checkpoint",
            namespace=namespace
        ),
        spec=client.V1CronJobSpec(
            schedule=cron_schedule,
            job_template=client.V1JobTemplateSpec(
                spec=client.V1JobSpec(
                    template=client.V1PodTemplateSpec(
                        spec=client.V1PodSpec(
                            restart_policy="OnFailure",
                            containers=[
                                client.V1Container(
                                    name="checkpoint-manager",
                                    image="registry.company.com/ml/checkpoint:latest",
                                    command=[
                                        "python",
                                        "manage_checkpoint.py",
                                        "--workflow", workflow_name,
                                        "--max-checkpoints", str(checkpoint_spec.get('maxCheckpoints', 5))
                                    ],
                                    volume_mounts=[
                                        client.V1VolumeMount(
                                            name="checkpoint",
                                            mount_path="/checkpoints"
                                        )
                                    ]
                                )
                            ],
                            volumes=[
                                client.V1Volume(
                                    name="checkpoint",
                                    persistent_volume_claim=client.V1PersistentVolumeClaimVolumeSource(
                                        claim_name=f"{workflow_name}-checkpoint-pvc"
                                    )
                                )
                            ]
                        )
                    )
                )
            )
        )
    )
    
    batch_v1.create_namespaced_cron_job(namespace, cronjob)


def update_workflow_status(workflow_name: str, namespace: str, phase: str):
    """更新Workflow状态"""
    custom_api = client.CustomObjectsApi()
    
    # 更新状态
    patch = {
        "status": {
            "phase": phase
        }
    }
    
    custom_api.patch_namespaced_custom_object_status(
        group="ai.openfuyao.io",
        version="v1alpha1",
        namespace=namespace,
        plural="trainingworkflows",
        name=workflow_name,
        body=patch
    )
```

## 4. 监控和可观测性

### 4.1 如何设计智算平台的监控体系？

**回答要点：**

智算平台监控需要覆盖多个层面：

1. **基础设施监控**
   - GPU硬件状态
   - 网络带宽和延迟
   - 存储IO

2. **资源使用监控**
   - GPU利用率、显存
   - CPU、内存
   - 网络流量

3. **任务级监控**
   - 训练Loss/Accuracy
   - 吞吐量(samples/sec)
   - 任务状态和进度

4. **成本监控**
   - GPU时使用统计
   - 按租户计费

**监控架构：**

```yaml
# Prometheus配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    scrape_configs:
      # GPU监控 (DCGM Exporter)
      - job_name: 'dcgm'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - gpu-operator
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            regex: nvidia-dcgm-exporter
            action: keep
      
      # Kubernetes资源监控
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
      
      # 训练任务metrics (通过sidecar暴露)
      - job_name: 'training-metrics'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_component]
            regex: training
            action: keep
          - source_labels: [__meta_kubernetes_pod_container_port_name]
            regex: metrics
            action: keep

---
# Grafana Dashboard ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: monitoring
data:
  gpu-cluster-dashboard.json: |
    {
      "dashboard": {
        "title": "GPU Cluster Overview",
        "panels": [
          {
            "title": "GPU Utilization by Node",
            "targets": [
              {
                "expr": "DCGM_FI_DEV_GPU_UTIL"
              }
            ]
          },
          {
            "title": "GPU Memory Usage",
            "targets": [
              {
                "expr": "DCGM_FI_DEV_FB_USED / DCGM_FI_DEV_FB_FREE * 100"
              }
            ]
          },
          {
            "title": "Training Jobs Status",
            "targets": [
              {
                "expr": "count by (phase) (kube_pod_status_phase{namespace=~\"tenant-.*\"})"
              }
            ]
          }
        ]
      }
    }
```

**自定义训练Metrics Exporter：**

```python
#!/usr/bin/env python3
"""
训练任务Metrics导出器
作为sidecar容器运行，读取训练脚本输出的metrics并暴露给Prometheus
"""
import re
import time
from prometheus_client import start_http_server, Gauge, Counter
import logging

logger = logging.getLogger(__name__)

# 定义Metrics
training_loss = Gauge('training_loss', 'Training loss', ['job_name', 'epoch'])
training_accuracy = Gauge('training_accuracy', 'Training accuracy', ['job_name', 'epoch'])
samples_per_second = Gauge('samples_per_second', 'Training throughput', ['job_name'])
gpu_memory_allocated = Gauge('gpu_memory_allocated_gb', 'GPU memory allocated', ['job_name', 'rank'])
current_epoch = Gauge('current_epoch', 'Current training epoch', ['job_name'])
total_steps = Counter('total_training_steps', 'Total training steps', ['job_name'])


class TrainingMetricsExporter:
    """训练指标导出器"""
    
    def __init__(self, log_file: str, job_name: str, port: int = 8000):
        self.log_file = log_file
        self.job_name = job_name
        self.port = port
        
        # 正则表达式匹配训练日志
        self.patterns = {
            'loss': re.compile(r'loss:\s*([\d.]+)'),
            'accuracy': re.compile(r'accuracy:\s*([\d.]+)'),
            'epoch': re.compile(r'epoch:\s*(\d+)'),
            'samples_sec': re.compile(r'samples/s:\s*([\d.]+)'),
            'gpu_memory': re.compile(r'GPU memory:\s*([\d.]+)\s*GB')
        }
    
    def start(self):
        """启动metrics server"""
        start_http_server(self.port)
        logger.info(f"Metrics server started on port {self.port}")
        
        # 持续读取日志文件
        self.tail_log_file()
    
    def tail_log_file(self):
        """tail -f 日志文件并解析"""
        with open(self.log_file, 'r') as f:
            # 跳到文件末尾
            f.seek(0, 2)
            
            while True:
                line = f.readline()
                if not line:
                    time.sleep(0.1)
                    continue
                
                self.parse_and_update(line)
    
    def parse_and_update(self, line: str):
        """解析日志行并更新metrics"""
        # 解析epoch
        if match := self.patterns['epoch'].search(line):
            epoch = int(match.group(1))
            current_epoch.labels(job_name=self.job_name).set(epoch)
        
        # 解析loss
        if match := self.patterns['loss'].search(line):
            loss = float(match.group(1))
            epoch = self._get_current_epoch()
            training_loss.labels(job_name=self.job_name, epoch=epoch).set(loss)
        
        # 解析accuracy
        if match := self.patterns['accuracy'].search(line):
            acc = float(match.group(1))
            epoch = self._get_current_epoch()
            training_accuracy.labels(job_name=self.job_name, epoch=epoch).set(acc)
        
        # 解析吞吐量
        if match := self.patterns['samples_sec'].search(line):
            throughput = float(match.group(1))
            samples_per_second.labels(job_name=self.job_name).set(throughput)
        
        # 解析GPU内存
        if match := self.patterns['gpu_memory'].search(line):
            memory_gb = float(match.group(1))
            rank = 0  # 从环境变量获取
            gpu_memory_allocated.labels(job_name=self.job_name, rank=rank).set(memory_gb)
        
        # 每行都增加步数计数
        total_steps.labels(job_name=self.job_name).inc()
    
    def _get_current_epoch(self) -> int:
        """获取当前epoch"""
        # 从metric中读取
        return 0  # 简化实现


if __name__ == "__main__":
    import os
    
    log_file = os.getenv("TRAINING_LOG_FILE", "/workspace/train.log")
    job_name = os.getenv("JOB_NAME", "unknown")
    port = int(os.getenv("METRICS_PORT", "8000"))
    
    exporter = TrainingMetricsExporter(log_file, job_name, port)
    exporter.start()
```

**在训练Pod中使用Sidecar：**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: training-with-metrics
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8000"
    prometheus.io/path: "/metrics"
spec:
  containers:
    # 主训练容器
    - name: trainer
      image: pytorch/pytorch:2.0-cuda11.8
      command: ["python", "train.py"]
      resources:
        limits:
          nvidia.com/gpu: 8
      volumeMounts:
        - name: workspace
          mountPath: /workspace
    
    # Metrics exporter sidecar
    - name: metrics-exporter
      image: registry.company.com/ml/metrics-exporter:latest
      ports:
        - name: metrics
          containerPort: 8000
      env:
        - name: TRAINING_LOG_FILE
          value: "/workspace/train.log"
        - name: JOB_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
      volumeMounts:
        - name: workspace
          mountPath: /workspace
          readOnly: true
  
  volumes:
    - name: workspace
      emptyDir: {}
```

## 5. 成本优化和计费

### 5.1 如何实现按GPU使用时长计费？

**回答要点：**

计费系统需要准确跟踪每个租户的GPU使用时长，并生成账单。

**实现方案：**

```python
#!/usr/bin/env python3
"""
GPU使用计费系统
"""
from datetime import datetime, timedelta
from typing import Dict, List
import sqlite3
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class UsageRecord:
    """使用记录"""
    tenant: str
    namespace: str
    pod_name: str
    gpu_type: str
    gpu_count: int
    start_time: datetime
    end_time: datetime = None
    
    def duration_hours(self) -> float:
        """计算使用时长（小时）"""
        if self.end_time:
            delta = self.end_time - self.start_time
        else:
            delta = datetime.now() - self.start_time
        
        return delta.total_seconds() / 3600.0
    
    def cost(self, rate_per_hour: float) -> float:
        """计算费用"""
        return self.duration_hours() * self.gpu_count * rate_per_hour


class BillingSystem:
    """计费系统"""
    
    # GPU定价（元/卡/小时）
    GPU_RATES = {
        "A100-80G": 15.0,
        "A100-40G": 12.0,
        "V100-32G": 8.0,
        "T4-16G": 4.0
    }
    
    def __init__(self, db_path: str = "billing.db"):
        self.conn = sqlite3.connect(db_path)
        self._init_db()
    
    def _init_db(self):
        """初始化数据库"""
        cursor = self.conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usage_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant TEXT NOT NULL,
                namespace TEXT NOT NULL,
                pod_name TEXT NOT NULL,
                gpu_type TEXT NOT NULL,
                gpu_count INTEGER NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                cost REAL
            )
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_tenant_time 
            ON usage_records(tenant, start_time)
        ''')
        self.conn.commit()
    
    def record_start(self, tenant: str, namespace: str, pod_name: str, 
                    gpu_type: str, gpu_count: int):
        """记录GPU使用开始"""
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO usage_records 
            (tenant, namespace, pod_name, gpu_type, gpu_count, start_time)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (tenant, namespace, pod_name, gpu_type, gpu_count, datetime.now()))
        self.conn.commit()
        
        logger.info(f"Started tracking GPU usage for {tenant}/{pod_name}")
    
    def record_end(self, pod_name: str):
        """记录GPU使用结束"""
        cursor = self.conn.cursor()
        
        # 查找未结束的记录
        cursor.execute('''
            SELECT id, tenant, gpu_type, gpu_count, start_time
            FROM usage_records
            WHERE pod_name = ? AND end_time IS NULL
        ''', (pod_name,))
        
        record = cursor.fetchone()
        if not record:
            logger.warning(f"No active usage record found for {pod_name}")
            return
        
        record_id, tenant, gpu_type, gpu_count, start_time = record
        end_time = datetime.now()
        
        # 计算费用
        start_dt = datetime.fromisoformat(start_time)
        duration_hours = (end_time - start_dt).total_seconds() / 3600.0
        rate = self.GPU_RATES.get(gpu_type, 10.0)
        cost = duration_hours * gpu_count * rate
        
        # 更新记录
        cursor.execute('''
            UPDATE usage_records
            SET end_time = ?, cost = ?
            WHERE id = ?
        ''', (end_time, cost, record_id))
        self.conn.commit()
        
        logger.info(f"Ended tracking for {pod_name}, cost: ¥{cost:.2f}")
    
    def get_tenant_bill(self, tenant: str, start_date: datetime, 
                       end_date: datetime) -> Dict:
        """生成租户账单"""
        cursor = self.conn.cursor()
        
        cursor.execute('''
            SELECT 
                gpu_type,
                SUM(gpu_count * (julianday(COALESCE(end_time, datetime('now'))) - 
                                 julianday(start_time)) * 24) as total_gpu_hours,
                SUM(COALESCE(cost, 
                    gpu_count * (julianday(datetime('now')) - julianday(start_time)) * 24 * ?)) as total_cost
            FROM usage_records
            WHERE tenant = ? 
                AND start_time >= ? 
                AND start_time < ?
            GROUP BY gpu_type
        ''', (self.GPU_RATES.get('A100-80G', 10.0), tenant, start_date, end_date))
        
        results = cursor.fetchall()
        
        bill = {
            "tenant": tenant,
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "details": [],
            "total_cost": 0.0
        }
        
        for gpu_type, gpu_hours, cost in results:
            bill["details"].append({
                "gpu_type": gpu_type,
                "gpu_hours": float(gpu_hours),
                "rate_per_hour": self.GPU_RATES.get(gpu_type, 10.0),
                "cost": float(cost)
            })
            bill["total_cost"] += float(cost)
        
        return bill
    
    def get_all_tenants_summary(self, month: int, year: int) -> List[Dict]:
        """获取所有租户的月度汇总"""
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT 
                tenant,
                COUNT(*) as job_count,
                SUM(COALESCE(cost, 0)) as total_cost
            FROM usage_records
            WHERE start_time >= ? AND start_time < ?
            GROUP BY tenant
            ORDER BY total_cost DESC
        ''', (start_date, end_date))
        
        results = cursor.fetchall()
        
        return [
            {
                "tenant": tenant,
                "job_count": job_count,
                "total_cost": total_cost
            }
            for tenant, job_count, total_cost in results
        ]


# 与Kubernetes集成：监听Pod事件
from kubernetes import client, config, watch

class K8sUsageTracker:
    """K8s GPU使用跟踪器"""
    
    def __init__(self, billing_system: BillingSystem):
        config.load_kube_config()
        self.v1 = client.CoreV1Api()
        self.billing = billing_system
    
    def watch_pods(self):
        """监听Pod事件"""
        w = watch.Watch()
        
        for event in w.stream(self.v1.list_pod_for_all_namespaces):
            event_type = event['type']
            pod = event['object']
            
            # 只关注tenant命名空间
            if not pod.metadata.namespace.startswith('tenant-'):
                continue
            
            # 检查Pod是否使用GPU
            gpu_count = self._get_gpu_count(pod)
            if gpu_count == 0:
                continue
            
            if event_type == 'ADDED' and pod.status.phase == 'Running':
                # Pod开始运行，记录开始
                tenant = pod.metadata.namespace.replace('tenant-', '')
                gpu_type = self._get_gpu_type(pod)
                
                self.billing.record_start(
                    tenant=tenant,
                    namespace=pod.metadata.namespace,
                    pod_name=pod.metadata.name,
                    gpu_type=gpu_type,
                    gpu_count=gpu_count
                )
            
            elif event_type == 'MODIFIED' and pod.status.phase in ['Succeeded', 'Failed']:
                # Pod完成，记录结束
                self.billing.record_end(pod.metadata.name)
            
            elif event_type == 'DELETED':
                # Pod被删除，记录结束
                self.billing.record_end(pod.metadata.name)
    
    def _get_gpu_count(self, pod) -> int:
        """获取Pod请求的GPU数量"""
        total_gpus = 0
        for container in pod.spec.containers:
            if container.resources and container.resources.limits:
                gpu_limit = container.resources.limits.get('nvidia.com/gpu', '0')
                total_gpus += int(gpu_limit)
        return total_gpus
    
    def _get_gpu_type(self, pod) -> str:
        """获取GPU类型（从Node Label读取）"""
        # 从Pod所在Node的label读取GPU型号
        if pod.spec.node_name:
            try:
                node = self.v1.read_node(pod.spec.node_name)
                gpu_type = node.metadata.labels.get('nvidia.com/gpu.product', 'Unknown')
                return gpu_type
            except:
                pass
        return "A100-80G"  # 默认值


# 使用示例
if __name__ == "__main__":
    billing = BillingSystem()
    
    # 生成账单
    bill = billing.get_tenant_bill(
        tenant="ml-team-1",
        start_date=datetime(2024, 1, 1),
        end_date=datetime(2024, 2, 1)
    )
    
    print(f"Tenant: {bill['tenant']}")
    print(f"Period: {bill['period']['start']} to {bill['period']['end']}")
    print("\nDetails:")
    for detail in bill['details']:
        print(f"  {detail['gpu_type']}: {detail['gpu_hours']:.2f} GPU-hours @ ¥{detail['rate_per_hour']}/hour = ¥{detail['cost']:.2f}")
    print(f"\nTotal Cost: ¥{bill['total_cost']:.2f}")
    
    # 启动实时跟踪
    # tracker = K8sUsageTracker(billing)
    # tracker.watch_pods()
```

## 6. 面试常见问题

**Q1: 智算平台和传统HPC集群有什么区别？**

A: 
- 任务类型：AI训练/推理 vs 科学计算
- 调度策略：Gang Scheduling vs Fair-share
- 资源：GPU为主 vs CPU为主
- 框架：PyTorch/TensorFlow vs MPI
- 弹性：支持云原生弹性扩展

**Q2: 如何保证多租户环境的公平性？**

A:
1. ResourceQuota限制资源上限
2. Queue weight控制优先级
3. 抢占机制保证高优任务
4. Fair-share算法平衡长期使用

**Q3: 训练任务失败如何自动恢复？**

A:
1. 定期保存Checkpoint
2. 监听Pod失败事件
3. 从最新Checkpoint重启
4. 设置最大重试次数防止无限重试

**Q4: 如何优化GPU利用率？**

A:
1. GPU共享(MIG/vGPU)
2. 任务优先级和抢占
3. Bin-packing调度策略
4. Spot实例补充
5. 推理和训练混部

**Q5: 大规模分布式训练的网络瓶颈如何解决？**

A:
1. 使用RDMA/InfiniBand
2. 优化NCCL配置
3. 梯度压缩
4. 拓扑感知调度（同机架/同机器）

## 总结

OpenFuyao智算平台的核心价值：
1. **统一管理**：多集群、多租户统一视图
2. **智能调度**：Gang、优先级、拓扑感知
3. **全生命周期**：从数据准备到模型部署
4. **高可用**：自动恢复、Checkpoint管理
5. **可观测**：全方位监控和计费
