<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { useUserStore } from '@/stores/user'
import apis from '@/services/apis'
import type { MemberVO } from '@/services/types'

const route = useRoute()
const router = useRouter()
const serverStore = useServerStore()
const globalStore = useGlobalStore()
const userStore = useUserStore()

const serverId = computed(() => Number(route.params.serverId))
const isOwner = computed(() => serverStore.currentServer?.ownerId === userStore.userInfo?.id)

const form = reactive({ name: '', description: '', icon: '' })
const saving = ref(false)

// 转让相关
const transferDialogVisible = ref(false)
const transferLoading = ref(false)
const selectedUserId = ref<number | null>(null)
const confirmServerName = ref('')
const members = ref<MemberVO[]>([])
const membersLoading = ref(false)

onMounted(async () => {
  const sid = serverId.value
  if (sid && sid !== globalStore.currentServerId) {
    await globalStore.enterServer(sid)
    await serverStore.getServerDetail(sid)
  }
  const s = serverStore.currentServer
  if (s) {
    form.name = s.name || ''
    form.description = s.description || ''
    form.icon = s.icon || ''
  }
  // 加载成员列表
  await loadMembers()
})

async function loadMembers() {
  if (!serverId.value) return
  membersLoading.value = true
  try {
    const res = await apis.getMembers(serverId.value, { pageSize: 100 }).send()
    members.value = res.list || []
  } catch {
    // ignore
  } finally {
    membersLoading.value = false
  }
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning('服务器名称不能为空')
    return
  }
  saving.value = true
  try {
    await serverStore.updateServer(serverId.value, form)
    ElMessage.success('保存成功')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function deleteServer() {
  try {
    await ElMessageBox.confirm('删除后所有数据将无法恢复，确定要删除此服务器？', '删除服务器', {
      type: 'error',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  try {
    await serverStore.deleteServer(serverId.value)
    ElMessage.success('服务器已删除')
    const remaining = serverStore.servers
    if (remaining.length > 0) {
      await globalStore.enterServer(remaining[0].id)
      await serverStore.getServerDetail(remaining[0].id)
      const cats = serverStore.currentDetail?.categories || []
      const allChannels: { id: number }[] = []
      for (const cat of cats) {
        allChannels.push(...cat.channels)
      }
      if (allChannels.length) {
        globalStore.enterChannel(allChannels[0].id)
        router.push(`/servers/${remaining[0].id}/channels/${allChannels[0].id}`)
      } else {
        router.push(`/servers/${remaining[0].id}/channels/`)
      }
    } else {
      globalStore.resetServerState()
      router.push('/')
    }
  } catch (e: any) {
    ElMessage.error('删除后导航失败：' + (e?.message || '未知错误'))
  }
}

// ============ 转让所有权 ============
function openTransferDialog() {
  selectedUserId.value = null
  confirmServerName.value = ''
  transferDialogVisible.value = true
}

async function confirmTransfer() {
  if (!selectedUserId.value) {
    ElMessage.warning('请选择要转让的成员')
    return
  }
  if (confirmServerName.value !== serverStore.currentServer?.name) {
    ElMessage.warning('服务器名称输入不正确')
    return
  }

  transferLoading.value = true
  try {
    await apis.transferOwnership(serverId.value, {
      newOwnerId: selectedUserId.value
    }).send()
    
    const target = members.value.find(m => m.userId === selectedUserId.value)
    ElMessage.success(`服务器已转让给 ${target?.nickname || '新所有者'}`)
    transferDialogVisible.value = false
    
    await serverStore.getServerDetail(serverId.value)
  } catch (error: any) {
    const errData = error?.data || error?.response?.data
    const errMsg = errData?.message || error?.message || '转让失败'
    ElMessage.error(errMsg)
  } finally {
    transferLoading.value = false
  }
}
</script>

<template>
  <div class="settings-overview">
    <h3>服务器概览</h3>
    <div class="form-section">
      <el-form label-position="top" @submit.prevent="save">
        <el-form-item label="服务器名称">
          <el-input v-model="form.name" maxlength="32" placeholder="服务器名称" />
        </el-form-item>
        <el-form-item label="服务器描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="256"
            placeholder="给你的服务器添加一段描述（选填）"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="save">保存修改</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="danger-zone">
      <h4>⚠️ 危险区域</h4>
      
      <div v-if="isOwner" class="danger-item">
        <div class="danger-item-info">
          <span class="danger-item-title">转让服务器所有权</span>
          <span class="danger-item-desc">将服务器所有权转让给其他成员</span>
        </div>
        <el-button type="warning" @click="openTransferDialog">转让所有权</el-button>
      </div>

      <el-divider v-if="isOwner" />

      <div class="danger-item">
        <div class="danger-item-info">
          <span class="danger-item-title">删除服务器</span>
          <span class="danger-item-desc">删除服务器将移除所有频道、消息和成员数据</span>
        </div>
        <el-button type="danger" @click="deleteServer">删除服务器</el-button>
      </div>
    </div>

    <!-- 简单转让弹窗 -->
    <el-dialog
      v-model="transferDialogVisible"
      title="转让服务器所有权"
      width="440px"
      :close-on-click-modal="false"
    >
      <div class="transfer-content">
        <p class="transfer-hint">选择要转让的成员：</p>
        
        <el-select
          v-model="selectedUserId"
          placeholder="请选择成员"
          style="width: 100%;"
          :loading="membersLoading"
        >
          <el-option
            v-for="m in members"
            :key="m.userId"
            :label="m.nickname"
            :value="m.userId"
            :disabled="m.userId === userStore.userInfo?.id"
          >
            <span>{{ m.nickname }}</span>
            <span v-if="m.userId === serverStore.currentServer?.ownerId" style="color: #e6a23c; margin-left: 8px;">👑 当前所有者</span>
            <span v-if="m.userId === userStore.userInfo?.id" style="color: #909399; margin-left: 8px;">（自己）</span>
          </el-option>
        </el-select>

        <div class="transfer-warning">
          ⚠️ 转让后你将失去管理员权限
        </div>

        <el-form label-position="top" style="margin-top: 12px;">
          <el-form-item label="请输入服务器名称以确认：">
            <el-input
              v-model="confirmServerName"
              :placeholder="`输入「${serverStore.currentServer?.name}」确认`"
              size="default"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button 
          type="danger" 
          :loading="transferLoading"
          :disabled="!selectedUserId || confirmServerName !== serverStore.currentServer?.name"
          @click="confirmTransfer"
        >
          确认转让
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.settings-overview {
  max-width: 560px;
  padding: 24px;

  h3 {
    margin: 0 0 20px;
    font-size: 18px;
    font-weight: 700;
  }
}

.form-section {
  margin-bottom: 32px;
}

.danger-zone {
  padding: 20px;
  border: 1px solid var(--el-color-danger);
  border-radius: 8px;

  h4 {
    margin: 0 0 12px;
    color: var(--el-color-danger);
    font-size: 14px;
  }
}

.danger-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;

  &:last-child {
    padding-bottom: 0;
  }
}

.danger-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.danger-item-title {
  font-size: 14px;
  font-weight: 500;
}

.danger-item-desc {
  font-size: 12px;
  color: var(--font-secondary);
}

.transfer-content {
  .transfer-hint {
    margin: 0 0 12px;
    font-size: 14px;
    color: var(--font-secondary);
  }
}

.transfer-warning {
  margin-top: 12px;
  padding: 10px 12px;
  font-size: 13px;
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.1);
  border-radius: 6px;
}
</style>