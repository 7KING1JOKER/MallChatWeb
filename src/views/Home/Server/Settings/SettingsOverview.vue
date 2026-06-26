<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { useUserStore } from '@/stores/user'
import apis from '@/services/apis'

const route = useRoute()
const router = useRouter()
const serverStore = useServerStore()
const globalStore = useGlobalStore()
const userStore = useUserStore()

const serverId = computed(() => Number(route.params.serverId))
const isOwner = computed(() => serverStore.currentServer?.ownerId === userStore.userInfo.id)

onMounted(async () => {
  const sid = serverId.value
  if (sid && sid !== globalStore.currentServerId) {
    await globalStore.enterServer(sid)
    await serverStore.getServerDetail(sid)
  }
})

const form = reactive({ name: '', description: '', icon: '' })
const saving = ref(false)

onMounted(() => {
  const s = serverStore.currentServer
  if (s) {
    form.name = s.name || ''
    form.description = s.description || ''
    form.icon = s.icon || ''
  }
})

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
    await serverStore.deleteServer(serverId.value)
    ElMessage.success('服务器已删除')
    router.push('/')
  } catch {
    /* cancelled */
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
      <p class="danger-desc">删除服务器将移除所有频道、消息和成员数据，此操作不可撤销。</p>
      <el-button type="danger" @click="deleteServer">删除服务器</el-button>
    </div>
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
    margin: 0 0 8px;
    color: var(--el-color-danger);
  }
}

.danger-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--font-secondary);
}
</style>
