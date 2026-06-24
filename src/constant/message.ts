import { MsgEnum } from '@/enums'

// 消息回复映射表
export const MSG_REPLY_TEXT_MAP: Record<number, string> = {
  [MsgEnum.TEXT]: '[文本]',
  [MsgEnum.IMAGE]: '[图片]',
  [MsgEnum.FILE]: '[文件]',
  [MsgEnum.SYSTEM]: '[系统消息]',
  [MsgEnum.SOUND]: '[语音]',
  [MsgEnum.EMOJI]: '[表情]',
}
