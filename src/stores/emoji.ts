import { ref } from 'vue'
import { defineStore } from 'pinia'
import apis from '@/services/apis'
import type { EmojiVO } from '@/services/types'
import { computedToken } from '@/services/request'

export const useEmojiStore = defineStore('emoji', () => {
  const isLoading = ref(false)
  const emojiList = ref<EmojiVO[]>([])

  async function getEmojiList(serverId: number) {
    isLoading.value = true
    try {
      const data = await apis.getEmojis(serverId).send()
      if (data) emojiList.value = data
    } finally {
      isLoading.value = false
    }
  }

  async function uploadEmojiAction(serverId: number, file: File) {
    const form = new FormData()
    form.append('imageFile', file)
    form.append('name', file.name.replace(/\.[^.]+$/, ''))

    // 使用原生 fetch 发送 multipart/form-data，避免 Alova 框架层可能的数据处理问题
    const token = computedToken.get()
    const response = await fetch(`/api/v1/servers/${serverId}/emojis`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // 不设 Content-Type，浏览器自动生成带 boundary 的 multipart/form-data
      },
      body: form,
    })

    if (!response.ok) {
      const json = await response.json().catch(() => ({}))
      const msg = (json as any).errMsg || `HTTP ${response.status}`
      throw new Error(msg)
    }

    await getEmojiList(serverId)
  }

  async function deleteEmojiAction(serverId: number, emojiId: number) {
    await apis.deleteEmoji(serverId, emojiId).send()
    await getEmojiList(serverId)
  }

  return { emojiList, isLoading, getEmojiList, uploadEmojiAction, deleteEmojiAction }
})
