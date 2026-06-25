<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apis from '@/services/apis'
import type { ThreadVO } from '@/services/types'
import { useGlobalStore } from '@/stores/global'
const props = defineProps<{ channelId: number }>()
const emit = defineEmits<{ close: [] }>()
const globalStore = useGlobalStore()
const threads = ref<ThreadVO[]>([])
const loading = ref(false)
onMounted(async () => { loading.value = true; const data = await apis.getThreads(props.channelId).send(); if (data) threads.value = data.list; loading.value = false })
function openThread(tid: number) { globalStore.enterThread(tid) }
</script>
<template>
  <aside class="thread-panel">
    <div class="panel-header"><span>🧵 话题</span><el-button size="small" text @click="$emit('close')">✕</el-button></div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-for="t in threads" :key="t.id" class="thread-item" @click="openThread(t.id)"><div class="thread-name">{{ t.name || '话题' }}</div><div class="thread-meta">{{ t.messageCount || 0 }} 条消息 · {{ t.status }}</div></div>
    <div v-if="!loading && !threads.length" class="empty">暂无话题</div>
  </aside>
</template>
<style lang="scss" scoped>
.thread-panel { width:280px;min-width:280px;background-color:var(--background-secondary);display:flex;flex-direction:column }
.panel-header { display:flex;justify-content:space-between;align-items:center;padding:12px 16px;font-weight:600;border-bottom:1px solid var(--divider-color) }
.thread-item { padding:10px 16px;cursor:pointer;border-bottom:1px solid var(--divider-color);&:hover{background-color:var(--bg-hover)} }
.thread-name { font-size:14px;font-weight:500 }
.thread-meta { font-size:12px;color:var(--font-secondary);margin-top:2px }
.loading,.empty { padding:24px;text-align:center;color:var(--font-secondary);font-size:13px }
</style>
