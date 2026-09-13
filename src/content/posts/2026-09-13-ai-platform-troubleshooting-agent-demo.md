---
title: "从零设计一个 AI Platform 故障排查 Agent Demo"
description: "用一个模型部署失败的真实场景，理解 Agent、Tool、MCP 和 Agents API 如何组合，并规划一个可以逐步实现和测试的故障排查 Demo。"
pubDatetime: 2026-09-13T16:20:00+08:00
tags: ["AI Agent", "AI Platform", "MCP", "故障排查", "Agents API"]
---

最近在学习 Agent、MCP、Tool 和 Agents API。单独看每个概念都不难，但放在一起之后很容易混乱：到底谁负责思考，谁负责干活，MCP 又解决什么问题？

这篇文章不从 API 参数开始，而是从一个实际问题出发：**如果 AI Platform 上一个模型部署失败了，能不能做一个 Agent，自己去 Kubernetes、日志和平台任务信息里收集证据，然后告诉我真正的 Root Cause？**

本文先设计整个 Demo 和开发流程，不急着写完整代码。目标是先把思路理解清楚，下一步再真正实现、运行和测试。

## 1 我们到底要解决什么问题？

假设用户在 AI Platform 部署一个 Qwen 模型，页面最终显示：

```text
Deployment Failed
```

普通用户只知道“失败了”。工程师通常需要人工执行下面这些步骤：

```text
查看部署任务
    ↓
查看 Kubernetes Deployment / Pod
    ↓
查看 Event
    ↓
查看容器日志
    ↓
检查 GPU / Memory 等资源
    ↓
综合判断 Root Cause
```

例如最终可能发现：

```text
Pod: CrashLoopBackOff

Logs:
CUDA out of memory

GPU:
79.2 / 80 GB
```

于是才能判断：

> 模型启动失败的真正原因是 GPU 显存不足，而不是 Kubernetes 本身坏了。

问题在于，这个排查流程非常依赖工程师经验，而且每次都要重复执行。

所以这个 Demo 的目标很简单：

> **让 Agent 模拟一个初级故障排查工程师，自动收集证据、判断问题，并给出下一步建议。**

## 2 最终 Demo 长什么样？

第一版不做复杂 UI，也不直接集成现有 ai-platform。

我们只需要一个很简单的入口：

```text
用户：
为什么 deployment-123 部署失败？
```

Agent 自动完成：

```text
用户问题
    ↓
故障排查 Agent
    ↓
查询 AI Platform 部署任务
    ↓
查询 Kubernetes Deployment / Pod / Event
    ↓
查询容器日志
    ↓
分析所有证据
    ↓
输出 Root Cause + Evidence + 建议
```

最终返回类似：

```text
Root Cause
GPU 显存不足导致模型容器启动失败。

Evidence
- Pod 状态：CrashLoopBackOff
- Container Log：CUDA out of memory
- GPU Memory：79.2 / 80 GB

建议
1. 降低 max_model_len
2. 调整 tensor parallel 配置
3. 或使用显存更大的 GPU

验证方法
修改配置后重新部署，并确认 Pod Running、模型健康检查通过。
```

这就是第一版成功标准。

## 3 Agent、Tool、MCP、Agents API 分别干什么？

这是最容易混淆的地方。

先记住一句话：

> **Agent 负责判断，Tool 负责干活，MCP 负责把工具标准化提供给 Agent，Agents API 负责把 Agent 的整个执行循环跑起来。**

对应到这个 Demo：

```text
                    Agents API
                        │
                        ↓
               Troubleshooting Agent
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
     K8s Tools      Log Tool      Platform Tool
          │             │             │
          ↓             ↓             ↓
     Kubernetes       Logs        AI Platform
```

例如 Agent 看到用户说“模型部署失败”，它可能先决定：

```text
我需要先知道 Pod 状态。
```

于是调用：

```text
get_pods(deployment_id)
```

发现：

```text
CrashLoopBackOff
```

Agent 再判断：

```text
Pod 在不断重启，我需要看日志。
```

于是调用：

```text
get_pod_logs(pod_name)
```

日志出现：

```text
CUDA out of memory
```

Agent 才得出最终结论。

这就是最基本的 Agent Loop。

## 4 为什么不直接写一个大函数？

当然可以写：

```python
def troubleshoot():
    get_pods()
    get_events()
    get_logs()
    check_gpu()
```

但这种方式把排查顺序写死了。

现实故障并不是固定流程。

例如：

```text
Pending
→ 应该优先检查 Scheduler / PVC / Resource

CrashLoopBackOff
→ 应该优先检查 Container Logs

ImagePullBackOff
→ 应该检查 Image / Registry / Secret

Running 但 API 500
→ 应该检查应用日志和后端依赖
```

Agent 的价值就在这里：

> **根据当前证据决定下一步调用哪个工具，而不是把所有检查步骤写死。**

## 5 第一版 Tool 怎么设计？

第一版不要贪多，只做最有价值的只读 Tool。

### Kubernetes Tools

```text
get_deployment(name, namespace)
get_pods(namespace, selector)
get_events(namespace, object_name)
get_pod_logs(namespace, pod_name)
```

### AI Platform Tool

```text
get_deployment_task(task_id)
```

返回模型名称、镜像、资源配置、部署状态等信息。

### Resource Tool

第一版可以先做简单模拟：

```text
get_gpu_status(node_name)
```

后续再考虑接 Prometheus、DCGM 或其他真实监控系统。

第一版全部只读，**不提供 delete_pod、restart_deployment、修改生产配置之类的 Tool**。

原因很简单：Demo 的目标首先是证明“Agent 能不能正确找到问题”，而不是让 Agent 自动操作生产环境。

## 6 MCP 第一版要不要做？

我的建议是：**先理解 Tool，再加 MCP。**

第一阶段可以直接把 Python 函数注册成 Tool：

```text
Agent
 ↓
Python Tool
 ↓
Fake Kubernetes Data
```

等 Agent Loop 跑通，再把 Kubernetes Tool 包装成 MCP：

```text
Agent
 ↓
MCP
 ↓
Kubernetes Tools
 ↓
真实 Kubernetes
```

这样学习曲线更平滑。

否则一开始同时处理 Agents API、MCP、Kubernetes、权限和真实环境，出问题时很难判断到底是哪一层错了。

## 7 为什么第一版建议使用 Fake Data？

因为我们现在验证的是 Agent，而不是 Kubernetes。

可以准备一个固定故障：

```json
{
  "deployment": "qwen-demo",
  "pod_status": "CrashLoopBackOff",
  "events": ["Back-off restarting failed container"],
  "logs": ["CUDA out of memory"],
  "gpu_memory_used": "79.2GB",
  "gpu_memory_total": "80GB"
}
```

然后看 Agent 能不能得到：

```text
GPU OOM
```

如果连 Fake Data 都判断不正确，那么接真实 Kubernetes 只会让 Debug 更复杂。

所以开发顺序应该是：

```text
Fake Data
   ↓
验证 Agent 推理
   ↓
验证 Tool 调用
   ↓
加入 Eval
   ↓
接真实 Kubernetes
   ↓
再加入 MCP
```

## 8 Demo 的开发阶段

### Phase 1：最小 Agent

目标：跑通一次完整 Agent Loop。

```text
用户问题
→ Agent
→ Fake Tool
→ Root Cause
```

成功标准：Agent 能判断 GPU OOM。

### Phase 2：增加多种故障

加入几个最典型场景：

```text
GPU OOM
ImagePullBackOff
PVC Pending
Readiness Probe Failed
应用启动参数错误
```

成功标准：Agent 能根据不同现象选择不同 Tool，而不是永远执行固定流程。

### Phase 3：增加 Eval

Eval 可以简单理解为 Agent 的自动化测试。

例如：

```text
输入：
Pod CrashLoopBackOff + CUDA out of memory

期望：
Root Cause = GPU OOM
```

再例如：

```text
输入：
Pod ImagePullBackOff + unauthorized

期望：
Root Cause = Registry authentication failure
```

每次修改 Prompt 或 Tool 后重新跑这些 Case，避免 Agent 能力退化。

### Phase 4：连接真实 Kubernetes

把 Fake Tool 替换成真实只读查询：

```text
Kubernetes Python Client
或者
kubectl wrapper
```

仍然只允许：

```text
get
list
logs
```

不允许写操作。

### Phase 5：引入 MCP

当 Kubernetes Tool 已经稳定，再包装成 MCP Server。

此时架构变成：

```text
Troubleshooting Agent
        ↓
       MCP
        ↓
 Kubernetes Tools
        ↓
 Kubernetes API
```

以后其他 Agent 也可以复用同一套 Kubernetes MCP，而不是每个 Agent 都重新实现 Kubernetes 查询代码。

## 9 推荐的 Demo 目录

第一版保持简单：

```text
troubleshooting-agent-demo/
├── app.py
├── agent.py
├── tools/
│   ├── kubernetes.py
│   ├── platform.py
│   └── resources.py
├── fixtures/
│   ├── gpu_oom.json
│   ├── image_pull_error.json
│   └── pvc_pending.json
├── evals/
│   └── test_cases.json
├── tests/
│   └── test_tools.py
├── README.md
└── requirements.txt
```

职责也很清楚：

```text
agent.py
= Agent 怎么思考和使用 Tool

tools/
= Agent 能干什么

fixtures/
= 模拟故障环境

evals/
= Agent 是否判断正确

tests/
= 普通 Python 代码测试
```

## 10 一次完整运行流程

最终第一版 Demo 应该能看到类似过程：

```text
$ python app.py

User:
为什么 qwen-demo 部署失败？

Agent:
我先检查部署任务。

Tool:
get_deployment_task("qwen-demo")

Result:
status = failed
namespace = model-serving

Agent:
继续检查 Pod。

Tool:
get_pods("model-serving", "qwen-demo")

Result:
CrashLoopBackOff

Agent:
检查容器日志。

Tool:
get_pod_logs(...)

Result:
CUDA out of memory

Agent:
检查 GPU 状态。

Tool:
get_gpu_status(...)

Result:
79.2 / 80 GB

Final:
Root Cause: GPU OOM
Evidence: ...
Suggested Fix: ...
```

这时候这个 Demo 就已经证明了最核心的事情：

> **Agent 能根据故障现象自主选择 Tool、收集证据并完成 Root Cause Analysis。**

## 11 后续如何和 AI Platform 集成？

PoC 成功以后再考虑集成，不要第一版就修改现有 ai-platform。

未来可以增加一个 API：

```text
POST /api/v1/troubleshooting
```

请求：

```json
{
  "deployment_id": "qwen-demo",
  "question": "为什么部署失败？"
}
```

后端调用故障排查 Agent，最后返回：

```json
{
  "root_cause": "GPU OOM",
  "evidence": [
    "CrashLoopBackOff",
    "CUDA out of memory"
  ],
  "suggestions": [
    "降低 max_model_len",
    "调整 tensor parallel 配置"
  ]
}
```

前端只负责展示结果。

这样 Agent 是一个独立能力：

```text
AI Platform
     ↓
Troubleshooting API
     ↓
Agent
     ↓
MCP / Tools
     ↓
Kubernetes / Logs / Platform
```

后续甚至可以继续扩展：

```text
模型部署故障 Agent
训练任务故障 Agent
数据集故障 Agent
Kubernetes 环境故障 Agent
```

## 12 我们真正要学的是什么？

这个 Demo 的重点不是“调用一次大模型 API”。

真正需要理解的是这几个角色：

```text
Agent
= 判断下一步做什么

Tool
= 真正执行查询

MCP
= 标准化地把 Tool 提供给 Agent

Agents API
= 负责运行整个 Agent Loop

Eval
= 检查 Agent 判断得对不对
```

整个开发路径应该保持简单：

```text
先 Fake
↓
再 Tool
↓
再 Agent
↓
再 Eval
↓
再真实 Kubernetes
↓
最后 MCP / AI Platform 集成
```

不要反过来一开始就搭完整平台。

## 13 下一步

下一步可以真正创建 `troubleshooting-agent-demo` 项目。

第一版只实现一个故障：

```text
Qwen Deployment Failed
        ↓
CrashLoopBackOff
        ↓
CUDA out of memory
        ↓
Agent 判断 GPU OOM
```

先让这个最小链路跑通，并写一个 Eval 验证结果。

等第一版可以稳定运行后，再逐步增加 `ImagePullBackOff`、PVC Pending、Readiness Probe 等场景，最后接入真实 Kubernetes。

这样每一步都有明确的成功标准，也比较容易知道问题出在哪一层。