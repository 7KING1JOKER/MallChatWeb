<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import apis from '@/services/apis'
import { useGlobalStore } from '@/stores/global'
import { useServerStore } from '@/stores/server'

const route = useRoute()
const router = useRouter()
const globalStore = useGlobalStore()
const serverStore = useServerStore()

const loading = ref(true)
const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMsg = ref('')
const serverId = computed(() => Number(route.params.serverId))
const inviteCode = computed(() => route.query.code as string || '')

onMounted(async () => {
  const sid = serverId.value
  const code = inviteCode.value

  if (!sid) {
    status.value = 'error'
    errorMsg.value = '无效的邀请链接'
    loading.value = false
    return
  }

  if (!code) {
    status.value = 'error'
    errorMsg.value = '缺少邀请码，请检查链接是否正确'
    loading.value = false
    return
  }

  try {
    // 调用加入接口
    await apis.joinByInvite(sid, { code }).send()
    
    status.value = 'success'
    loading.value = false
    
    // 刷新服务器列表
    await serverStore.getMyServers()
    
    // 进入服务器
    await globalStore.enterServer(sid)
    await serverStore.getServerDetail(sid)
    
    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      router.push(`/servers/${sid}/channels`)
    }, 1500)
  } catch (error: any) {
    status.value = 'error'
    loading.value = false
    
    const errData = error?.data || error?.response?.data
    const errMsg = errData?.message || error?.message || '加入失败'
    
    if (errMsg.includes('过期') || errMsg.includes('expired')) {
      errorMsg.value = '邀请链接已过期，请联系服务器管理员重新发送'
    } else if (errMsg.includes('无效') || errMsg.includes('invalid')) {
      errorMsg.value = '邀请码无效，请检查链接是否正确'
    } else if (errMsg.includes('已满') || errMsg.includes('full')) {
      errorMsg.value = '服务器已满，无法加入'
    } else {
      errorMsg.value = errMsg
    }
  }
})

function goDiscover() {
  router.push('/discover')
}
</script>

<template>
  <div class="join-page">
    <div class="join-card">
      <!-- 加载中 -->
      <div v-if="loading" class="status-container">
        <div class="spinner"></div>
        <p class="status-text">正在验证邀请...</p>
      </div>

      <!-- 成功 -->
      <div v-else-if="status === 'success'" class="status-container success">
        <div class="icon-circle success">✅</div>
        <p class="status-text success-text">加入成功！</p>
        <p class="status-desc">即将跳转到服务器...</p>
      </div>

      <!-- 失败 -->
      <div v-else class="status-container error">
        <div class="icon-circle error">❌</div>
        <p class="status-text error-text">加入失败</p>
        <p class="status-desc">{{ errorMsg }}</p>
        <button class="btn-primary" @click="goDiscover">返回发现页</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.join-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--background-primary, #1e1f22);
}

.join-card {
  padding: 48px 56px;
  background: var(--background-secondary, #2b2d31);
  border-radius: 16px;
  border: 1px solid var(--divider-color, rgba(255, 255, 255, 6%));
  min-width: 360px;
  text-align: center;
}

.status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.icon-circle {
  width: 64px;
  height: 64px;
  font-size: 32px;
  line-height: 64px;
  border-radius: 50%;
  
  &.success {
    background: rgba(103, 194, 58, 0.15);
  }
  
  &.error {
    background: rgba(245, 108, 108, 0.15);
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--divider-color, rgba(255, 255, 255, 10%));
  border-top-color: var(--el-color-primary, #5865f2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status-text {
  font-size: 18px;
  font-weight: 600;
  margin: 4px 0;
  
  &.success-text {
    color: #67c23a;
  }
  
  &.error-text {
    color: #f56c6c;
  }
}

.status-desc {
  font-size: 14px;
  color: var(--font-secondary, #8e9297);
  margin: 0;
}

.btn-primary {
  margin-top: 12px;
  padding: 10px 32px;
  background: var(--el-color-primary, #5865f2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.85;
  }
}
</style>