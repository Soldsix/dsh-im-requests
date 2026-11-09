---
description: "将可信消息来源元数据绑定到实时原生工具执行。"
kind: "package-library"
---
# dsh-im-requests

English | [中文](README.md)

## 摘要

提供方先保留执行对象，接纳已记录的来源后，向工具适配器暴露只读归属服务。ID、复制对象与保留的 Session 记录都不能授予权限。关闭租约或取消其父级后立即撤销访问并中止依赖工作。此库不启动应用、不进行 I/O，也不保留成员文字。

## 目录

- [使用与所有权](#use-and-ownership)
- [隐私与限制](#privacy-and-limits)
- [验证](#verification)

<a id="use-and-ownership"></a>
## 使用与所有权

这是库依赖，不包含 DSH bundle 或可执行入口。从主入口导入 `RequestAuthority` 及其元数据类型。可选入口 `dsh-im-requests/cordis` 只声明 `Context.imRequests`，不会启动服务。可信消息消费插件必须通过自己的 Cordis effect 创建并提供 `authority.service`。

`open(owner, source, signal)` 保留确切的原生执行对象。提供方观察到对应已记录来源后，才能用 `lease.activate()` 发布。随后 `service.current(exec.agent)` 返回冻结的来源和取消信号。重复保留会失败，不覆盖现有请求。`lease.close()` 同步撤销；旧租约不能撤销同一对象后来的保留。提供方关闭时关闭整个 authority。

提供方为群模型历史选择 `sender` 或 `shared` 隔离模式，并必须兑现保证。私聊执行按发送者隔离。工具适配器须从此服务取得会话和请求者，合并其信号与调用信号，在异步工作后确认仍是同一请求，并等待自身取消清理结束。

<a id="privacy-and-limits"></a>
## 隐私与限制

来源元数据仅含调用 ID、完整租户/网络/账号/会话、发送者与来源消息 ID。数据复制并冻结，不保留消息正文或媒体。只读服务不能创建或激活租约。模型 JSON 不能选择执行对象或请求者。同进程 Host 插件属于受信任代码；此库不能沙箱隔离恶意 Host 代码，也不负责归档权限、输出受众、工具允许名单或持久化。

不要将发送者私有历史交给共用群模型 Session，后来的成员可能继承缓存的工具结果。消费方须要求按发送者隔离，或实现等效的请求级上下文过滤。持久化来源字段本身不是认证，恢复 Session 不会重新激活租约。

<a id="verification"></a>
## 验证

运行 `npm ci --ignore-scripts --no-audit --no-fund`、`npm run check`，再运行 `npm run test:coverage`。测试使用虚构身份、取消监听、复用执行对象与独立消费者，不联系 QQ 服务或模型 API。原生提供方和工具组合须另做 profile 验证。

## 模型体验

此库不注册模型工具或提示词。消费工具适配器决定哪些获准数据进入模型，并须通过原生工具流水线记录结果。

## 已知限制与待办

不提供权限数据库、持久化租约、通道登录、模型上下文过滤或自动公共话题记忆。对象身份只在同一个受信任的 Host 进程内有效。

## 开发说明

严格声明和独立安装消费者检查覆盖两个入口。新消费方须使用虚构 profile 测试原生来源接纳、取消、输出受众和发送者隔离。
