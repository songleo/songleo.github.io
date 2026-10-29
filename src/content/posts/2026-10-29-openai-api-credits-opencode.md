---
title: "领取 openai api 额度，在 windows 上使用 opencode"
description: "介绍符合条件的 chatgpt 订阅如何领取 openai api 额度、创建 api key，并在 windows 上连接 opencode 和验证模型。"
pubDatetime: 2026-10-29T23:00:00+08:00
tags: ["ai", "chatgpt", "工具", "学习笔记"]
draft: true
---

最近 openai 为符合条件的 chatgpt pro 和 business 订阅提供了 api 额度。我想试试：领取后，能不能用它连接一个自己选择的编程工具？于是，我在 windows 上安装了 opencode，接入 openai，并测试了三个模型。

这篇文章记录从领取额度、创建 api key 到连接 opencode 的过程。如果你刚接触 opencode，也可以先看[从零开始使用 opencode：安装、实战与进阶](/posts/2026-10-29-opencode-beginner-to-advanced/)。

本文根据 2026 年 10 月 29 日查阅的官方资料和本机实测整理，opencode 使用 2.2.1 版本。福利条件、界面、模型和价格可能变化，操作时请以官方页面和自己账户中的信息为准。

## 1 先弄清楚：额度、密钥和工具分别是什么

可以把这个过程想成使用一个需要凭证的服务：openai 提供模型接口，api key 让应用证明自己有权访问，api 额度用于抵扣符合条件的调用费用。opencode 则是使用这些模型的编程助手。

| 名称 | 作用 |
| --- | --- |
| chatgpt 订阅 | 在符合活动条件时，可作为领取 api 额度的资格来源 |
| api 组织和项目 | 管理 api 账户、项目、密钥及相关用量；额度发放到关联的组织 |
| api 额度 | 抵扣关联组织中符合条件的 api 使用费用，有有效期 |
| api key | 应用访问 api 的凭据，不是额度本身，应像密码一样保管 |
| opencode | 可连接模型、读取项目文件并在授权范围内辅助编程的工具 |

**有 chatgpt 订阅不等于自动有 api 额度，创建 api key 也不等于获得额度。** 需要先确认福利资格、完成关联并查看到账情况。

## 2 谁可以领取，能领多少

根据 [openai 官方说明](https://developers.openai.com/api/docs/guides/chatgpt-api-credits)，这项福利面向符合条件的付费 chatgpt pro 和 business 订阅。领取时需要满足以下条件：

- 符合条件的付费订阅已持续有效至少 7 天；免费试用和赠送订阅不符合条件。
- 领取者是个人订阅的所有者或 business 工作区的所有者，同时也是接收额度的 api 组织所有者。
- 关联时使用的 chatgpt 账户和 api 账户邮箱相同。
- plus、go 和 free 不属于这项福利的合格订阅。

官方列出的完整周期额度如下，金额单位为美元：

| 订阅或席位 | 完整周期 api 额度 |
| --- | ---: |
| pro 100 美元档 | 每月 100 美元 |
| pro 200 美元档 | 每月 200 美元 |
| pro 500 美元档 | 每月 500 美元 |
| business standard | 每个付费席位每月 20 美元 |
| business premium | 每个付费席位每月 100 美元 |

business 的额度按工作区合并，每月上限 500 美元。首次领取时，额度按当前计费周期的剩余时间折算，不一定是表中的完整金额。按月计费的未用额度在周期结束时过期，不会滚存；business 年付工作区的发放和到期按年度周期处理。福利继续提供且订阅仍符合条件时，关联后续订阅周期会自动发放额度。具体以领取页面展示的金额、时间和条款为准。

这是一项**订阅福利中的免费 api 额度**，不是免费订阅，也不增加 chatgpt 或登录版 codex 的使用限额。官方还说明，使用 api key 的 codex 调用不包含在这项福利的覆盖范围内；本文介绍的是 opencode 连接 openai api 的方式。[查看福利范围](https://developers.openai.com/api/docs/guides/chatgpt-api-credits)

## 3 领取额度并确认到账

领取前，先确认自己希望哪个 api 组织接收额度。额度只属于关联的组织；如果有多个组织，不要只看账户邮箱就认为选对了。

可以从 chatgpt 开始：

1. 登录符合条件的 chatgpt 账户。
2. 个人 pro 订阅进入 **Settings → Billing**；business 工作区进入相应的账单设置。
3. 找到 api credits 福利入口，开始领取流程。
4. 核对接收额度的 api 组织、展示的额度与有效期，再按页面提示确认关联。
5. 打开 [api platform 的 billing 页面](https://platform.openai.com/settings/organization/billing/overview)，选择刚才关联的组织，在 credit grants 中检查是否到账、可用金额和到期时间。

也可以从 api platform 的 billing 入口开始，选择自己拥有的组织，再关联符合条件的 chatgpt 订阅。新用户可按页面提示关联个人 api 组织。界面名称可能变化，具体步骤参考[官方领取说明](https://developers.openai.com/api/docs/guides/chatgpt-api-credits)。

如果找不到入口，先检查订阅类型、是否满 7 天、邮箱和两个组织的所有者身份。不要把“可以登录”或“有 api key”当作额度已经到账的证据。

## 4 在关联组织中创建 api key

1. 登录 [openai api platform](https://platform.openai.com/)，确认当前选择的是收到额度的组织。
2. 进入目标项目的 api keys 管理页面，选择创建新的密钥。首次使用时按页面提示选择或创建项目。
3. 为密钥起一个便于识别用途的名字，并按页面提供的选项设置适当权限和有效期。
4. 创建后按提示安全保存密钥，再用于连接 opencode。官方入口可从 [api 快速入门](https://developers.openai.com/api/docs/quickstart)进入。

密钥关联的项目应属于已领取额度的组织。不要把真实密钥写进博客、代码、截图或提交到 git，也不要发给他人。如果怀疑泄露，应在平台撤销并更换密钥。本文不会展示真实密钥。

## 5 在 windows 上安装并连接 opencode

opencode 提供终端版和桌面版，可以按自己的习惯选择。本次模型调用是在 windows cli 2.2.1 上验证的；下面也介绍桌面版的安装与连接方式。

### 5.1 安装桌面版

1. 打开 [opencode 官方下载页面](https://opencode.ai/download)，在 **OpenCode Desktop** 中选择适合电脑的 Windows x64 或 ARM64 安装包。
2. 下载完成后运行安装程序，按照界面提示完成安装，再从开始菜单打开 opencode。桌面端有自己的安装程序，不需要先安装 npm 才能使用图形界面。
3. 在桌面端选择或打开项目目录，检查当前连接的服务和模型，发送一条简短消息验证。首次连接时，可在界面中找到 provider 连接入口，选择 openai 的 api key 认证，按提示输入密钥；已有认证时先检查是否已可用，避免重复配置。

在同一 windows 用户下，桌面端和 cli 使用同一个本地服务时，通常可以共享认证和全局模型配置，不需要分别粘贴 api key。比如已经在 cli 中配置了默认模型，可在桌面端查看模型选择器和新会话的模型是否符合预期。已有会话的模型选择、项目配置、连接到其他服务或使用不同账户等情况可能影响结果；连接 WSL 或远程服务时也不要假设会自动共享 windows 本地配置。

建议桌面端和 cli 使用兼容的 2.x 版本，不要把旧的 1.x 与 2.x 随意混用。配置共享是否生效，以自己的桌面端实际显示和一次简短调用为准；本文此前列出的三个 `OK` 是 cli 实测结果，不代表已经分别在桌面端验证。

### 5.2 安装 cli 并连接

在 vscode 选择“终端 → 新建终端”，先确认 node.js 和 npm 可用：

```powershell
node --version
npm.cmd --version
```

如果没有安装 node.js，可先从 [node.js 官网](https://nodejs.org/)安装，然后重新打开终端。本次使用官方的 opencode 2.x npm 包，优先尝试国内镜像：

```powershell
npm.cmd install -g @opencode/cli@latest --registry=https://registry.npmmirror.com
opencode --version
```

如果国内镜像不可用或没有所需版本，可以使用官方 npm 源：

```powershell
npm.cmd install -g @opencode/cli@latest
```

本机安装后显示 `opencode v2.2.1`。`@latest` 将来会指向更新版本，因此读者的版本可能不同；如果终端找不到命令，重新打开终端，并检查 npm 全局命令目录是否在 `PATH` 中。2.x 安装方式可参考 [opencode 官方仓库](https://github.com/anomalyco/opencode)。

然后启动 opencode：

```powershell
opencode
```

在 opencode 中输入 `/connect`，选择 openai，按界面提示选择 api key 认证并输入刚创建的密钥；再输入 `/models` 选择模型。这里选择的是 **api key 认证**；如果选择使用 chatgpt 登录，走的是另一种认证和用量方式。界面可能随版本变化，可查看 [opencode provider 文档](https://opencode.ai/v2/docs/providers/)。

连接后，可在普通终端查看认证状态。注意不要运行会输出完整凭据的导出命令，也不要把认证存储文件提交到仓库。

```powershell
opencode auth list
opencode models
```

## 6 选择模型并验证

本次在 windows 上使用已连接的 openai api key，分别向下面三个模型发送了简短请求，每个模型都返回 `OK`：

| 模型 | 本次结果 |
| --- | --- |
| `openai/gpt-6.1-terra` | 简短请求成功，设为本机默认模型 |
| `openai/gpt-6.1-sol` | 简短请求成功 |
| `openai/gpt-6-astra` | 简短请求成功 |

你可以在 opencode 中通过 `/models` 选择，也可以在普通终端指定模型做一次简单验证：

```powershell
opencode run --standalone -m openai/gpt-6.1-terra "Reply with exactly OK. Do not use tools."
opencode run --standalone -m openai/gpt-6.1-sol "Reply with exactly OK. Do not use tools."
opencode run --standalone -m openai/gpt-6-astra "Reply with exactly OK. Do not use tools."
```

这三次请求会产生 api 用量，具体费用和可用性取决于账户、模型权限及当时的价格。模型出现在列表中不保证你的账户一定能调用；返回 `OK` 也只是连通性验证，不代表完成了编程质量或完整工作流测试。

如果希望新会话默认使用 `gpt-6.1-terra`，可以在用户目录的 `~/.config/opencode/opencode.json` 中设置 `model`。如果文件已有内容，请保留原有配置并只调整对应字段；不要覆盖其他设置。下面是一个新文件的最小示例，里面没有密钥：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "openai/gpt-6.1-terra"
}
```

已选过模型的会话可能继续使用该会话的选择；默认配置主要影响新的工作。项目配置也可能覆盖用户配置。[模型配置说明](https://opencode.ai/v2/docs/models/)

本次测试证明三个模型当时都能通过该密钥响应；**没有核对这几次请求实际抵扣的是赠送额度还是组织内其他 api 余额**。要确认自己的赠送额度是否被使用，应同时查看关联组织的 credit grants、usage 和账单记录，注意用量报告中的标价与实际抵扣后的现金费用不是同一回事。

## 7 费用和常见问题

使用前建议先看 [api 价格](https://developers.openai.com/api/docs/pricing)和账户内的额度、有效期、模型权限与限速。即使有赠送额度，api 请求仍有相应价格，额度按适用规则抵扣。

**没有绑定 api 支付方式，也能用吗？** 官方说明，有有效的免费额度时不需要另加 api 支付方式。组织会先使用免费额度；免费额度耗尽后，如果还有已购买的 api 额度，请求可能继续消耗付费余额；如果没有余额，请求会失败。自动充值和购买额度是另行决定的操作，开启前要核对设置。

**为什么有额度却不能用某个模型？** 额度不等于模型权限，也不会取消组织、项目、模型的速率限制。先确认当前项目属于关联组织，再检查模型权限、报错和限速。

**连接失败怎么检查？** 先确认选的是 openai 的 api key 认证、密钥仍有效、网络可以访问服务，以及所选模型在当前项目中可用。`401` 通常与认证有关；`429` 可能是余额不足，也可能是速率限制，应查看具体错误码。参考 [openai 错误码说明](https://developers.openai.com/api/docs/guides/error-codes)。

从我的这次尝试看，把额度领取、组织关联、密钥创建和工具连接分开检查，会更容易判断问题出在哪一步。先用简短请求验证，再进入实际项目，也能避免把一次“能返回”误认为整个开发流程已经验证完成。
