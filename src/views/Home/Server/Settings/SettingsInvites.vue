<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useGlobalStore } from '@/stores/global'
import apis from '@/services/apis'
import type { InviteVO } from '@/services/types'

const route = useRoute()
const globalStore = useGlobalStore()

const serverId = computed(() => Number(route.params.serverId))
const baseUrl = ref(window.location.origin)

// 从 localStorage 加载邀请列表
function loadFromStorage() {
  try {
    const key = `invites_${serverId.value}`
    const data = localStorage.getItem(key)
    if (data) {
      const parsed = JSON.parse(data)
      const now = Date.now()
      const filtered = parsed.filter((inv: any) => {
        if (inv.expireTime) {
          const expireDate = new Date(inv.expireTime).getTime()
          if (expireDate < now) return false
        }
        return true
      })
      invites.value = filtered
      if (filtered.length !== parsed.length) {
        localStorage.setItem(key, JSON.stringify(filtered))
      }
    }
  } catch {
    // ignore
  }
}

// 保存到 localStorage
function saveToStorage() {
  try {
    const key = `invites_${serverId.value}`
    localStorage.setItem(key, JSON.stringify(invites.value))
  } catch {
    // ignore
  }
}

onMounted(async () => {
  const sid = serverId.value
  if (sid && sid !== globalStore.currentServerId) {
    await globalStore.enterServer(sid)
  }
  loadFromStorage()
})

const invites = ref<InviteVO[]>([])
const loading = ref(false)

// 创建表单
const showCreate = ref(false)
const maxUses = ref<number>(0)
const expireDays = ref<number>(7)
const createLoading = ref(false)

// 创建邀请
async function createInvite() {
  createLoading.value = true
  try {
    const data: { maxUses?: number; expireHours?: number } = {}
    if (maxUses.value > 0) {
      data.maxUses = maxUses.value
    }
    if (expireDays.value > 0) {
      data.expireHours = expireDays.value * 24
    }
    
    const inv = await apis.createInvite(serverId.value, data).send()
    
    let expireTime = null
    if (expireDays.value > 0) {
      const date = new Date()
      date.setDate(date.getDate() + expireDays.value)
      expireTime = date.toISOString()
    }
    
    invites.value.unshift({
      ...inv,
      expireTime: expireTime || inv.expireTime,
      status: 'active',
      fullUrl: `${baseUrl.value}/join/${serverId.value}?code=${inv.code}`
    } as any)
    
    saveToStorage()
    
    ElMessage.success('邀请链接已创建！')
    showCreate.value = false
    
    maxUses.value = 0
    expireDays.value = 7
  } catch (error: any) {
    console.error('创建邀请失败:', error)
    const errMsg = error?.data?.message || error?.message || '创建失败'
    ElMessage.error(errMsg)
  } finally {
    createLoading.value = false
  }
}

// 复制邀请链接
function copyInvite(code: string) {
  const fullUrl = `${baseUrl.value}/join/${serverId.value}?code=${code}`
  navigator.clipboard.writeText(fullUrl).then(() => {
    ElMessage.success('邀请链接已复制！')
  }).catch(() => {
    const textarea = document.createElement('textarea')
    textarea.value = fullUrl
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('邀请链接已复制！')
  })
}

// 删除邀请
function deleteInvite(index: number) {
  invites.value.splice(index, 1)
  saveToStorage()
  ElMessage.success('已移除')
}

// 格式化时间
function formatTime(time: string | undefined) {
  if (!time) return '永不过期'
  const date = new Date(time)
  if (isNaN(date.getTime())) return '永不过期'
  return date.toLocaleString()
}

// 检查是否过期
function isExpired(expireTime: string | undefined): boolean {
  if (!expireTime) return false
  return new Date(expireTime).getTime() < Date.now()
}
</script>

<template>
  <div class="settings-invites">
    <div class="page-top">
      <h3>邀请管理</h3>
      <el-button type="primary" size="small" @click="showCreate = true">+ 创建邀请链接</el-button>
    </div>

    <div class="invite-tip">
      <span>💡 邀请链接创建后保存在本地浏览器，清除浏览器数据会丢失</span>
    </div>

    <el-dialog v-model="showCreate" title="创建邀请链接" width="420px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="最大使用次数（0=无限）">
          <el-input-number v-model="maxUses" :min="0" :max="999" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="过期天数（0=永不过期）">
          <el-input-number v-model="expireDays" :min="0" :max="365" style="width: 100%;" />
        </el-form-item>
        <div class="form-hint">
          <span v-if="expireDays === 0">⏰ 链接永不过期</span>
          <span v-else>⏰ 链接将在 {{ expireDays }} 天后过期</span>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="createInvite">
          创建
        </el-button>
      </template>
    </el-dialog>

    <div class="invite-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="invites.length" v-for="(inv, index) in invites" :key="inv.id || index" class="invite-card">
        <div class="invite-info">
          <div class="invite-code">
            <span class="code-text">{{ inv.code }}</span>
            <span :class="['status-tag', isExpired(inv.expireTime) ? 'expired' : 'active']">
              {{ isExpired(inv.expireTime) ? '已过期' : '有效' }}
            </span>
          </div>
          <div class="invite-meta">
            <span>使用次数：{{ inv.usedCount || 0 }} / {{ inv.maxUses || '∞' }}</span>
            <span class="divider">·</span>
            <span>过期时间：{{ formatTime(inv.expireTime) }}</span>
          </div>
          <div class="invite-url">
            {{ baseUrl }}/join/{{ serverId }}?code={{ inv.code }}
          </div>
        </div>
        <div class="invite-actions">
          <el-button size="small" type="primary" @click="copyInvite(inv.code)">
            📋 复制
          </el-button>
          <el-button size="small" type="danger" @click="deleteInvite(index)">
            🗑
          </el-button>
        </div>
      </div>
      <div v-else class="empty">
        <p>暂无邀请链接</p>
        <span class="sub">点击「+ 创建邀请链接」生成新的邀请</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-invites {
  padding: 24px;
  max-width: 800px;
}

.page-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }
}

.invite-tip {
  padding: 8px 12px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--font-secondary);
  background: var(--bg-card, rgba(255, 255, 255, 3%));
  border-radius: 6px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 6%));
}

.form-hint {
  margin-top: 4px;
  font-size: 13px;
  color: var(--font-secondary);
}

.invite-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.invite-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background-color: var(--bg-card, rgba(255, 255, 255, 3%));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 6%));
  border-radius: 8px;
  gap: 12px;

  &:hover {
    border-color: rgba(255, 255, 255, 12%);
  }
}

.invite-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.invite-code {
  display: flex;
  align-items: center;
  gap: 10px;
}

.code-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-color-primary);
  letter-spacing: 1px;
  font-family: monospace;
}

.status-tag {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;

  &.active {
    color: #67c23a;
    background: rgba(103, 194, 58, 0.15);
  }

  &.expired {
    color: #f56c6c;
    background: rgba(245, 108, 108, 0.15);
  }
}

.invite-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--font-secondary);

  .divider {
    color: var(--border-color);
  }
}

.invite-url {
  font-size: 12px;
  color: var(--font-secondary);
  font-family: monospace;
  word-break: break-all;
  opacity: 0.7;
  cursor: pointer;
  
  &:hover {
    opacity: 1;
  }
}

.invite-actions {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
}

.loading {
  padding: 40px;
  text-align: center;
  color: var(--font-secondary);
}

.empty {
  padding: 40px;
  text-align: center;
  color: var(--font-secondary);

  p {
    margin: 0 0 4px;
    font-size: 14px;
  }

  .sub {
    font-size: 12px;
    opacity: 0.7;
  }
}
</style>