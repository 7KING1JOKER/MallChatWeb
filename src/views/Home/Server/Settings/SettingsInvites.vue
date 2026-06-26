<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useGlobalStore } from '@/stores/global'
import apis from '@/services/apis'
import type { InviteVO } from '@/services/types'

const route = useRoute()
const globalStore = useGlobalStore()

const serverId = computed(() => Number(route.params.serverId))

onMounted(async () => {
  const sid = serverId.value
  if (sid && sid !== globalStore.currentServerId) {
    await globalStore.enterServer(sid)
  }
})

const invites = ref<InviteVO[]>([])
const loading = ref(false)

// 创建表单
const showCreate = ref(false)
const maxUses = ref<number>(0)
const expireDays = ref<number>(7)

async function loadInvites() {
  // 后端暂无 list invites 端点，此处留作占位
}

async function createInvite() {
  try {
    const data = {
      maxUses: maxUses.value || undefined,
      expireDays: expireDays.value || undefined,
    }
    const inv = await apis.createInvite(serverId.value, data).send()
    if (inv) {
      invites.value.unshift(inv)
      ElMessage.success('邀请链接已创建')
      showCreate.value = false
    }
  } catch {
    ElMessage.error('创建失败')
  }
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code).then(() => ElMessage.success('邀请码已复制'))
}
</script>

<template>
  <div class="settings-invites">
    <div class="page-top">
      <h3>邀请管理</h3>
      <el-button type="primary" size="small" @click="showCreate = true">+ 创建邀请</el-button>
    </div>

    <!-- 创建弹窗 -->
    <el-dialog v-model="showCreate" title="创建邀请链接" width="400px">
      <el-form label-position="top">
        <el-form-item label="最大使用次数（0=无限）">
          <el-input-number v-model="maxUses" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="过期天数（0=永不过期）">
          <el-input-number v-model="expireDays" :min="0" :max="365" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="createInvite">创建</el-button>
      </template>
    </el-dialog>

    <div class="invite-list">
      <div v-for="inv in invites" :key="inv.id" class="invite-card">
        <div class="invite-info">
          <code class="invite-code">{{ inv.code }}</code>
          <div class="invite-meta">
            {{ inv.usedCount || 0 }} / {{ inv.maxUses || '∞' }} 次使用 ·
            {{ inv.status === 'active' ? '有效' : '已失效' }}
          </div>
        </div>
        <el-button size="small" @click="copyCode(inv.code)">复制</el-button>
      </div>
      <div v-if="!invites.length && !loading" class="empty">
        暂无邀请，点击上方按钮创建
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-invites {
  padding: 24px;
}

.page-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }
}

.invite-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invite-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background-color: var(--bg-card, rgba(255, 255, 255, 3%));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 6%));
  border-radius: 8px;
}

.invite-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.invite-code {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-color-primary);
  letter-spacing: 1px;
}

.invite-meta {
  font-size: 12px;
  color: var(--font-secondary);
}

.empty {
  padding: 40px;
  font-size: 14px;
  color: var(--font-secondary);
  text-align: center;
}
</style>
