import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import apis from '@/services/apis'
import type { UserVO } from '@/services/types'
import { isDiffNow10Min } from '@/utils/computedTime'

export type BaseUserItem = Pick<UserVO, 'id' | 'avatar' | 'nickname'>

export const useCachedStore = defineStore(
  'cached',
  () => {
    const userCachedList = reactive<Record<number, Partial<UserVO>>>({})
    const cacheTimestamps = reactive<Record<number, number>>({})
    const atUsersList = ref<BaseUserItem[]>([])

    const getBatchUserInfo = async (ids: number[]) => {
      const needRefresh = ids.filter(
        (id) => !cacheTimestamps[id] || isDiffNow10Min(cacheTimestamps[id]),
      )
      if (!needRefresh.length) return
      const results = await Promise.all(
        needRefresh.map((id) =>
          apis
            .getUserById(id)
            .send()
            .catch(() => null),
        ),
      )
      results.forEach((user, i) => {
        if (user) {
          userCachedList[needRefresh[i]] = { ...user }
          cacheTimestamps[needRefresh[i]] = Date.now()
        }
      })
    }

    const filterUsers = (searchKey: string) =>
      atUsersList.value.filter((item) => item.nickname?.startsWith(searchKey))
    const filterUsersByIdList = (idList: number[]) =>
      atUsersList.value.filter((user) => idList.includes(user.id))

    return { userCachedList, atUsersList, getBatchUserInfo, filterUsers, filterUsersByIdList }
  },
  { persist: true },
)
