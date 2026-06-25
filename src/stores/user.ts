import { ref } from 'vue'
import apis from '@/services/apis'
import { defineStore } from 'pinia'
import type { UserVO } from '@/services/types'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<Partial<UserVO>>({})
  const isSign = ref(false)

  let localUserInfo = {}
  try { localUserInfo = JSON.parse(localStorage.getItem('USER_INFO') || '{}') } catch { localUserInfo = {} }
  if (!Object.keys(userInfo.value).length && Object.keys(localUserInfo).length) {
    userInfo.value = localUserInfo
  }

  async function getUserMeAction() {
    try {
      const data = await apis.getUserMe().send()
      userInfo.value = { ...userInfo.value, ...data }
    } catch {
      localStorage.removeItem('TOKEN'); localStorage.removeItem('USER_INFO')
    }
  }

  return { userInfo, isSign, getUserMeAction }
})
