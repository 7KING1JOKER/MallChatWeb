/**
 * WebSocket 服务端 → 客户端 推送类型枚举
 * 与后端 WSRespTypeEnum.java 严格对齐
 */
export enum WsResponseMessageType {
  /** 1.登录二维码返回 */
  LOGIN_URL = 1,
  /** 2.用户扫描成功等待授权 */
  LOGIN_SCAN_SUCCESS = 2,
  /** 3.用户登录成功返回用户信息 */
  LOGIN_SUCCESS = 3,
  /** 6.使前端的token失效 */
  INVALIDATE_TOKEN = 6,
  /** 20.新消息推送 */
  MESSAGE_CREATE = 20,
  /** 21.消息编辑推送 */
  MESSAGE_UPDATE = 21,
  /** 22.消息删除推送 */
  MESSAGE_DELETE = 22,
  /** 23.Reaction 添加推送 */
  REACTION_ADD = 23,
  /** 24.Reaction 移除推送 */
  REACTION_REMOVE = 24,
  /** 25.输入中开始推送 */
  TYPING_START_PUSH = 25,
  /** 26.输入中停止推送 */
  TYPING_STOP_PUSH = 26,
  /** 30.成员加入推送 */
  MEMBER_JOIN = 30,
  /** 31.成员离开推送 */
  MEMBER_LEAVE = 31,
  /** 32.成员被踢推送 */
  MEMBER_KICK = 32,
  /** 34.话题创建推送 */
  THREAD_CREATE = 34,
  /** 40.用户上线推送 */
  USER_ONLINE = 40,
  /** 41.用户离线推送 */
  USER_OFFLINE = 41,
  /** 50.频道创建推送 */
  CHANNEL_CREATE = 50,
  /** 51.频道更新推送 */
  CHANNEL_UPDATE = 51,
  /** 52.频道删除推送 */
  CHANNEL_DELETE = 52,
  /** 53.服务器更新推送 */
  SERVER_UPDATE = 53,
  /** 99.错误推送 */
  ERROR = 99,
}

/**
 * WebSocket 客户端 → 服务端 请求类型枚举
 * 与后端 WSReqTypeEnum.java 严格对齐
 */
export enum WsRequestMsgType {
  /** 1.登录认证（请求二维码） */
  LOGIN = 1,
  /** 2.心跳 */
  HEARTBEAT = 2,
  /** 4.发送消息 */
  SEND_MESSAGE = 4,
  /** 5.订阅频道 */
  SUBSCRIBE_CHANNEL = 5,
  /** 6.取消订阅频道 */
  UNSUBSCRIBE_CHANNEL = 6,
  /** 7.订阅话题 */
  SUBSCRIBE_THREAD = 7,
  /** 8.取消订阅话题 */
  UNSUBSCRIBE_THREAD = 8,
  /** 9.输入中开始 */
  TYPING_START = 9,
  /** 10.输入中停止 */
  TYPING_STOP = 10,
}

/** WS 请求消息信封 */
export type WsReqMsgContentType = {
  type: WsRequestMsgType
  data?: Record<string, unknown>
}

// ==================== WS Payload 类型（字段名与后端 WSAdapter 严格对齐） ====================

/** type=1 登录二维码返回（对应 WSLoginUrl） */
export type LoginInitResType = { loginUrl: string }

/** type=3 登录成功（对应 WSLoginSuccess） */
export type LoginSuccessResType = {
  /** 用户 ID */
  uid: number
  /** 头像 URL */
  avatar: string
  /** 用户名称 */
  name: string
  /** JWT Token */
  token: string
  /** 权限等级 */
  power?: number
}

/** type=20 新消息推送 — 完整 MessageVO 对象，见 types.ts */

/** type=21 消息编辑推送 — 完整 MessageVO 对象（通过 id 字段识别消息） */

/** type=22 消息删除推送 */
export type MessageDeletePayload = {
  /** 消息 ID */
  msgId: number
  /** 频道 ID */
  channelId: number
}

/** type=23/24 Reaction 添加/移除推送 */
export type ReactionPayload = {
  /** 消息 ID */
  messageId: number
  /** emoji 字符（后端字段名 "e"） */
  e: string
  /** 操作用户 ID */
  uid: number
  /** 当前 emoji 总数 */
  count: number
}

/** type=25/26 输入状态推送 */
export type TypingPayload = {
  /** 频道 ID（后端字段名 "cid"） */
  cid: number
  /** Thread ID（后端字段名 "tid"） */
  tid: number
  /** 用户 ID */
  uid: number
}

/** type=30 成员加入推送 — 完整 MemberVO 对象（含 userId, nickname, avatar, roles 等） */

/** type=31/32 成员离开/被踢推送 */
export type MemberLeaveKickPayload = {
  /** 服务器 ID（后端字段名 "sid"） */
  sid: number
  /** 用户 ID */
  uid: number
}

/** type=34 话题创建推送 — 完整 ThreadVO 对象，见 types.ts */

/** type=40/41 在线/离线状态推送 */
export type OnOffLinePayload = {
  /** 用户 ID */
  uid: number
}

/** type=50/51 频道创建/更新推送 — 完整 ChannelVO 对象，见 types.ts */

/** type=52 频道删除推送 */
export type ChannelDeletePayload = {
  /** 频道 ID（后端字段名 "cid"） */
  cid: number
}

/** type=53 服务器更新推送 — 完整 ServerVO 对象，见 types.ts */
