<p align="center">
  <h1 align="center">Community Platform — 社群平台</h1>
  <p align="center"><strong>Discord-like 社群平台前端，供软件实训课程使用。<br>基于 MallChat Web 重构，支持 Server → Category → Channel → Thread 嵌套社群结构 + RBAC 权限系统。</strong></p>
</p>

<div align="center">
  <a href="https://github.com/Evansy/MallChatWeb"><img src="https://img.shields.io/badge/github-项目地址-yellow.svg?style=plasticr"></a>
  <a href="https://github.com/Evansy/MallChatWeb/actions/workflows/deploy.yml" target="_blank">
    <img alt="Deploy" src="https://github.com/Evansy/MallChatWeb/actions/workflows/deploy.yml/badge.svg?branch=main">
  </a>
  <a href="https://github.com/Evansy/MallChatWeb/commits" target="_blank">
    <img alt="Commit" src="https://img.shields.io/github/commit-activity/m/Evansy/MallChatWeb">
  </a>
  <a href="https://github.com/Evansy/MallChatWeb/blob/master/LICENSE" target="_blank">
    <img alt="License: Apache-2.0" src="https://img.shields.io/badge/License-Apache--2.0-blue.svg">
  </a>
</div>

---

## 项目介绍

社群平台是一个 **Discord-like** 实时社群系统，支持多层嵌套社群结构（Server → Category → Channel → Thread）和基于位图的 14 位 RBAC 权限系统。

本项目是社群平台前端，从 [MallChat Web](https://github.com/Evansy/MallChatWeb)（扁平群聊）渐进式重构而来。通用组件（VirtualList / RenderMessage / Avatar）和工具函数直接复用，Store 和 View 层重写。

### 后端项目

后端地址：`E:\Learn_zone\Code_zone\IDEA_code\community-platform\`

后端技术栈：Java 21 + Spring Boot 3.3.5 + Spring Cloud 2023.0.3 + Nacos + MySQL + Redis + RocketMQ + Elasticsearch + MinIO + Netty WebSocket

---

## 与 MallChat 的关系

| 维度 | MallChat 前端 | 社群平台前端 |
|------|-------------|------------|
| 导航模型 | 会话列表（单聊 + 群聊） | Server 图标列表 → 频道树 |
| 消息归属 | `roomId` | `channelId` + 可选 `threadId` |
| 成员管理 | 群成员列表 + 简单角色 | RBAC 14 位权限 + 频道级覆盖 |
| 登录方式 | 微信扫码 | 微信扫码（**完全复用**） |
| 文件上传 | 后端中转 | MinIO 预签名直传 |
| 消息类型 | 8 种（含视频/表情包） | 5 种（Text / Image / File / Sound / System） |
| 好友系统 | 有 | **无** |
| 未读追踪 | 会话级 | 频道级（`channel_read_state`） |

### 复用策略

```
✅ 直接复用（18 个）：  LoginBox / VirtualList / RenderMessage(text/image/file/voice) / Avatar / Icon /
                      路由守卫 / notification / worker.ts / ws.ts(Store) / 等
🔧 微调可用（14 个）：  computedTime / eventBus / user.ts(Store) / emoji.ts(Store) / useCached / 等
🔧 重写（10 个）：      types.ts / urls.ts / apis.ts / enums / chat.ts(Store) / server.ts(Store) /
                      global.ts(Store) / wsType.ts / websocket.ts / useUpload.ts
❌ 废弃删除（12 个）：  contacts.ts / group.ts(Store) / Contacts/ / VideoPlayer / AddFriendModal / 等
```

---

## 技术栈

| 技术 | 说明 | 官网 |
|:----:|------|------|
| Vue 3 | 前端流行开发框架 | [https://cn.vuejs.org](https://cn.vuejs.org) |
| TypeScript | 类型安全的 JavaScript | [https://www.typescriptlang.org](https://www.typescriptlang.org) |
| Pinia | Vue 3 官方推荐状态管理 | [https://pinia.vuejs.org](https://pinia.vuejs.org) |
| vue-router | Vue 官方路由 | [https://router.vuejs.org](https://router.vuejs.org) |
| Alova | 轻量级请求策略库 | [https://alova.js.org](https://alova.js.org) |
| Vite | 极速前端打包构建工具 | [https://cn.vitejs.dev](https://cn.vitejs.dev) |
| pnpm | 快速、节省磁盘空间的包管理器 | [https://www.pnpm.cn](https://www.pnpm.cn) |
| Web Worker | WebSocket 双线程架构 | — |
| SCSS | CSS 预处理器 | [https://sass-lang.com](https://sass-lang.com) |

---

## 快速开始

### 环境要求

- Node.js 16.18+
- pnpm（安装完 Node 后执行 `npm i -g pnpm`）

### 安装与启动

```bash
# 1. 安装依赖
pnpm i

# 2. 启动开发服务器（F5 自动执行 pnpm run dev 并打开浏览器）
pnpm run dev

# 3. 构建生产版本
pnpm build
```

### 部署

- **本地部署**：执行 `pnpm build`，将 `dist/` 放到服务器并配置 nginx
- **自动 CI/CD**：通过 GitHub Actions 在代码提交后自动构建部署，详见 [deploy.yml](.github/workflows/deploy.yml)

---

## 项目结构

```
MallChatWeb/
├── public/                          # 静态资源
├── src/
│   ├── assets/                      # 资源文件（图标/样式）
│   ├── components/                  # 通用组件
│   │   ├── VirtualList/             # ✅ 复用 — 虚拟滚动列表
│   │   ├── RenderMessage/           # ✅ 复用 — 消息渲染（text/image/file/voice）
│   │   ├── Avatar/                  # ✅ 复用 — 头像组件
│   │   ├── Icon/                    # ✅ 复用 — 图标组件
│   │   ├── LoginBox/                # ✅ 复用 — 微信扫码登录 UI
│   │   ├── PasteImageDialog/        # ✅ 复用 — 粘贴图片弹窗
│   │   └── UserSettingBox/          # 🔧 微调 — 用户设置面板
│   ├── views/                       # 页面视图
│   │   ├── Home/
│   │   │   ├── index.vue            # 🔧 重写 — 布局：Server 列表 + 内容区
│   │   │   ├── Discover/            # 🆕 新增 — 公开服务器发现页
│   │   │   ├── Server/              # 🆕 新增 — 服务器主视图
│   │   │   │   ├── index.vue        #   频道面板 + 内容区（router-view）
│   │   │   │   ├── ChannelView/     #   频道消息视图（消息列表 + 输入框）
│   │   │   │   ├── Settings/        #   服务器设置（概览/角色/表情/邀请）
│   │   │   │   ├── MemberList/      #   成员列表页
│   │   │   │   └── Search/          #   消息搜索页
│   │   │   └── Chat/                # 🔧 重写 — 频道消息区组件
│   │   │       ├── ChatList/        #   消息列表 + 消息项 + 右键菜单
│   │   │       ├── ChatBox/         #   消息输入框 + @mention + 附件
│   │   │       └── components/      #   SideBar / UserList / ThreadPanel 等
│   │   └── ...                      #   废弃页面（Contacts 等）
│   ├── stores/                      # Pinia 状态管理
│   │   ├── chat.ts                  # 🔧 重写 — 频道消息 + Thread 消息
│   │   ├── server.ts                # 🆕 新建 — Server/成员/角色/权限
│   │   ├── global.ts                # 🔧 重写 — 导航状态（currentServerId/ChannelId/ThreadId）
│   │   ├── user.ts                  # 🔧 微调 — 用户信息
│   │   ├── emoji.ts                 # 🔧 微调 — Server 级表情
│   │   ├── ws.ts                    # ✅ 保留 — 登录流程 + 状态机
│   │   └── ...                      #   其他 Store
│   ├── services/                    # API 层
│   │   ├── types.ts                 # 🔧 重写 — CursorPage / ServerVO / ChannelVO / MessageVO / PermissionBit 等
│   │   ├── urls.ts                  # 🔧 重写 — 50+ 端点，/api/v1/ 前缀
│   │   ├── apis.ts                  # 🔧 重写 — 50+ API 函数
│   │   └── request.ts               # ✅ 保留 — alova 实例 + token 注入
│   ├── enums/                       # 枚举
│   │   └── index.ts                 # 🔧 重写 — MsgEnum / PermissionBit（14 位）/ ChannelType
│   ├── utils/                       # 工具函数
│   │   ├── wsType.ts                # 🔧 重写 — WS 协议：C→S 9 种 + S→C 20 种
│   │   ├── websocket.ts             # 🔧 重写 — Worker 架构保留，20 分支 switch-case
│   │   ├── computedTime.ts          # 🔧 微调 — 时间间隔计算
│   │   ├── eventBus.ts              # 🔧 微调 — 事件总线
│   │   └── ...                      # ✅ 保留 — notification / copy / unique / detectDevice 等
│   ├── hooks/                       # 组合式函数
│   │   ├── useUpload.ts             # 🔧 重写 — MinIO 预签名三阶段上传
│   │   ├── useRecording.ts          # ✅ 保留 — 录音
│   │   ├── useDownload.ts           # ✅ 保留 — 下载
│   │   ├── useCached.ts             # 🔧 微调 — 缓存 Hook
│   │   └── useReaction.ts           # 🆕 新建 — Reaction toggle
│   ├── router/                      # 路由
│   │   ├── index.ts                 # 🔧 重写 — 嵌套路由（Discover → Server → Channel → Settings）
│   │   └── guard/                   # ✅ 保留 — 路由守卫
│   ├── worker/                      # Web Worker
│   │   └── index.ts                 # ✅ 保留 — Worker 初始化
│   └── App.vue
├── .github/workflows/               # CI/CD 配置
└── docs/                            # 文档
```

---

## 社群嵌套模型

```
Server (服务器)
├── Category A (分类："学习区")
│   ├── Channel #闲聊 (TEXT, 公开)
│   ├── Channel #问答 (TEXT, Thread-only)
│   └── Channel #资源 (TEXT, 可发文件)
├── Category B (分类："管理区")
│   ├── Channel #公告 (TEXT, 仅管理员)
│   └── Channel #管理讨论 (TEXT, 仅特定角色)
└── (无分类的频道也可直接挂在 Server 下)
```

## RBAC 权限位图（14 位）

| 权限位 | 值 | 说明 |
|--------|-----|------|
| ADMINISTRATOR | `0x0001` | 管理员（全部权限，短路判断） |
| MANAGE_SERVER | `0x0002` | 管理服务器 |
| MANAGE_ROLES | `0x0004` | 管理角色 |
| MANAGE_CHANNELS | `0x0008` | 管理频道 |
| KICK_MEMBERS | `0x0010` | 踢出成员 |
| BAN_MEMBERS | `0x0020` | 封禁成员 |
| CREATE_INVITE | `0x0040` | 创建邀请 |
| MANAGE_EMOJIS | `0x0080` | 管理表情 |
| SEND_MESSAGES | `0x0100` | 发送消息 |
| EMBED_LINKS | `0x0200` | 嵌入链接 |
| ATTACH_FILES | `0x0400` | 上传附件 |
| READ_MESSAGE_HISTORY | `0x0800` | 读取历史消息 |
| USE_EXTERNAL_EMOJIS | `0x1000` | 使用外部表情 |
| MENTION_EVERYONE | `0x2000` | @全体成员 |

**权限计算**：`effectivePermissions = (所有角色 permissions 的 OR) ⊕ 频道级覆盖 (allow/deny)`

含 `ADMINISTRATOR` 位则直接放行，无需逐位检查。

---

## 路由树

```
/                                          → Discover（公开服务器发现页）
/servers/:serverId                         → Server 主视图
  /servers/:serverId/channels/:channelId   → 频道消息视图
  /servers/:serverId/settings              → 服务器设置（子路由：overview / roles / emoji / invites）
  /servers/:serverId/members               → 成员列表
  /servers/:serverId/search                → 消息搜索
/*                                          → 重定向到 /
```

---

## WebSocket 协议

### 连接

```
ws://host:8090/ws?token=<JWT>
```

- Token 通过 URL 参数传递
- Netty IdleStateHandler 30s 心跳检测
- 基于 Web Worker 的双线程架构

### 客户端 → 服务端（9 种）

| type | 枚举名 | payload | 触发时机 |
|------|--------|---------|----------|
| 1 | `REQUEST_LOGIN_QRCODE` | 无 | 建立连接后立即发送 |
| 2 | `HEARTBEAT` | 无 | 定时心跳 |
| 3 | `AUTHORIZE` | `{token}` | 已有 token 时认证 |
| 10 | `SUBSCRIBE_CHANNEL` | `{channelIds: number[]}` | 进入服务器后批量订阅 |
| 12 | `UNSUBSCRIBE_CHANNEL` | `{channelIds: number[]}` | 离开服务器/切换频道 |
| 13 | `TYPING_START` | `{channelId}` | 输入框聚焦（防抖 2s） |
| 14 | `TYPING_STOP` | `{channelId}` | 输入框失焦或发送消息 |
| 18 | `SUBSCRIBE_THREAD` | `{threadId}` | 进入 Thread 视图 |
| 19 | `UNSUBSCRIBE_THREAD` | `{threadId}` | 离开 Thread 视图 |

### 服务端 → 客户端（20 种）

| type | 枚举名 | payload | 说明 |
|------|--------|---------|------|
| 1 | `LOGIN_URL` | `{url}` | 返回登录二维码 URL |
| 2 | `LOGIN_SCAN_SUCCESS` | — | 扫码成功 |
| 3 | `LOGIN_SUCCESS` | `{token, uid}` | 登录成功，返回 JWT |
| 4 | `MESSAGE` | `MessageVO` | 新消息推送 |
| 5 | `ONLINE_OFFLINE` | `{uid, online}` | 在线状态变更 |
| 6 | `INVALIDATE_TOKEN` | — | Token 失效 |
| 11 | `SUBSCRIBE_ACK` | `{channelIds}` | 订阅确认 |
| 15 | `THREAD_CREATE` | `ThreadVO` | Thread 创建通知 |
| 16 | `REACTION_UPDATE` | `{msgId, reactions}` | Reaction 更新 |
| 17 | `TYPING_INDICATOR` | `{channelId, uid, userName}` | 输入中提示 |
| 20 | `MEMBER_JOIN` | `MemberVO` | 成员加入 |
| 21 | `MEMBER_LEAVE` | `{uid}` | 成员离开 |
| 22 | `MEMBER_KICK` | `{uid}` | 成员被踢出 |
| 23 | `ROLE_UPDATE` | `{uid, roles}` | 角色变更 |
| 24 | `CHANNEL_UPDATE` | `ChannelVO` | 频道更新 |
| 25 | `SERVER_UPDATE` | `ServerVO` | 服务器更新 |
| 26 | `MESSAGE_EDIT` | `{msgId, content}` | 消息编辑 |
| 27 | `MESSAGE_DELETE` | `{msgId}` | 消息删除 |
| 28 | `THREAD_UPDATE` | `ThreadVO` | Thread 更新 |
| 29 | `MEMBER_UPDATE` | `MemberVO` | 成员信息更新 |

---

## API 概览

完整接口文档启动后端后访问 `http://localhost:8080/doc.html` (Knife4j)

| 模块 | 端点前缀 | 说明 |
|------|----------|------|
| Auth | `GET/POST /api/v1/public/wx/*`、`POST /api/v1/auth/*` | 微信扫码登录、Token 刷新 |
| User | `GET/PUT /api/v1/users/*` | 个人资料 |
| Server | `CRUD /api/v1/servers/*` | 服务器管理 |
| Category | `CRUD /api/v1/servers/{id}/categories/*` | 分类管理 |
| Channel | `CRUD /api/v1/servers/{id}/channels/*` | 频道管理 |
| Member | `CRUD /api/v1/servers/{id}/members/*` | 成员管理 |
| Role | `CRUD /api/v1/servers/{id}/roles/*` | 角色管理 |
| ChannelPerm | `CRUD /api/v1/servers/{id}/channels/{cid}/permissions` | 频道权限覆盖 |
| Message | `CRUD /api/v1/channels/{id}/messages/*` | 消息收发 |
| Thread | `CRUD /api/v1/channels/{id}/threads/*` | 话题管理 |
| Reaction | `POST/DELETE/GET /api/v1/messages/{id}/reactions` | 反应 |
| File | `POST /api/v1/files/*` | MinIO 预签名上传 |
| Emoji | `CRUD /api/v1/servers/{id}/emojis/*` | 表情管理 |
| Invite | `POST/GET /api/v1/servers/{id}/invites/*` | 邀请管理 |
| Unread | `GET /api/v1/servers/{id}/unread` | 未读计数 |
| Search | `GET /api/v1/servers/{id}/search` | 消息搜索（ES） |

### 游标分页

所有列表接口统一使用游标分页：

```
// 请求
GET /api/v1/channels/1/messages?cursor=&pageSize=50

// 响应
{
  "cursor": "1700000000000",
  "isLast": false,
  "list": [ ... ]
}
```

### 文件上传（MinIO 预签名三阶段）

```
1. POST /api/v1/files/presigned  →  获取 { uploadUrl, fileId }
2. PUT 文件到 MinIO（xhr.upload.onprogress 进度条）
3. POST /api/v1/files/confirm    →  确认上传完成
4. 发送消息时附带 fileIds
```

---

## 消息发送全链路

```
POST /api/v1/channels/{id}/messages
  → Token 校验 (JWT)
  → 权限检查 (SEND_MESSAGES)
  → 频控 (@FrequencyControl)
  → 敏感词过滤 (AC 自动机)
  → MySQL 持久化
  → MessageSendEvent → RocketMQ SendMsgConsumer
  → PushConsumer → WS type=4 → 仅推送给订阅了该频道的在线用户
```

与群聊的区别：不再是"房间内全推"，而是按频道订阅推送——客户端通过 `SUBSCRIBE_CHANNEL` (type=10) WS 消息声明订阅哪些频道，只收到相关频道的实时消息。

---

## 开发阶段

```
Phase 0 → API 层对齐            (types + urls + apis + enums)    ██ 地基
Phase 1 → WebSocket 协议升级     (wsType + websocket)             ██ 通信
Phase 2 → Store 重构             (chat + server + global + emoji) ██████ 核心
Phase 3 → 基础视图               (Server 侧边栏 + Channel 面板)     ██████ 核心
Phase 4 → 高级功能               (Thread/Reaction/Role/权限)       ████ 增强
Phase 5 → 收尾完善               (文件上传/搜索/未读/测试)          ██ 交付
```

每个 Phase 结束条件：`pnpm build` 通过 + 本阶段页面可交互验证。

### 三人分工

| 人员 | 职责 | 核心文件 |
|------|------|----------|
| **人员 A** — 基础通信层 | types + urls + apis + enums + wsType + websocket | 10 个文件，定义整个项目的"语言" |
| **人员 B** — 状态逻辑层 | stores + utils + hooks | 16 个文件，最复杂的业务逻辑层 |
| **人员 C** — 视图交互层 | views + router + components + useUpload | ~47 个文件，文件最多 |

```
依赖关系：
  人员A (基础通信层)
   types + urls + apis + enums + wsType + websocket
   ─────────────────────────
        │              │
        ▼              ▼
  人员B (状态逻辑层)  人员C (视图交互层)
   stores + utils     views + router
   + hooks            + components + useUpload
```

---

## 下一步

- [ ] Phase 0：API 层对齐（types + urls + apis + enums）
- [ ] Phase 1：WebSocket 协议升级（wsType + websocket）
- [ ] Phase 2：Store 重构（chat / server / global / user / emoji）
- [ ] Phase 3：基础视图（ServerList + ChannelList + ChatList + ChatBox）
- [ ] Phase 4：高级功能（Thread / Reaction / 成员管理 / 角色权限 / 文件上传）
- [ ] Phase 5：收尾完善（搜索 / 未读追踪 / 在线状态 / 冒烟测试）

---

## License

Apache-2.0
