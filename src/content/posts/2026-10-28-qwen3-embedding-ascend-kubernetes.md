---
title: "在 kubernetes 上运行 qwen3 embedding：从文本到向量服务"
description: "从文本向量和相似度讲起，结合单卡昇腾实践，说明模型、镜像、kubernetes 部署示例与验证方法。"
pubDatetime: 2026-10-28T14:00:00+08:00
tags: ["kubernetes", "ai", "部署", "学习笔记"]
draft: true
---

搜索一篇文章时，我们输入的词可能和文章原文不完全一样。例如，搜索“怎么让机器理解文字”，也许希望找到介绍“文本向量化”的文章。

怎样让计算机判断这两句话在意思上接近？一种做法是把文字交给 embedding 模型，转换为一组数字，再比较数字的方向。这组数字就是**向量**。

本文结合一次昇腾单卡实践，介绍如何使用 `Qwen3-Embedding-0.6B` 提供向量接口，并整理一个通用的 kubernetes 部署示例。读完后，你应该能看懂模型和运行镜像分别是什么、需要哪些条件，以及如何验证服务有没有真正返回向量。

先说清楚范围：实际实践完成了容器内和集群内 Service 的基础推理验证。下面的 kubernetes 清单是根据实际参数整理的示例，**没有逐字在相同环境中验证**；镜像、存储、设备插件与权限必须按自己的集群调整。

## 1 embedding 做什么

可以把向量想成给一句话制作一张由数字组成的“特征卡片”：

```text
“怎样部署向量模型？” ─┐
                       ├─ embedding 模型 ─→ 各自的一组数字 ─→ 比较相似程度
“如何运行文本向量服务？” ┘
```

模型会为每段文本生成向量；向量之间可以用余弦相似度等方法比较。语义接近的文本通常更接近，但结果会受模型、输入和业务场景影响，并非数学保证。

在知识库里，可以先把文档切成小段并生成向量，保存到向量检索系统；用户提问时，再把问题变成向量，查找相近的文档片段。**embedding 服务负责生成向量；检索系统负责保存和查找；需要生成答案时，还要搭配其他模型。**

`Qwen3-Embedding-0.6B` 是文本向量模型，不是问答聊天模型。它默认输出 1024 维向量，模型本身支持最长 32K 上下文。服务实际允许的输入长度由启动配置决定。[模型卡](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B)还介绍了多语言和检索指令用法。

## 2 一次运行需要哪些东西

| 组件 | 可以怎样理解 | 负责什么 |
| --- | --- | --- |
| 模型文件 | 一套已经训练好的知识和配置 | 包含权重、分词器和池化配置 |
| vllm | 服务程序 | 加载模型、接收请求、返回向量 |
| vllm ascend | 适配插件 | 让 vllm 使用昇腾计算设备 |
| 驱动和 cann | 连接软件和芯片的基础环境 | 为容器中的计算提供设备能力 |
| kubernetes | 调度和管理工具 | 找到有资源的节点，启动并管理容器 |
| Service | 集群内的稳定访问入口 | 将请求转给服务容器 |

本次实践使用一张昇腾 910B 系列卡、ARM64 节点、vllm 0.23.0 和 vllm ascend 0.23.0.post1 相关运行环境。给服务分配了 4 核 CPU、16 GiB 内存和 1 张卡；这是一组**实测配置**，不是官方公布的最低资源要求。

实际使用的镜像是在对应运行环境上做过**普通用户身份适配**的镜像。它不是可以直接公开拉取的官方原版。本次没有用官方原版镜像完成该模型的端到端验证，不能把两者说成完全相同。

对于 A2 系列设备，vllm ascend 0.23.0 的[模型教程](https://docs.vllm.ai/projects/ascend/en/v0.23.0/tutorials/models/Qwen3-Embedding.html)给出的官方镜像示例是：

```text
quay.io/ascend/vllm-ascend:v0.23.0.post1
```

它可以作为选择镜像的起点，不能保证直接适配任何环境。芯片系列、CPU 架构、驱动、cann、容器运行时和镜像版本都要核对；最好固定镜像摘要。尤其是在非 root 环境，要检查运行身份、文件权限、日志和缓存目录是否可写。[版本配套说明](https://docs.vllm.ai/projects/ascend/en/v0.23.0/community/versioning_policy.html)可用于核对软件组合。

**维护状态也要单独看。** 写作时，0.23.0 的[支持矩阵](https://docs.vllm.ai/projects/ascend/en/v0.23.0/user_guide/support_matrix/supported_models.html)将该模型在 A2/A3 上标为实验性；另有更新的[支持矩阵](https://docs.vllm.ai/projects/ascend/en/main/user_guide/support_matrix/supported_models.html)将其标为不再维护。版本不同，结论也不能混在一起。正式使用前应重新查证所选版本的支持状态并评估维护风险。

## 3 部署前先准备什么

先确认以下条件：

1. kubernetes 集群已经可用，目标节点的驱动能识别昇腾设备。
2. 已安装并配置对应设备插件和容器运行时；节点能报告可分配的 NPU 资源。资源名称和 runtimeclass 名称以自己的集群为准。
3. 已选择与节点架构、驱动及 cann 匹配的镜像，并核实容器运行用户可以读取模型、写入临时目录。
4. 模型文件已准备在集群可读取的存储上，创建好指向模型目录的 PVC；所有将运行服务的节点都要能访问该存储。

可以先查看节点和资源。例如，下面的资源名只是本实践使用的名称，其他设备插件可能不同：

```bash
kubectl get nodes -o wide
NODE_NAME=your-npu-node  # 替换为实际节点名
kubectl describe node "$NODE_NAME"
kubectl get runtimeclass
```

在节点详情中查看 `huawei.com/Ascend910` 的容量和可分配量。能看到资源，只说明 kubernetes 已登记该资源；还要确认设备健康、容器运行时和业务调度策略。

模型可以从 [ModelScope 模型页面](https://modelscope.cn/models/Qwen/Qwen3-Embedding-0.6B)或 [Hugging Face 模型页面](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B)获取。下载时保留完整目录，包括权重、分词器、配置和池化配置；不要只复制一个权重文件。选择并记录具体模型版本，再按来源校验文件。

例如，已有 `hf` 工具且可以访问模型仓库时，可用下面的方式下载至准备好的目录；下载和向共享存储复制文件需要按自己环境的流程执行。[工具文档](https://huggingface.co/docs/huggingface_hub/en/guides/cli)说明了 `--local-dir` 和 `--revision` 的用法。

```bash
MODEL_REVISION=your-model-revision  # 替换为已核对的提交号或版本
hf download Qwen/Qwen3-Embedding-0.6B \
  --revision "$MODEL_REVISION" \
  --local-dir ./qwen3-embedding-0.6b
```

本次验证对实际挂载的 `model.safetensors` 做了 SHA-256 核对，与当时的官方权重一致；其他文件没有逐一校验。因此，这只能证明该权重文件一致，不能代表整套模型文件都已核验。

## 4 先看服务启动命令

假设模型完整目录已经只读挂载到容器 `/models`，核心命令是：

```bash
vllm serve /models \
  --served-model-name Qwen/Qwen3-Embedding-0.6B \
  --runner pooling \
  --port 8000 \
  --max-model-len 1024
```

这里的 `/models` 是**容器内路径**，不是模型在每台机器上的固定路径。`--runner pooling` 让服务按向量任务运行；`--served-model-name` 是调用接口时使用的名称；端口为 8000。

`--max-model-len 1024` 参考了官方 A2/A3 示例。它限制的是这个服务单次请求可处理的长度，指令和特殊 token 也会占用长度；不能把它理解为模型最多只支持 1024 token。需要更长输入时，应评估内存、显存和性能，再调整并重新验证。

## 5 一个 kubernetes 部署示例

下面示例的目标是让读者看清组成关系。**不要直接把它当成已经验证的生产清单。** 使用前需要：

- 把 `REPLACE_WITH_VALIDATED_ARM64_IMAGE` 换成已经在你的环境核实的镜像地址和摘要。
- 把 `model-pvc` 换成已有的模型 PVC 名称；该 PVC 挂载后的根目录应直接包含模型配置和权重。
- 核对 `ascend` 和 `huawei.com/Ascend910` 是否是集群实际使用的 runtimeclass 和设备资源名。
- 确认容器的运行身份可读取模型且能写入 `/tmp`。如果镜像或集群采用只读根文件系统，需要另外提供与用户权限匹配的可写临时卷。
- 检查调度、资源配额及访问策略，并在测试环境按需调整启动探针超时。

将下面内容保存为 `embedding.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qwen3-embedding
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: qwen3-embedding
  template:
    metadata:
      labels:
        app: qwen3-embedding
    spec:
      runtimeClassName: ascend
      containers:
        - name: embedding
          image: REPLACE_WITH_VALIDATED_ARM64_IMAGE
          command: ["vllm", "serve"]
          args:
            - /models
            - --served-model-name
            - Qwen/Qwen3-Embedding-0.6B
            - --runner
            - pooling
            - --port
            - "8000"
            - --max-model-len
            - "1024"
          env:
            - name: HOME
              value: /tmp
            - name: XDG_CACHE_HOME
              value: /tmp/.cache
            - name: XDG_CONFIG_HOME
              value: /tmp/.config
            - name: HF_HOME
              value: /tmp/huggingface
          ports:
            - name: http
              containerPort: 8000
          resources:
            requests:
              cpu: "4"
              memory: 16Gi
            limits:
              cpu: "4"
              memory: 16Gi
              huawei.com/Ascend910: 1
          startupProbe:
            httpGet:
              path: /health
              port: http
            periodSeconds: 10
            failureThreshold: 60
          readinessProbe:
            httpGet:
              path: /health
              port: http
            periodSeconds: 10
            failureThreshold: 3
          volumeMounts:
            - name: model
              mountPath: /models
              readOnly: true
      volumes:
        - name: model
          persistentVolumeClaim:
            claimName: model-pvc
            readOnly: true
---
apiVersion: v1
kind: Service
metadata:
  name: qwen3-embedding
spec:
  type: ClusterIP
  selector:
    app: qwen3-embedding
  ports:
    - name: http
      port: 8000
      targetPort: http
```

`runtimeClassName` 选择容器运行时；NPU 的资源限制申请一张卡；PVC 将模型文件只读交给容器；Service 在集群内部提供稳定入口。`Recreate` 避免更新时默认同时创建两个副本，但更新期间会有服务中断。

示例增加了启动探针和就绪探针，这是对实际验证配置的改进，**不是对当时配置的原样复述**。启动探针给模型加载和编译留时间；就绪探针在健康接口可用前不把流量交给容器。示例最多等待约 10 分钟，具体值要根据实测调整；超时会导致容器重启。[kubernetes 探针说明](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)解释了这两种探针的区别。

调整并审查清单后，在自己的测试集群中执行：

```bash
kubectl apply -f embedding.yaml
kubectl rollout status deployment/qwen3-embedding --timeout=15m
kubectl get pods -l app=qwen3-embedding -o wide
kubectl logs -l app=qwen3-embedding --tail=100
kubectl get service qwen3-embedding
```

首次启动可能需要加载权重、编译和预热。如果长时间没有就绪，先看 pod 的事件和日志，不要只看列表上的运行状态。这个清单没有配置外部访问入口或认证；要对集群外提供服务，需要另行设计访问控制和安全连接。

## 6 调用接口，确认真的有向量

在本机另开一个终端，建立临时端口转发并保持运行：

```bash
kubectl port-forward service/qwen3-embedding 8000:8000
```

回到原终端，先检查健康和模型列表：

```bash
curl -fsS http://127.0.0.1:8000/health
curl -fsS http://127.0.0.1:8000/v1/models
```

再提交一条文本。下面的 `model` 要与启动参数中的服务名一致：

```bash
curl -fsS http://127.0.0.1:8000/v1/embeddings \
  -H 'Content-Type: application/json' \
  -d '{"model":"Qwen/Qwen3-Embedding-0.6B","input":"怎样部署文本向量服务？"}'
```

成功时，返回的 JSON 中 `data` 包含 `embedding` 数组。向量很长，不必人工逐个查看；可以用下面的 Python 示例发送批量请求，检查数量、维度、有限数值和向量长度，并比较两组相似度：

```python
import json
import math
import urllib.request

texts = ["怎样部署文本向量服务？", "如何运行文字向量模型？", "今天晚餐吃什么？"]
body = json.dumps({"model": "Qwen/Qwen3-Embedding-0.6B", "input": texts}).encode("utf-8")
request = urllib.request.Request(
    "http://127.0.0.1:8000/v1/embeddings",
    data=body,
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(request, timeout=120) as response:
    result = json.load(response)

items = sorted(result["data"], key=lambda item: item["index"])
vectors = [item["embedding"] for item in items]
assert len(vectors) == len(texts)
assert all(len(v) == 1024 and all(math.isfinite(x) for x in v) for v in vectors)

def norm(vector):
    return math.sqrt(sum(x * x for x in vector))

def cosine(a, b):
    return sum(x * y for x, y in zip(a, b)) / (norm(a) * norm(b))

print("向量数量：", len(vectors))
print("每个向量的维度：", [len(v) for v in vectors])
print("向量长度：", [round(norm(v), 4) for v in vectors])
print("相近文本相似度：", round(cosine(vectors[0], vectors[1]), 4))
print("另一文本相似度：", round(cosine(vectors[0], vectors[2]), 4))
```

保存为 `check-embedding.py` 后运行 `python3 check-embedding.py`。上面是演示输入，不保证在所有版本上得到相同排序；业务检索效果需要用自己的数据评估。测试结束后，在端口转发终端按 `Ctrl+C` 即可关闭转发。

模型方建议检索任务按场景为**查询侧**加入任务指令，文档侧通常不加。指令本身也会占用输入长度；具体提示和效果应结合实际检索数据验证，而不是把一次示例结果当成普遍结论。

## 7 实际验证得到了什么

本次实践使用上述核心启动参数和单卡资源，模型权重以只读方式挂载。服务日志确认 BF16、单卡和 last-token pooling；健康检查返回 HTTP 200。

在容器内，单条请求和三条批量请求均返回 HTTP 200，每条输出 1024 个有限数值，向量长度约为 1；相同输入在单条与批量中的输出逐值一致。一组测试中，相近文本的余弦相似度约为 0.845，另一条不相关文本约为 0.182。通过集群内 Service 再调用健康检查、模型列表和单条向量接口，也得到 HTTP 200。

这些结果说明：**在本次选定的硬件、镜像、模型和参数组合下，基础向量推理跑通了。** 它不证明其他镜像或集群也一定可用，更不等同于并发、吞吐、长文本、长期稳定性和生产验收。

## 8 两个容易忽略的问题

### 运行用户没有可写目录

第一次启动时，容器内普通用户没有权限在默认主目录下创建日志和缓存目录，服务因权限错误退出。后续将 `HOME`、`XDG_CACHE_HOME`、`XDG_CONFIG_HOME` 和 `HF_HOME` 指向容器内可写的 `/tmp`，成功越过这个问题。

关键不是所有镜像都必须使用这些变量，而是要检查**当前镜像实际使用哪个用户、哪些目录需要写入**。容器内临时目录一般随容器消失；如果需要保留日志或缓存，应设计合适的持久化方式和权限，不能简单放宽宿主机目录权限。

### 权重很小，显存不一定只占一点

本次权重文件约 1.1 GiB，但服务启动后，整张 64 GiB 卡观测到约 61 GiB 显存占用。模型权重只是显存的一部分；运行时还可能为缓存和计算预留空间。这个数字是本次配置下的观测，**不是模型的最低显存要求，也不是所有部署的固定占用**。

如果要降低占用，应先了解所选版本的内存配置、输入长度与并发参数，再通过实际负载验证；不要只凭权重大小决定能否部署。模型换版本、改变服务参数或设备后，也应重新测量。
