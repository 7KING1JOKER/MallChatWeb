import mitt from 'mitt'
import type { Emitter } from 'mitt'
import type { ServerVO } from '@/services/types'

/** 社群平台事件总线类型 */
type Events = {
  /** 聚焦消息输入框 */
  focusMsgInput?: void
  /** 选中频道 */
  onSelectChannel?: { channelId: number }
  /** 服务器创建成功 */
  serverCreated?: ServerVO
  /** 用户正在输入（TYPING WS 推送 → UI 通知） */
  typingUsers?: { channelId: number; threadId: number; userId: number; isTyping: boolean }
}

const eventHub: Emitter<Events> = mitt<Events>()
export default eventHub
