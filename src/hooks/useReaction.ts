import { ref } from 'vue'
import apis from '@/services/apis'

export function useReaction(msgId: number) {
  const loading = ref(false)

  async function toggleReaction(emoji: string) {
    loading.value = true
    try { await apis.addReaction(msgId, emoji).send() }
    catch { await apis.removeReaction(msgId, emoji).send() }
    finally { loading.value = false }
  }

  return { toggleReaction, loading }
}
