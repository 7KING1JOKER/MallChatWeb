/**
 * 全局枚举文件
 * 如果枚举值需要在全局使用，那么请在此文件中定义。其他枚举值请在对应的文件中定义。
 * 定义规则：
 *  枚举名：XxxEnum
 *  枚举值：全部大写，单词间用下划线分割
 *
 * 与后端枚举严格对齐
 */
/** -------------------------------------- */

/**
 * 消息类型
 * 与后端 MessageTypeEnum.java 对齐
 */
export enum MsgEnum {
  /** 文本 */
  TEXT = 1,
  /** 图片 */
  IMAGE = 2,
  /** 文件 */
  FILE = 3,
  /** 系统消息 */
  SYSTEM = 4,
  /** 语音 */
  SOUND = 5,
  /** 表情 */
  EMOJI = 6,
}

/**
 * 在线状态
 */
export enum OnlineEnum {
  /** 在线 */
  ONLINE = 1,
  /** 离线 */
  OFFLINE,
}

/**
 * 操作类型
 */
export enum ActEnum {
  /** 确认 */
  Confirm = 1,
  /** 取消 */
  Cancel,
}

export enum SexEnum {
  MAN = 1,
  REMALE,
}

export enum PowerEnum {
  USER,
  ADMIN,
}

export enum IsYetEnum {
  NO,
  YES,
}

// ==================== 已废弃（临时兼容，待 B/C 重构后删除） ====================

/** @deprecated 被 PermissionBit RBAC 替代 */
export enum MarkEnum {
  LIKE = 1,
  DISLIKE,
}

/** @deprecated 被 Server/Channel 结构替代 */
export enum RoomTypeEnum {
  /** 1群聊 */
  Group = 1,
  /** 2单聊 */
  Single,
}

/** @deprecated 被 WS type=30/31 替代 */
export enum ChangeTypeEnum {
  /** 1 加入群组 */
  JOIN = 1,
  /** 2 移除群组 */
  REMOVE,
}

/** @deprecated 被 PermissionBit RBAC 替代 */
export enum RoleEnum {
  /** 1群主 */
  LORD = 1,
  /** 2管理员 */
  ADMIN,
  /** 3普通成员 */
  NORMAL,
  /** 4踢出群聊 */
  REMOVED,
}
