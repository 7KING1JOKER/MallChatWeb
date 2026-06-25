import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import apis from '@/services/apis'
import wsIns from '@/utils/websocket'

export const useGlobalStore = defineStore('global', () => {
  const currentServerId = ref<number | null>(null)
  const currentChannelId = ref<number | null>(null)
  const currentThreadId = ref<number | null>(null)
  const unreadCounts = reactive<Map<number, number>>(new Map())

  function enterServer(serverId: number) {
    if (currentServerId.value && currentServerId.value !== serverId) {
      if (currentChannelId.value) {
        wsIns.unsubscribeChannel([currentChannelId.value])
        currentChannelId.value = null
      }
    }
    currentServerId.value = serverId
    currentThreadId.value = null
    loadUnread(serverId)
  }

  function enterChannel(channelId: number) {
    if (currentChannelId.value && currentChannelId.value !== channelId) {
      wsIns.unsubscribeChannel([currentChannelId.value])
    }
    currentChannelId.value = channelId
    currentThreadId.value = null
    wsIns.subscribeChannel([channelId])
  }

  function enterThread(threadId: number) {
    if (currentThreadId.value && currentThreadId.value !== threadId) {
      wsIns.unsubscribeThread(currentThreadId.value)
    }
    currentThreadId.value = threadId
    wsIns.subscribeThread(threadId)
  }

  function leaveThread() {
    if (currentThreadId.value) {
      wsIns.unsubscribeThread(currentThreadId.value)
      currentThreadId.value = null
    }
  }

  async function loadUnread(serverId: number) {
    try {
      const data = await apis.getUnread(serverId)
      for (const chId in data) {
        unreadCounts.set(Number(chId), data[chId])
      }
    } catch { /* ignore */ }
  }

  return {
    currentServerId, currentChannelId, currentThreadId, unreadCounts,
    enterServer, enterChannel, enterThread, leaveThread, loadUnread,
  }
})
