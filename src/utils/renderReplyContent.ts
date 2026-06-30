import { MsgEnum } from '@/enums'
import { MSG_REPLY_TEXT_MAP } from '@/constant/message'

const renderReplyContent = (nickname?: string, msgType?: number, content?: string) => {
  switch (msgType) {
    case MsgEnum.SYSTEM:
    case MsgEnum.TEXT:
      return `${nickname || ''}: ${content || ''}`
    case MsgEnum.IMAGE:
      return `${nickname || ''}: ${MSG_REPLY_TEXT_MAP[MsgEnum.IMAGE]}`
    case MsgEnum.FILE:
      return `${nickname || ''}: ${MSG_REPLY_TEXT_MAP[MsgEnum.FILE]}`
    case MsgEnum.SOUND:
      return `${nickname || ''}: ${MSG_REPLY_TEXT_MAP[MsgEnum.SOUND]}`
    case MsgEnum.EMOJI:
      return `${nickname || ''}: ${MSG_REPLY_TEXT_MAP[MsgEnum.EMOJI]}`
    default:
      return ''
  }
}
export default renderReplyContent
