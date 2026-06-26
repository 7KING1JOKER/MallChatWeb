import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import apis from '@/services/apis'
import { useGlobalStore } from '@/stores/global'
import type { MessageVO, CursorPage, ReactionVO } from '@/services/types'

export const useChatStore = defineStore('chat', () => {
  const globalStore = useGlobalStore()

  const messageMap = reactive<Map<number, Map<number, MessageVO>>>(new Map())
  const threadMessageMap = reactive<Map<number, Map<number, MessageVO>>>(new Map())
  const messageOptions = reactive<
    Map<number, { isLast: boolean; isLoading: boolean; cursor: string }>
  >(new Map())
  const threadMessageOptions = reactive<
    Map<number, { isLast: boolean; isLoading: boolean; cursor: string }>
  >(new Map())
  const replyMapping = reactive<Map<number, Map<number, number[]>>>(new Map())
  const currentMsgReply = ref<Partial<MessageVO>>({})

  function ensureChannel(channelId: number) {
    if (!messageMap.has(channelId)) {
      messageMap.set(channelId, reactive(new Map()))
      messageOptions.set(channelId, { isLast: false, isLoading: false, cursor: '' })
    }
    return messageMap.get(channelId)!
  }
  function ensureThread(threadId: number) {
    if (!threadMessageMap.has(threadId)) {
      threadMessageMap.set(threadId, reactive(new Map()))
      threadMessageOptions.set(threadId, { isLast: false, isLoading: false, cursor: '' })
    }
    return threadMessageMap.get(threadId)!
  }

  async function getChannelMessages(channelId: number, pageSize = 50) {
    const map = ensureChannel(channelId)
    const opt = messageOptions.get(channelId)!
    if (opt.isLoading || opt.isLast) return
    opt.isLoading = true
    try {
      const res: CursorPage<MessageVO> = await apis
        .getMessages(channelId, { cursor: opt.cursor || undefined, pageSize })
        .send()
      for (const msg of res.list.reverse()) {
        map.set(msg.id, msg)
      }
      opt.cursor = res.cursor
      opt.isLast = res.isLast
    } finally {
      opt.isLoading = false
    }
  }

  function pushMessage(msg: MessageVO) {
    ensureChannel(msg.channelId).set(msg.id, msg)
  }

  function editMessage(msgId: number, content: string) {
    for (const [, map] of messageMap) {
      const m = map.get(msgId)
      if (m) {
        m.content = content
        m.status = 2
        return
      }
    }
  }

  function deleteMessage(msgId: number) {
    for (const [, map] of messageMap) {
      const m = map.get(msgId)
      if (m) {
        m.status = 1
        return
      }
    }
  }

  async function getThreadMessages(threadId: number, pageSize = 50) {
    const map = ensureThread(threadId)
    const opt = threadMessageOptions.get(threadId)!
    if (opt.isLoading || opt.isLast) return
    opt.isLoading = true
    try {
      const res: CursorPage<MessageVO> = await apis
        .getThreadMessages(threadId, { cursor: opt.cursor || undefined, pageSize })
        .send()
      for (const msg of res.list.reverse()) {
        map.set(msg.id, msg)
      }
      opt.cursor = res.cursor
      opt.isLast = res.isLast
    } finally {
      opt.isLoading = false
    }
  }

  function pushThreadMessage(msg: MessageVO) {
    if (msg.threadId) ensureThread(msg.threadId).set(msg.id, msg)
  }

  function updateReaction(msgId: number, data: ReactionVO) {
    for (const [, map] of messageMap) {
      const msg = map.get(msgId)
      if (msg) {
        if (!msg.reactions) msg.reactions = []
        const idx = msg.reactions.findIndex((r) => r.emoji === data.emoji)
        if (data.count === 0) {
          if (idx !== -1) msg.reactions.splice(idx, 1)
        } else if (idx !== -1) {
          msg.reactions[idx] = data
        } else {
          msg.reactions.push(data)
        }
        return
      }
    }
  }

  async function sendMessage(data: {
    channelId: number
    content: string
    msgType: number
    replyMsgId?: number
    threadId?: number
    fileIds?: number[]
  }) {
    const msg = await apis
      .sendMessage(data.channelId, {
        content: data.content,
        msgType: data.msgType,
        replyMsgId: data.replyMsgId,
        threadId: data.threadId,
        fileIds: data.fileIds,
      })
      .send()
    if (msg) pushMessage(msg)
    return msg
  }
  function setReply(msg: Partial<MessageVO>) {
    currentMsgReply.value = msg
  }
  function clearReply() {
    currentMsgReply.value = {}
  }

  function getMessages(channelId: number): MessageVO[] {
    const map = messageMap.get(channelId)
    if (!map) return []
    return Array.from(map.values()).sort((a, b) => a.id - b.id)
  }
  function getThreadMsgs(threadId: number): MessageVO[] {
    const map = threadMessageMap.get(threadId)
    if (!map) return []
    return Array.from(map.values()).sort((a, b) => a.id - b.id)
  }

  return {
    messageMap,
    threadMessageMap,
    messageOptions,
    threadMessageOptions,
    replyMapping,
    currentMsgReply,
    getChannelMessages,
    getThreadMessages,
    pushMessage,
    pushThreadMessage,
    sendMessage,
    editMessage,
    deleteMessage,
    updateReaction,
    setReply,
    clearReply,
    getMessages,
    getThreadMsgs,
  }
})
