<script setup lang="ts">
import { ref } from 'vue'
import apis from '@/services/apis'
import type { MessageVO } from '@/services/types'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const keyword = ref('')
const results = ref<MessageVO[]>([])
const loading = ref(false)
const searched = ref(false)
const searchError = ref('')
const reindexing = ref(false)

async function search() {
  const sid = Number(route.params.serverId)
  if (!sid || !keyword.value.trim()) return
  loading.value = true
  searched.value = false
  searchError.value = ''
  try {
    const data = await apis.searchMessages(sid, { q: keyword.value }).send()
    if (data) results.value = data.list
    searched.value = true
  } catch (e: any) {
    // 优先展示后端返回的具体错误信息（已在 request.ts 拦截器中通过 ElMessage 弹出）
    searchError.value = e?.message || '搜索请求失败，请确认后端搜索服务（Elasticsearch）已启动'
  } finally {
    loading.value = false
  }
}

async function reindex() {
  const sid = Number(route.params.serverId)
  if (!sid) return
  reindexing.value = true
  try {
    const res = await apis.reindexMessages(sid).send()
    ElMessage.success(`索引重建完成！共同步 ${res?.indexedMessages ?? 0} 条消息`)
    // 重建后清除之前的状态，提示用户可以搜索
    searched.value = false
    results.value = []
    searchError.value = ''
  } catch (e: any) {
    ElMessage.error(e?.message || '索引重建失败')
  } finally {
    reindexing.value = false
  }
}
</script>
<template>
  <div class="search-page">
    <div class="search-bar">
      <el-input v-model="keyword" placeholder="搜索消息..." @keydown.enter="search">
        <template #append><el-button @click="search">搜索</el-button></template>
      </el-input>
    </div>

    <div class="toolbar">
      <el-button size="small" :loading="reindexing" @click="reindex">
        {{ reindexing ? '重建中...' : '重建搜索索引' }}
      </el-button>
      <span class="toolbar-hint">若搜索不到刚发的消息，可点此从数据库重建 ES 索引</span>
    </div>

    <div v-if="loading" class="loading">搜索中...</div>
    <div v-if="searchError" class="search-error">{{ searchError }}</div>
    <div v-if="searched && !loading && !results.length && !searchError" class="empty-result">
      未找到匹配的消息<br /><span class="empty-hint">（请确认 Elasticsearch 服务已启动且消息已索引，可点击上方"重建搜索索引"按钮尝试修复）</span>
    </div>
    <div v-for="msg in results" :key="msg.id" class="search-result">
      <div class="result-header">
        <span class="result-author">{{ msg.fromUser.nickname }}</span>
        <span class="result-time">{{ msg.createTime }}</span>
      </div>
      <div class="result-content">{{ msg.content }}</div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.search-page {
  height: 100%;
  padding: 24px;
  overflow-y: auto;
}

.search-bar {
  max-width: 600px;
  margin-bottom: 12px;
}

.toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-hint {
  font-size: 12px;
  color: var(--font-secondary);
}

.loading {
  padding: 24px;
  color: var(--font-secondary);
  text-align: center;
}

.search-result {
  padding: 12px;
  margin-bottom: 8px;
  background-color: var(--bg-hover);
  border-radius: 6px;
}

.result-header {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}

.result-author {
  font-size: 14px;
  font-weight: 500;
}

.result-time {
  font-size: 12px;
  color: var(--font-secondary);
}

.result-content {
  font-size: 13px;
}

.empty-result {
  padding: 40px;
  font-size: 14px;
  color: var(--font-secondary);
  text-align: center;
}

.empty-hint {
  font-size: 12px;
  opacity: 0.6;
}

.search-error {
  padding: 40px;
  font-size: 14px;
  color: var(--el-color-danger, #f56c6c);
  text-align: center;
}
</style>
