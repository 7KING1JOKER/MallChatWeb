<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import apis from '@/services/apis'
import { useServerStore } from '@/stores/server'
import eventBus from '@/utils/eventBus'

const serverStore = useServerStore()
const visible = ref(false)
const form = reactive({ name: '', description: '', icon: '' })
const saving = ref(false)

function open() {
  form.name = ''
  form.description = ''
  form.icon = ''
  visible.value = true
}

async function submit() {
  if (!form.name.trim()) { ElMessage.warning('请输入服务器名称'); return }
  saving.value = true
  try {
    const server = await serverStore.createServer(form)
    if (server) {
      ElMessage.success('服务器创建成功')
      visible.value = false
      eventBus.emit('serverCreated', server)
    }
  } catch {
    ElMessage.error('创建失败')
  } finally { saving.value = false }
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="创建服务器" width="480px" :close-on-click-modal="false" center>
    <el-form label-position="top" @submit.prevent="submit">
      <el-form-item label="服务器名称" required>
        <el-input v-model="form.name" maxlength="32" placeholder="给你的服务器起个名字" />
      </el-form-item>
      <el-form-item label="服务器描述">
        <el-input v-model="form.description" type="textarea" :rows="3" maxlength="256" placeholder="描述一下这个服务器（选填）" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">创建</el-button>
    </template>
  </el-dialog>
</template>
