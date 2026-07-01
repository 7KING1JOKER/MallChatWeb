import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import apis from '@/services/apis'
import wsIns from '@/utils/websocket'
import { useServerStore } from '@/stores/server'

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
      // 切换服务器时清除旧的在线状态
      const serverStore = useServerStore()
      serverStore.clearOnlineUsers()
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
      const data = await apis.getUnread(serverId).send()
      for (const chId in data) {
        unreadCounts.set(Number(chId), data[chId])
      }
    } catch {
      /* ignore */
    }
  }

  /** 重置服务器/频道/Thread 选中状态（退出登录或删除服务器时调用） */
  function resetServerState() {
    if (currentChannelId.value) {
      wsIns.unsubscribeChannel([currentChannelId.value])
    }
    if (currentThreadId.value) {
      wsIns.unsubscribeThread(currentThreadId.value)
    }
    currentServerId.value = null
    currentChannelId.value = null
    currentThreadId.value = null
    unreadCounts.clear()
  }

  return {
    currentServerId,
    currentChannelId,
    currentThreadId,
    unreadCounts,
    enterServer,
    enterChannel,
    enterThread,
    leaveThread,
    loadUnread,
    resetServerState,
  }
})
