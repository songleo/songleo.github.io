---
layout: post
title: docker部署llm
date: 2026-04-18 00:12:05
---

## docker image准备

```
docker pull swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/vllm/vllm-openai:latest
docker tag swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/vllm/vllm-openai:latest vllm-openai:latest
```

## 启动llm

```
docker run --rm -d --gpus all `
    --shm-size=30g `
    -p 8000:8000 `
    --ipc=host `
    -v D:/ai-learning/model/DeepSeek-R1-Distill-Qwen-1.5B:/models/DeepSeek-R1-Distill-Qwen-1.5B `
    vllm-openai:latest `
    --model /models/DeepSeek-R1-Distill-Qwen-1.5B `
    --gpu-memory-utilization 0.9 `
    --swap-space 20 `
    --max-model-len 8192 `
    --dtype half `
    --max-num-seqs 10
```

## 验证

```
$ curl http://192.168.0.122:8000/v1/chat/completions -H "Content-Type: application/json" -d "{\"model\":\"/models/DeepSeek-R1-DistillQwen-1.5B\",\"messages\":[{\"role\":\"user\",\"content\":\"你好，请介绍一下自己\"}],\"max_tokens\":100}"
{
  "id": "chat-d8e563fc13094ce195f9b661a376a33e",
  "object": "chat.completion",
  "created": 1776502168,
  "model": "/models/DeepSeek-R1-Distill-Qwen-1.5B",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "<think>\n\n</think>\n\n你好！我是DeepSeek-R1，一个由深度求索公司开发的智能助手，我会尽我所能为您提供帮助。请问有什么可以为您服务的？",
        "tool_calls": [

        ]
      },
      "logprobs": null,
      "finish_reason": "stop",
      "stop_reason": null
    }
  ],
  "usage": {
    "prompt_tokens": 7,
    "total_tokens": 45,
    "completion_tokens": 38
  },
  "prompt_logprobs": null
}
```

## 总结

- gpu驱动版本需要更新，否则vllm不支持
- 参数需要调整，否则gpu oom
- 大模型通过国内镜像下载
- vllm通过国内镜像下载
