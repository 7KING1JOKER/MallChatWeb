<script setup lang="ts">
import { ref } from 'vue'
import apis from '@/services/apis'
import type { MessageVO } from '@/services/types'
import { useRoute } from 'vue-router'
const route = useRoute()
const keyword = ref('')
const results = ref<MessageVO[]>([])
const loading = ref(false)
async function search() {
  const sid = Number(route.params.serverId)
  if (!sid || !keyword.value.trim()) return
  loading.value = true
  const data = await apis.searchMessages(sid, { q: keyword.value }).send()
  if (data) results.value = data.list
  loading.value = false
}
</script>
<template>
  <div class="search-page">
    <div class="search-bar"
      ><el-input v-model="keyword" placeholder="搜索消息..." @keydown.enter="search"
        ><template #append><el-button @click="search">搜索</el-button></template></el-input
      ></div
    >
    <div v-if="loading" class="loading">搜索中...</div>
    <div v-for="msg in results" :key="msg.id" class="search-result"
      ><div class="result-header"
        ><span class="result-author">{{ msg.fromUser.nickname }}</span
        ><span class="result-time">{{ msg.createTime }}</span></div
      ><div class="result-content">{{ msg.content }}</div></div
    >
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
  margin-bottom: 16px;
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
</style>
