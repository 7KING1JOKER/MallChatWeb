import mitt from 'mitt'
import type { Emitter } from 'mitt'
import type { ServerVO } from '@/services/types'

type Events = {
  focusMsgInput?: void
  onSelectPerson: { uid: number; ignoreCheck?: boolean }
  serverCreated?: ServerVO
}

const eventHub: Emitter<Events> = mitt<Events>()
export default eventHub
