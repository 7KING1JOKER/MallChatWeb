import { ref } from 'vue'
import { useEmojiStore } from '@/stores/emoji'

export const useEmojiUpload = () => {
  const emojiStore = useEmojiStore()
  const isEmojiUp = ref(false)

  async function uploadEmoji(serverId: number, file: File) {
    isEmojiUp.value = true
    try {
      await emojiStore.uploadEmojiAction(serverId, file)
    } finally {
      isEmojiUp.value = false
    }
  }

  return { uploadEmoji, isEmojiUp }
}
