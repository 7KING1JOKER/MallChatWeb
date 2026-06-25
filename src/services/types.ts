/**
 * 社群平台前端 — 类型定义文件
 *
 * 所有类型与后端 DTO/VO 字段严格对齐。
 * 注意：请使用TSDoc规范进行注释，以便在使用时能够获得良好提示。
 * @see TSDoc规范https://tsdoc.org/
 */

// ==================== 通用 ====================

/** 游标分页通用响应（替换旧 ListResponse） */
export type CursorPage<T> = {
  /** 游标（下次翻页带上此参数），空字符串表示最后一页 */
  cursor: string
  /** 是否最后一页 */
  isLast: boolean
  list: T[]
}

// ==================== 枚举 ====================

/**
 * 13 位权限位图 (BIGINT 位掩码)
 * 与后端 PermissionBit.java 严格对齐
 */
export enum PermissionBit {
  CREATE_INVITE = 0x0001,       // 1     — 创建邀请
  KICK_MEMBERS = 0x0002,        // 2     — 踢出成员
  BAN_MEMBERS = 0x0004,         // 4     — 封禁成员
  ADMINISTRATOR = 0x0008,       // 8     — 管理员（全部权限）
  MANAGE_CHANNELS = 0x0010,     // 16    — 管理频道
  MANAGE_SERVER = 0x0020,       // 32    — 管理服务器
  ADD_REACTIONS = 0x0040,       // 64    — 添加反应
  SEND_MESSAGES = 0x0080,       // 128   — 发送消息
  USE_THREADS = 0x0100,         // 256   — 使用话题
  EMBED_LINKS = 0x0200,         // 512   — 嵌入链接
  ATTACH_FILES = 0x0400,        // 1024  — 上传文件
  MENTION_EVERYONE = 0x0800,    // 2048  — @全体成员
  MANAGE_ROLES = 0x1000,        // 4096  — 管理角色
}

/**
 * 消息类型枚举
 * 与后端 MessageTypeEnum.java 严格对齐
 */
export enum MessageType {
  TEXT = 1,     // 文本消息
  IMAGE = 2,    // 图片消息
  FILE = 3,     // 文件消息
  SYSTEM = 4,   // 系统消息
  SOUND = 5,    // 语音消息
  EMOJI = 6,    // 表情消息
}

/**
 * 频道类型枚举
 * 与后端 ChannelTypeEnum.java 严格对齐
 */
export enum ChannelType {
  TEXT = 0,     // 文字频道
  VOICE = 1,    // 语音频道（预留）
}

// ==================== 用户 ====================

/** 用户信息（对应后端 UserVO） */
export type UserVO = {
  /** 用户 ID */
  id: number
  /** JWT Token（注册/登录时返回） */
  token?: string
  /** 用户名 */
  username?: string
  /** 昵称 */
  nickname: string
  /** 头像 URL */
  avatar: string
  /** 邮箱 */
  email?: string
  /** 微信 openId */
  openId?: string
  /** 微信 unionId */
  unionId?: string
  /** 性别（0=未设置 1=男 2=女） */
  sex?: number
  /** 状态 */
  status?: number
  /** 创建时间 */
  createTime?: string
}

// ==================== Server / Category / Channel ====================

/** 服务器基本信息（对应后端 ServerVO） */
export type ServerVO = {
  /** 服务器 ID */
  id: number
  /** 服务器名称 */
  name: string
  /** 描述 */
  description?: string
  /** 图标 URL */
  icon?: string
  /** 创建者 ID */
  ownerId: number
  /** 成员数量 */
  memberCount?: number
  /** 创建时间 */
  createTime?: string
}

/**
 * 服务器详情（GET /api/v1/servers/{id} 返回）
 * 对应后端 ServerDetailVO
 */
export type ServerDetailVO = {
  /** 服务器基本信息 */
  server: ServerVO
  /** 分类列表（嵌套频道） */
  categories: CategoryVO[]
  /** 我在该服务器的角色列表 */
  myRoles: RoleVO[]
}

/** 分类（对应后端 CategoryVO） */
export type CategoryVO = {
  /** 分类 ID */
  id: number
  /** 分类名称 */
  name: string
  /** 排序 */
  sortOrder?: number
  /** 分类下的频道列表 */
  channels: ChannelVO[]
}

/** 频道（对应后端 ChannelVO） */
export type ChannelVO = {
  /** 频道 ID */
  id: number
  /** 频道名称 */
  name: string
  /** 频道类型（TEXT=0, VOICE=1） */
  type: number
  /** 频道简介 */
  topic?: string
  /** 排序 */
  sortOrder?: number
}

// ==================== Member / Role / Permission ====================

/** 成员（对应后端 MemberVO） */
export type MemberVO = {
  /** 成员 ID（即 userId） */
  userId: number
  /** 昵称 */
  nickname: string
  /** 头像 URL */
  avatar: string
  /** 服务器内昵称 */
  serverNickname?: string
  /** 成员状态 */
  status?: number
  /** 角色列表 */
  roles: RoleVO[]
}

/** 角色（对应后端 RoleVO） */
export type RoleVO = {
  /** 角色 ID */
  id: number
  /** 角色名称 */
  name: string
  /** 角色颜色（字符串格式，如 "#FF0000"） */
  color?: string
  /** 权限位掩码（13 位） */
  permissions: number
  /** 角色等级 */
  position?: number
}

/** 频道权限覆盖（对应后端 ChannelPermissionVO） */
export type ChannelPermissionVO = {
  /** 覆盖 ID */
  id: number
  /** 频道 ID */
  channelId: number
  /** 目标类型: 0=角色, 1=用户 */
  targetType: number
  /** 角色 ID 或 用户 ID */
  targetId: number
  /** 允许的权限位 */
  allowBits: number
  /** 拒绝的权限位 */
  denyBits: number
}

// ==================== Message / Thread / Reaction ====================

/** 消息发送者（MessageVO 内嵌） */
export type MessageUserVO = {
  id: number
  nickname: string
  avatar: string
}

/** Thread 摘要（MessageVO 内嵌） */
export type ThreadSummaryVO = {
  id: number
  name: string
  messageCount: number
}

/** 消息（对应后端 MessageVO） */
export type MessageVO = {
  /** 消息 ID */
  id: number
  /** 频道 ID */
  channelId: number
  /** 话题 ID（null=频道主时间线） */
  threadId: number | null
  /** 发送者 */
  fromUser: MessageUserVO
  /** 消息内容（Markdown） */
  content: string
  /** 消息类型（对应 MessageType 枚举值） */
  msgType: number
  /** 消息状态: 0=正常 1=删除 2=编辑过 */
  status?: number
  /** 回复的消息 ID */
  replyMsgId?: number | null
  /** 附件列表 */
  attachments?: FileVO[]
  /** Reaction 列表 */
  reactions?: ReactionVO[]
  /** Thread 摘要（如果有） */
  thread?: ThreadSummaryVO
  /** 创建时间 */
  createTime?: string
  /** 更新时间 */
  updateTime?: string
}

/** 话题（对应后端 ThreadVO） */
export type ThreadVO = {
  /** 话题 ID */
  id: number
  /** 频道 ID */
  channelId: number
  /** 触发消息 ID */
  rootMsgId: number
  /** 话题名称 */
  name: string
  /** 创建者 */
  creator?: UserVO
  /** 状态: ACTIVE / ARCHIVED */
  status: string
  /** 消息数 */
  messageCount?: number
  /** 最后活跃时间 */
  lastActive?: string
  /** 创建时间 */
  createTime?: string
}

/** Reaction（对应后端 ReactionVO） */
export type ReactionVO = {
  /** emoji 字符 */
  emoji: string
  /** 数量 */
  count: number
  /** 添加该反应的部分用户 ID（截断展示） */
  userIds: number[]
  /** 当前用户是否已添加 */
  reacted: boolean
}

// ==================== 文件 / Emoji / Invite / 未读 ====================

/** 文件（对应后端 FileVO） */
export type FileVO = {
  /** 文件 ID */
  id: number
  /** 文件名 */
  fileName: string
  /** 文件大小（字节） */
  fileSize: number
  /** MIME 类型 */
  mimeType: string
  /** 图片宽度（图片才有） */
  width?: number
  /** 图片高度（图片才有） */
  height?: number
  /** 状态: PENDING / UPLOADED */
  status?: string
  /** 下载链接（预签名，仅 UPLOADED 状态有效） */
  downloadUrl?: string
}

/** 预签名上传响应 */
export type PresignedResp = {
  uploadUrl: string
  fileId: number
}

/** 表情（对应后端 EmojiVO） */
export type EmojiVO = {
  /** 表情 ID */
  id: number
  /** 服务器 ID */
  serverId: number
  /** 表情名称 */
  name: string
  /** 图片 URL */
  url: string
  /** 上传者 ID */
  creatorId?: number
  /** 创建时间 */
  createTime?: string
}

/** 邀请链接（对应后端 InviteVO） */
export type InviteVO = {
  /** 邀请 ID */
  id: number
  /** 服务器 ID */
  serverId: number
  /** 创建者 ID */
  inviterId: number
  /** 邀请码 */
  code: string
  /** 最大使用次数 (0=不限) */
  maxUses?: number
  /** 已使用次数 */
  usedCount?: number
  /** 过期时间 (null=永不过期) */
  expireTime?: string | null
  /** 状态: 0=失效 1=有效 */
  status?: number
  /** 创建时间 */
  createTime?: string
}

/** 未读计数（频道已读状态） */
export type UnreadVO = {
  channelId: number
  unreadCount: number
}

// ==================== 请求类型 ====================

/** 创建频道请求 */
export type CreateChannelReq = {
  categoryId?: number
  name: string
  type: number       // ChannelType.TEXT / ChannelType.VOICE
  topic?: string
}

/** 更新频道请求 */
export type UpdateChannelReq = {
  name?: string
  topic?: string
}

/** 创建角色请求 */
export type CreateRoleReq = {
  name: string
  color?: string
  permissions: number
  position?: number
}

/** 更新角色请求 */
export type UpdateRoleReq = {
  name?: string
  color?: string
  permissions?: number
}

/** 设置频道权限覆盖请求 */
export type SetPermReq = {
  targetType: number
  targetId: number
  allowBits: number
  denyBits: number
}

/** 语音消息元数据 */
export type SoundMsgDTO = {
  /** 语音文件 URL */
  audioUrl: string
  /** 文件大小（字节） */
  size: number
  /** 语音时长（秒） */
  second: number
}

/** 发送消息请求 */
export type SendMsgReq = {
  content: string
  msgType: number
  threadId?: number
  replyMsgId?: number
  fileIds?: number[]
  /** 语音消息元数据（msgType=SOUND 时必填） */
  soundMsg?: SoundMsgDTO
}

/** 创建 Thread 请求 */
export type CreateThreadReq = {
  rootMsgId: number
  name?: string
}

/** 更新 Thread 请求 */
export type UpdateThreadReq = {
  name?: string
  status?: 'ACTIVE' | 'ARCHIVED'
}

/** 消息搜索参数 */
export type SearchParams = {
  q: string
  channelId?: number
  from?: string
  to?: string
  page?: number
}

/** 更新成员昵称请求 */
export type UpdateMemberNicknameReq = {
  nickname: string
}

/** 转让 ownership 请求 */
export type TransferOwnershipReq = {
  newOwnerId: number
}

/** 鉴权 — 用户名+密码登录请求（对应后端 LoginReq） */
export type LoginReq = {
  /** 用户名（必填） */
  username: string
  /** 密码（必填，明文，后端 BCrypt 验证） */
  password: string
}

/** 鉴权 — 微信绑定请求（对应后端 AccountBindReq） */
export type AccountBindReq = {
  /** WeChat OAuth2 code */
  code?: string
  /** 直接传入 openId（测试用，绕过 code 交换） */
  openId?: string
}

/** 鉴权 — Token 刷新请求 */
export type RefreshTokenReq = {
  token: string
}

/** 鉴权 — Token 刷新响应 */
export type RefreshTokenResp = {
  token: string
}

// ==================== 旧类型别名（RenderMessage 子组件使用） ====================

/** @deprecated 旧版消息体类型 */
export type MsgType = any
/** @deprecated RenderMessage/text.vue 使用 */
export type TextBody = any
/** @deprecated RenderMessage/image.vue 使用 */
export type ImageBody = any
/** @deprecated RenderMessage/voice.vue 使用 */
export type VoiceBody = any
/** @deprecated RenderMessage/file.vue 使用 */
export type FileBody = any
