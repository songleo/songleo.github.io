---
title: "在 kubernetes 上运行 paddleocr-vl 1.5：从图片到文字识别"
description: "结合昇腾单卡实践，介绍 paddleocr-vl 1.5 识别服务的 kubernetes 部署、图片请求和验证边界。"
pubDatetime: 2026-10-28T16:01:00+08:00
tags: ["kubernetes", "ai", "部署", "学习笔记"]
draft: true
---

一张图片里可能同时有文字、表格和公式。想让程序读取这些内容时，除了把字符识别出来，还要根据任务理解表格单元格或数学表达式。

`PaddleOCR-VL-1.5` 是一个面向文档内容识别的视觉语言模型。本文结合昇腾单卡实践，介绍如何将它的 **VLM 识别部分**作为 kubernetes 服务运行，并通过图片请求检查文字、表格和公式识别结果。

先区分边界：本次完成了几张合成图片的基础识别和集群内 Service 调用。下面的 kubernetes 清单是按实践参数整理的通用示例，**没有作为完整清单逐字验证**。它不是完整的 PDF 文档解析流水线，也不是生产验收结果。

## 1 识别模型和完整文档解析有什么不同

可以把一页文档的处理想成几个步骤：

```text
整页文档
   ↓
版面分析：找到文字、表格、图片和公式区域
   ↓
VLM 识别：根据区域和任务读取内容
   ↓
流水线整理：组织顺序、结构和最终输出
```

这篇文章部署的是中间的 **VLM 识别服务**。它可以接收图片和任务提示，例如 `OCR:`、`Table Recognition:` 或 `Formula Recognition:`，然后返回识别结果。它不会因为提供了这些接口，就自动完成多页 PDF 的切页、整页版面分析、跨页表格合并和文档输出。

如果需要完整文档解析，可以进一步使用 PaddleOCR 提供的流水线和版面分析组件；官方昇腾指南也明确区分了 VLM 后端与完整服务。[模型卡](https://huggingface.co/PaddlePaddle/PaddleOCR-VL-1.5)和[昇腾使用指南](https://www.paddleocr.ai/latest/en/version3.x/pipeline_usage/PaddleOCR-VL-Huawei-Ascend-NPU.html)介绍了两种使用方式。

## 2 一次识别服务需要什么

| 组成 | 作用 |
| --- | --- |
| 模型目录 | 提供视觉语言模型权重、配置、处理器和分词器 |
| vllm 与 vllm ascend | 加载模型并提供图文推理接口 |
| 驱动、cann、设备插件 | 让容器使用节点上的昇腾设备 |
| kubernetes | 调度容器、挂载模型并管理服务 |
| Service | 提供集群内访问入口 |

本次实践使用 ARM64、昇腾 910B 系列单卡，以及 vllm 0.23.0、vllm ascend 0.23.0.post1 相关运行环境；为服务配置了 8 CPU、32 GiB 内存和1张卡。这是本次使用的资源，不是官方最低要求。

实践镜像做过普通用户身份适配，不能称为未经修改的官方镜像。vllm ascend 的 [A2 部署教程](https://docs.vllm.ai/projects/ascend/en/v0.23.0/tutorials/models/PaddleOCR-VL.html)提供官方镜像和启动参数参考；其中示例直接介绍的是早期 PaddleOCR-VL 模型，不应自动当成 1.5 在所有环境中的验证证明。

0.23.0 的[支持矩阵](https://docs.vllm.ai/projects/ascend/en/v0.23.0/user_guide/support_matrix/supported_models.html)将相关模型列为实验性；较新的[支持矩阵](https://docs.vllm.ai/projects/ascend/en/main/user_guide/support_matrix/supported_models.html)将其列为不再维护。它们说明的是不同版本运行时的维护状态；选择生产后端时应重新查证。

## 3 准备模型和节点

首先确认节点驱动能识别设备，kubernetes 已配置对应设备插件和运行时，并有一张可分配的卡：

```bash
kubectl get nodes -o wide
kubectl get runtimeclass
NODE_NAME=your-npu-node
kubectl describe node "$NODE_NAME"
```

下文的 `ascend` 和 `huawei.com/Ascend910` 是示例中的运行时及资源名称，不一定适合其他集群。

模型可从 [ModelScope](https://modelscope.cn/models/PaddlePaddle/PaddleOCR-VL-1.5) 或 [Hugging Face](https://huggingface.co/PaddlePaddle/PaddleOCR-VL-1.5) 获取。保留完整目录中的权重、处理器、配置、分词器和所需代码，记录版本并校验来源。本次对实际挂载权重和部分关键代码、配置做了摘要核对；这不代表全部文件都经过安全审计。

例如，已有 `hf` 工具时，可以将指定版本下载到准备目录；替换版本占位符，再按集群存储流程把目录放入 PVC。[命令行文档](https://huggingface.co/docs/huggingface_hub/en/guides/cli)说明了这些参数：

```bash
MODEL_REVISION=your-model-revision
hf download PaddlePaddle/PaddleOCR-VL-1.5 \
  --revision "$MODEL_REVISION" \
  --local-dir ./paddleocr-vl-1.5
```

示例使用 `--trust-remote-code`。这可能执行模型目录中的代码，因此应先审核模型来源及对应版本，不能对未经核实的文件直接启用。准备好后，将完整模型目录放入已创建的 `paddleocr-model-pvc`；PVC 根目录应直接包含配置和权重。

## 4 先看启动命令

模型目录挂载到 `/models` 后，本次验证使用的核心参数如下：

```bash
vllm serve /models \
  --served-model-name PaddleOCR-VL-1.5-0.9B \
  --trust-remote-code \
  --max-model-len 16384 \
  --max-num-batched-tokens 16384 \
  --no-enable-prefix-caching \
  --mm-processor-cache-gb 0 \
  --compilation-config '{"cudagraph_mode":"FULL_DECODE_ONLY"}' \
  --additional-config '{"enable_cpu_binding":false}' \
  --port 8000
```

`--max-model-len` 是单次请求的长度上限；`--max-num-batched-tokens` 是一次批处理的 token 预算，两者不是同一个概念。图像也会占用输入预算。这里设置16K是本次验证的限制，不是模型的原生最大能力。

关闭前缀缓存、将多模态处理器缓存设为0和图模式参考了昇腾 A2 教程；本次额外关闭 CPU 自动绑定，以免自动调整宿主机相关设置。不同驱动、镜像和输入尺寸可能需要不同参数，不能直接把本次配置当作性能最优值。

## 5 一个 kubernetes 部署示例

下列示例提供1个模型容器及集群内 Service，尚未作为完整清单验证。替换镜像、PVC、运行时和 NPU 资源名称；确保运行用户可读取完整模型，也可写入 `/tmp`。镜像版本、CPU 架构和驱动/cann 组合需要先核对。将调整后的内容保存为 `paddleocr-vl15.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: paddleocr-vl15
spec:
  replicas: 1
  strategy:
    type: Recreate
  progressDeadlineSeconds: 1200
  selector:
    matchLabels:
      app: paddleocr-vl15
  template:
    metadata:
      labels:
        app: paddleocr-vl15
    spec:
      runtimeClassName: ascend
      containers:
        - name: ocr
          image: REPLACE_WITH_VALIDATED_ARM64_IMAGE
          command: ["vllm", "serve"]
          args:
            - /models
            - --served-model-name
            - PaddleOCR-VL-1.5-0.9B
            - --trust-remote-code
            - --max-model-len
            - "16384"
            - --max-num-batched-tokens
            - "16384"
            - --no-enable-prefix-caching
            - --mm-processor-cache-gb
            - "0"
            - --compilation-config
            - '{"cudagraph_mode":"FULL_DECODE_ONLY"}'
            - --additional-config
            - '{"enable_cpu_binding":false}'
            - --port
            - "8000"
          env:
            - {name: HOME, value: /tmp}
            - {name: XDG_CACHE_HOME, value: /tmp/.cache}
            - {name: XDG_CONFIG_HOME, value: /tmp/.config}
            - {name: HF_HOME, value: /tmp/huggingface}
            - {name: TASK_QUEUE_ENABLE, value: "1"}
            - {name: PYTORCH_NPU_ALLOC_CONF, value: "expandable_segments:True"}
          ports:
            - {name: http, containerPort: 8000}
          resources:
            requests: {cpu: "8", memory: 32Gi}
            limits:
              cpu: "8"
              memory: 32Gi
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
            - {name: temp, mountPath: /tmp}
      volumes:
        - name: model
          persistentVolumeClaim: {claimName: paddleocr-model-pvc, readOnly: true}
        - name: temp
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: paddleocr-vl15
spec:
  type: ClusterIP
  selector: {app: paddleocr-vl15}
  ports:
    - {name: http, port: 8000, targetPort: http}
```

模型卷为只读，临时卷用于缓存。启动和就绪探针是示例增加的保护：首次加载、编译和预热可能耗时，应按环境调整等待时间。`Recreate` 避免更新时同时申请两张卡，但更新期间服务不可用。示例没有外部入口与认证。

审查并替换参数后，在自己的测试集群中操作：

```bash
kubectl apply -f paddleocr-vl15.yaml
kubectl rollout status deployment/paddleocr-vl15 --timeout=20m
kubectl get pods -l app=paddleocr-vl15 -o wide
kubectl logs -l app=paddleocr-vl15 --tail=100
kubectl get service paddleocr-vl15
```

## 6 发送一张图片

在一个终端建立端口转发：

```bash
kubectl port-forward service/paddleocr-vl15 8000:8000
```

在另一个终端检查健康和模型名：

```bash
curl -fsS http://127.0.0.1:8000/health
curl -fsS http://127.0.0.1:8000/v1/models
```

准备一张自己有权使用的 PNG 图片，将下方 `your-image.png` 换成它的路径。示例在请求内发送图片数据，不要求服务从外网下载图片：

```bash
python3 - your-image.png 'OCR:' <<'PY'
import base64
import json
import sys
import urllib.request
from pathlib import Path

image_path, prompt = sys.argv[1:]
image_data = base64.b64encode(Path(image_path).read_bytes()).decode("ascii")
payload = {
    "model": "PaddleOCR-VL-1.5-0.9B",
    "messages": [{"role": "user", "content": [
        {"type": "image_url", "image_url": {"url": "data:image/png;base64," + image_data}},
        {"type": "text", "text": prompt},
    ]}],
    "temperature": 0,
    "max_tokens": 512,
}
request = urllib.request.Request(
    "http://127.0.0.1:8000/v1/chat/completions",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(request, timeout=120) as response:
    result = json.load(response)
print(result["choices"][0]["message"]["content"])
print("finish_reason:", result["choices"][0]["finish_reason"])
PY
```

可以将提示改成 `Table Recognition:` 或 `Formula Recognition:`，并使用对应内容的图片。检查识别内容、行列或公式本身是否正确；`finish_reason` 为 `length` 时可能发生截断。测试完后在转发终端按 `Ctrl+C`。

## 7 实际验证结果

本次从集群内 Service 对三张合成图片各请求一次，均返回 HTTP 200：文字图中的随机码和数字正确，表格的三列与两条数据行对应正确，公式识别结果与原式数学等价。请求没有重试。

表格返回了带 `<fcel>` 和 `<nl>` 的结构化文本，而不是直接返回 HTML。实际核对时，先参考[官方解析实现](https://github.com/PaddlePaddle/PaddleX/blob/release/3.4/paddlex/inference/pipelines/paddleocr_vl/uilts.py)识别单元格和换行，再逐格比较；不要把特殊标记直接当成识别内容。涉及合并单元格等复杂表格时，应使用与版本匹配的完整解析逻辑。

公式结果包含 LaTeX 的显示和字体包装，去除这些不改变数学含义的包装后，与图片中的等式一致。验证的是原响应内容，没有为了通过而重发图片。

## 8 这些结果不代表什么

三张合成图片只证明本次环境中的基础元素识别。真实拍照、倾斜文档、复杂表格、多页 PDF、阅读顺序、跨页合并、并发、吞吐和长期运行仍需要单独验证。

本次容器的共享内存为64 MiB，小样启动和识别没有出现相关错误；这不是所有图片尺寸或并发场景都足够的保证。如果遇到共享内存错误，应先结合日志、容器配置和环境评估，不要随意修改宿主机或其他服务。

对外提供服务时，还要另行设计身份认证、访问范围、加密、限流和审计；示例中的集群内 Service 不是完整的安全接入方案。
