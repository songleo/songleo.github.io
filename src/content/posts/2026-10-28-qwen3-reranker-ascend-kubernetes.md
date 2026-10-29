---
title: "在 kubernetes 上运行 qwen3 reranker：让检索结果重新排序"
description: "从检索重排讲起，结合昇腾单卡实践，介绍 qwen3 reranker 的 kubernetes 部署和接口验证。"
pubDatetime: 2026-10-28T16:00:00+08:00
tags: ["kubernetes", "ai", "部署", "学习笔记"]
draft: true
---

搜索知识库时，向量检索通常先找出一批看起来相关的文章片段。但“看起来相近”不一定等于“最能回答问题”：有些片段包含相同的关键词，却没有给出答案。

这时可以加入 **reranker**。它把用户的问题和候选片段一对一地比较，再给每个片段一个相关性分数。应用按分数重新排序后，可以把更相关的内容交给后续回答模型。

本文以 `Qwen3-Reranker-0.6B` 为例，介绍昇腾单卡推理和一个通用的 kubernetes 部署示例。实际实践完成了集群内 Service 的基础重排验证；下方清单是根据实践参数整理的示例，**没有作为完整清单逐字验证**。使用前需要根据自己的镜像、设备插件、存储和用户权限调整。

## 1 重排和向量检索怎样配合

向量检索先召回候选片段，reranker 再比较问题和每条候选，返回相关性分数。它不负责存储向量或生成答案。[模型卡](https://huggingface.co/Qwen/Qwen3-Reranker-0.6B)介绍了多语言与检索指令。

本次服务的长度限制为 1024 token，问题、文档和模板都计入其中。

## 2 实践条件与镜像

这次实践使用 ARM64 节点、昇腾 910B 系列的一张卡，以及 vllm 0.23.0、vllm ascend 0.23.0.post1 相关运行环境。给服务配置了 4 CPU、16 GiB 内存和 1 张卡；这是实际使用的配置，不是官方最低要求。

实际镜像在相应运行环境上做过普通用户身份适配，**不是未经修改的官方镜像**。昇腾 A2 的[官方教程](https://docs.vllm.ai/projects/ascend/en/v0.23.0/tutorials/models/Qwen3-Reranker.html)提供 `quay.io/ascend/vllm-ascend:v0.23.0.post1` 作为镜像参考。它不能自动代表与实际镜像相同，使用前要核对芯片、CPU 架构、驱动、cann、容器运行时和镜像版本，并记录镜像摘要。

运行身份也会影响结果。检查用户能否读取模型，以及日志和缓存目录是否可写；不要为了让示例运行就放宽宿主机目录权限。模型支持状态要按运行时版本分别核对：0.23.0 的[支持矩阵](https://docs.vllm.ai/projects/ascend/en/v0.23.0/user_guide/support_matrix/supported_models.html)将该模型在 A2/A3 上列为实验性，较新的[支持矩阵](https://docs.vllm.ai/projects/ascend/en/main/user_guide/support_matrix/supported_models.html)则列为不再维护。正式使用前应重新检查所选版本的状态。

## 3 准备模型、设备和模板

部署前先确认 kubernetes 节点能识别 NPU，设备插件和运行时已配置，且有一张可用于此服务的卡。下面的名称只是示例，应以集群实际配置为准：

```bash
kubectl get nodes -o wide
kubectl get runtimeclass
NODE_NAME=your-npu-node
kubectl describe node "$NODE_NAME"
```

从 [ModelScope](https://modelscope.cn/models/Qwen/Qwen3-Reranker-0.6B) 或 [Hugging Face](https://huggingface.co/Qwen/Qwen3-Reranker-0.6B) 准备完整模型目录，保留权重、配置和分词器。记录来源版本，校验文件，再将目录放到集群可读取的存储中。下文假设已创建 `reranker-model-pvc`，PVC 根目录直接包含模型文件。

例如，已有 `hf` 工具时，可下载指定版本到准备目录；替换版本占位符，并按照集群存储流程将目录放入 PVC。具体参数见 [hugging face 命令行文档](https://huggingface.co/docs/huggingface_hub/en/guides/cli)：

```bash
MODEL_REVISION=your-model-revision
hf download Qwen/Qwen3-Reranker-0.6B \
  --revision "$MODEL_REVISION" \
  --local-dir ./qwen3-reranker-0.6b
```

原始模型还需要重排输入模板。下面示例使用 [vllm 0.23.0 的模板](https://github.com/vllm-project/vllm/blob/v0.23.0/examples/pooling/score/template/qwen3_reranker.jinja)，将模板作为 ConfigMap 挂载。下载前应核对来源和版本；生产环境建议固定到已审核的具体提交。

```bash
curl -fsSL \
  https://raw.githubusercontent.com/vllm-project/vllm/v0.23.0/examples/pooling/score/template/qwen3_reranker.jinja \
  -o qwen3_reranker.jinja

kubectl create configmap qwen3-reranker-template \
  --from-file=qwen3_reranker.jinja=./qwen3_reranker.jinja
```

该命令用于首次创建 ConfigMap；如果集群中已有同名对象，先核对它的内容和归属。模板要与运行时版本匹配，不要假定每个镜像都包含相同的模板文件。

## 4 为什么启动参数和 embedding 不同

模型原始形式以 `yes`、`no` 的得分判断相关性。为了使用评分接口，需要按文本版模型的要求设置分类架构和这两个 token；还要让服务使用重排模板。[vllm 对原始模型的示例](https://github.com/vllm-project/vllm/blob/v0.23.0/examples/pooling/score/qwen3_reranker_online.py)使用 `Qwen3ForSequenceClassification`。

例如，模型和模板分别挂载到 `/models` 与 `/templates` 时，核心命令是：

```bash
vllm serve /models \
  --served-model-name Qwen/Qwen3-Reranker-0.6B \
  --runner pooling \
  --hf-overrides '{"architectures":["Qwen3ForSequenceClassification"],"classifier_from_token":["no","yes"],"is_original_qwen3_reranker":true}' \
  --chat-template /templates/qwen3_reranker.jinja \
  --port 8000 \
  --max-model-len 1024 \
  --additional-config '{"enable_cpu_binding":false}'
```

这里使用的是**文本版**分类架构，不要与多模态 reranker 的架构名称混淆。请求中直接提供原始问题和文档，由已配置的模板组织输入；不要在调用方再重复拼一次模板。

本次关闭 CPU 自动绑定，是为了避免运行时自动调整宿主机相关设置；它不是所有环境的强制要求。是否开启以及对性能的影响，应结合自己的环境验证。

## 5 一个 kubernetes 部署示例

下面的示例只描述模型容器和集群内访问方式，不是已经验证的生产清单。替换 `REPLACE_WITH_VALIDATED_ARM64_IMAGE`、PVC、设备资源名和 `runtimeClassName`；确认镜像中的运行用户能够读取模型与模板，并能写入 `/tmp`。将调整后的内容保存为 `reranker.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qwen3-reranker
spec:
  replicas: 1
  strategy:
    type: Recreate
  progressDeadlineSeconds: 1200
  selector:
    matchLabels:
      app: qwen3-reranker
  template:
    metadata:
      labels:
        app: qwen3-reranker
    spec:
      runtimeClassName: ascend
      containers:
        - name: reranker
          image: REPLACE_WITH_VALIDATED_ARM64_IMAGE
          command: ["vllm", "serve"]
          args:
            - /models
            - --served-model-name
            - Qwen/Qwen3-Reranker-0.6B
            - --runner
            - pooling
            - --hf-overrides
            - '{"architectures":["Qwen3ForSequenceClassification"],"classifier_from_token":["no","yes"],"is_original_qwen3_reranker":true}'
            - --chat-template
            - /templates/qwen3_reranker.jinja
            - --port
            - "8000"
            - --max-model-len
            - "1024"
            - --additional-config
            - '{"enable_cpu_binding":false}'
          env:
            - {name: HOME, value: /tmp}
            - {name: XDG_CACHE_HOME, value: /tmp/.cache}
            - {name: XDG_CONFIG_HOME, value: /tmp/.config}
            - {name: HF_HOME, value: /tmp/huggingface}
          ports:
            - {name: http, containerPort: 8000}
          resources:
            requests: {cpu: "4", memory: 16Gi}
            limits:
              cpu: "4"
              memory: 16Gi
              huawei.com/Ascend910: 1
          startupProbe:
            httpGet: {path: /health, port: http}
            periodSeconds: 10
            failureThreshold: 90
          readinessProbe:
            httpGet: {path: /health, port: http}
            periodSeconds: 10
            failureThreshold: 3
          volumeMounts:
            - {name: model, mountPath: /models, readOnly: true}
            - {name: template, mountPath: /templates, readOnly: true}
            - {name: temp, mountPath: /tmp}
      volumes:
        - name: model
          persistentVolumeClaim: {claimName: reranker-model-pvc, readOnly: true}
        - name: template
          configMap: {name: qwen3-reranker-template}
        - name: temp
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: qwen3-reranker
spec:
  type: ClusterIP
  selector: {app: qwen3-reranker}
  ports:
    - {name: http, port: 8000, targetPort: http}
```

PVC 的根目录应是完整模型目录，而不是它的父目录。ConfigMap 提供模板，临时卷提供可写缓存；需要根据镜像实际身份确认权限。启动和就绪探针是示例的补充，不是对实际验证配置的原样复述；首次加载可能较慢，应结合环境调整等待时间。`Recreate` 避免滚动更新时同时申请两张卡，但更新期间会中断服务。

审查清单后，在自己的测试集群中执行：

```bash
kubectl apply -f reranker.yaml
kubectl rollout status deployment/qwen3-reranker --timeout=20m
kubectl get pods -l app=qwen3-reranker -o wide
kubectl logs -l app=qwen3-reranker --tail=100
kubectl get service qwen3-reranker
```

## 6 用重排接口验证

先在一个终端建立临时端口转发：

```bash
kubectl port-forward service/qwen3-reranker 8000:8000
```

另开终端检查健康和模型列表，再发送问题与三条候选文本：

```bash
curl -fsS http://127.0.0.1:8000/health
curl -fsS http://127.0.0.1:8000/v1/models

curl -fsS http://127.0.0.1:8000/v1/rerank \
  -H 'Content-Type: application/json' \
  -d '{"model":"Qwen/Qwen3-Reranker-0.6B","query":"What is the capital of China?","documents":["Water freezes at zero degrees Celsius.","The capital of China is Beijing.","Cats are mammals."],"top_n":3}'
```

返回结果包含原文档的 `index` 和 `relevance_score`。检查返回数量、索引对应关系，以及正确答案是否排在无关内容前；不能只看到 HTTP 200 就认为重排正确。`/score` 也可用于逐对或批量评分，具体请求结构可参考[评分接口文档](https://github.com/vllm-project/vllm/blob/v0.23.0/docs/models/pooling_models/scoring.md)。测试完毕后在转发终端按 `Ctrl+C`。

## 7 实际验证与边界

实际验证中，英文三候选的正确答案排名第一，分数约 0.99956；中文查询的正确答案也排名第一，分数约 0.99962。单条和批量评分中的同一结果一致；空文档列表返回 HTTP 400。测试从集群内 Service 发起，使用的是少量合成文本。

这些结果说明所选组合的基础重排能力已跑通，不能证明所有业务文本都能正确排序，也不能代表大并发、长文本、吞吐或长期稳定性已验收。需要服务于真实检索系统时，应使用自己的查询和相关性标注评估效果。

## 8 运行时注意事项

本次将主目录和缓存指向可写的临时目录后启动；应检查镜像实际运行身份和目录权限。身份解析及算子权限的其他问题见[普通用户故障排查](/posts/2026-10-28-vllm-ascend-nonroot-troubleshooting/)。权重大小不等于运行时显存占用，需按输入和并发实测；集群内 Service 也不包含对外认证和访问控制。
