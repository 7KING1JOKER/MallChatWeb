import { computed, toValue, type Ref } from 'vue'
import type { ComputedRef } from 'vue'
import { useCachedStore } from '@/stores/cached'

export const useUserInfo = (uid?: number | ComputedRef<number | undefined> | Ref<number>) => {
  const cachedStore = useCachedStore()
  const userInfo = computed(() => (uid && cachedStore.userCachedList[toValue(uid as number)]) || {})
  const resultUid = toValue(uid as number)
  if (resultUid && Object.keys(userInfo.value).length === 0) { cachedStore.getBatchUserInfo([resultUid]) }
  return userInfo
}
