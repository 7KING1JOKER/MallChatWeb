import { ref } from 'vue'
import { defineStore } from 'pinia'
import apis from '@/services/apis'
import type { EmojiVO } from '@/services/types'

export const useEmojiStore = defineStore('emoji', () => {
  const isLoading = ref(false)
  const emojiList = ref<EmojiVO[]>([])

  async function getEmojiList(serverId: number) {
    isLoading.value = true
    try { const data = await apis.getEmojis(serverId).send(); if (data) emojiList.value = data }
    finally { isLoading.value = false }
  }
  async function uploadEmojiAction(serverId: number, file: File) {
    const form = new FormData(); form.append('file', file)
    await apis.uploadEmoji(serverId, form).send(); await getEmojiList(serverId)
  }
  async function deleteEmojiAction(serverId: number, emojiId: number) {
    await apis.deleteEmoji(serverId, emojiId).send(); await getEmojiList(serverId)
  }

  return { emojiList, isLoading, getEmojiList, uploadEmojiAction, deleteEmojiAction }
})
