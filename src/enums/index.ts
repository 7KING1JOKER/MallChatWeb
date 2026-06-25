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

