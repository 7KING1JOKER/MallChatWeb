<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import apis from '@/services/apis'
import type { ServerVO } from '@/services/types'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores/global'
import { useServerStore } from '@/stores/server'

const router = useRouter()
const globalStore = useGlobalStore()
const serverStore = useServerStore()

const servers = ref<ServerVO[]>([])
const loading = ref(false)

// 邀请码加入
const inviteCode = ref('')
const inviteLoading = ref(false)

onMounted(async () => {
  loading.value = true
  const data = await apis.discoverServers().send()
  if (data) servers.value = data.list
  loading.value = false
})

async function join(sid: number) {
  try {
    await apis.joinServer(sid).send()
  } catch {
    /* 可能已经加入 */
  }
  await serverStore.getMyServers()
  await globalStore.enterServer(sid)
  await serverStore.getServerDetail(sid)
  router.push(`/servers/${sid}/channels/`)
}

// 通过邀请码加入
async function joinByInvite() {
  const input = inviteCode.value.trim()
  if (!input) {
    ElMessage.warning('请输入邀请码或邀请链接')
    return
  }

  inviteLoading.value = true
  try {
    let serverId: number | null = null
    let code = input

    // 1. 尝试匹配完整链接格式: /join/13?code=xxx 或 join/13?code=xxx
    const linkMatch = input.match(/(?:^|\/)(?:join\/)(\d+)(?:\?code=)([^\s&?]+)/)
    if (linkMatch) {
      serverId = Number(linkMatch[1])
      code = linkMatch[2]
      console.log('✅ 解析到完整链接:', { serverId, code })
    }

    // 2. 尝试匹配纯邀请码（只包含字母数字，没有 / 或 ?）
    if (!serverId && /^[a-zA-Z0-9]+$/.test(input)) {
      // 纯邀请码，但没有 serverId，提示用户使用完整链接
      ElMessage.warning('请粘贴完整的邀请链接（格式：/join/服务器ID?code=邀请码）')
      inviteLoading.value = false
      return
    }

    // 3. 尝试从输入中提取 code 参数
    if (!serverId) {
      const codeMatch = input.match(/[?&]code=([^\s&?]+)/)
      if (codeMatch) {
        code = codeMatch[1]
        // 尝试从链接中提取 serverId
        const sidMatch = input.match(/\/(\d+)(?:\?|$)/)
        if (sidMatch) {
          serverId = Number(sidMatch[1])
        }
      }
    }

    // 4. 如果还是解析不出 serverId，报错
    if (!serverId) {
      ElMessage.warning('无法解析邀请链接，请粘贴完整链接（格式：/join/服务器ID?code=邀请码）')
      inviteLoading.value = false
      return
    }

    console.log('🚀 加入请求:', { serverId, code })
    
    await apis.joinByInvite(serverId, { code }).send()
    await serverStore.getMyServers()
    await globalStore.enterServer(serverId)
    await serverStore.getServerDetail(serverId)
    ElMessage.success('🎉 加入成功！')
    inviteCode.value = ''
    router.push(`/servers/${serverId}/channels`)
  } catch (error: any) {
    console.error('❌ 加入失败:', error)
    const errData = error?.data || error?.response?.data
    const errMsg = errData?.message || error?.message || '加入失败'
    ElMessage.error(errMsg)
  } finally {
    inviteLoading.value = false
  }
}
</script>

<template>
  <div class="discover-page">
    <div class="page-header">
      <h2>发现公开服务器</h2>
      
      <!-- 邀请码加入 -->
      <div class="invite-section">
        <el-input
          v-model="inviteCode"
          placeholder="粘贴邀请链接（如：/join/13?code=xxx）"
          size="default"
          class="invite-input"
          @keydown.enter="joinByInvite"
        >
          <template #append>
            <el-button 
              type="primary" 
              :loading="inviteLoading"
              @click="joinByInvite"
            >
              🔗 加入
            </el-button>
          </template>
        </el-input>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div class="server-grid">
      <div v-for="s in servers" :key="s.id" class="server-card" @click="join(s.id)">
        <el-avatar :size="56" shape="rounded" :src="s.icon">{{
          s.name?.charAt(0) || 'S'
        }}</el-avatar>
        <div class="card-body"
          ><div class="card-name">{{ s.name }}</div
          ><div class="card-desc">{{ s.description || '暂无描述' }}</div
          ><div class="card-meta">{{ s.memberCount || 0 }} 名成员</div></div
        >
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.discover-page {
  height: 100%;
  padding: 24px;
  overflow-y: auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

h2 {
  margin: 0;
}

.invite-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.invite-input {
  width: 400px;
}

.loading {
  padding: 40px;
  color: var(--font-secondary);
  text-align: center;
}

.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.server-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  background-color: var(--background-secondary);
  border-radius: 8px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 20%);
  }
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-name {
  margin-bottom: 4px;
  font-size: 16px;
  font-weight: 600;
}

.card-desc {
  margin-bottom: 6px;
  overflow: hidden;
  font-size: 13px;
  color: var(--font-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  font-size: 12px;
  color: var(--font-secondary);
}
</style>