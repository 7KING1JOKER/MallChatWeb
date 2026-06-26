<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useGlobalStore } from '@/stores/global'
import apis from '@/services/apis'
import type { ThreadVO } from '@/services/types'

const chatStore = useChatStore()
const globalStore = useGlobalStore()
const threadInfo = ref<ThreadVO | null>(null)
const loading = ref(false)

const threadId = computed(() => globalStore.currentThreadId)
const messages = computed(() => (threadId.value ? chatStore.getThreadMsgs(threadId.value) : []))

onMounted(async () => {
  if (!threadId.value) return
  loading.value = true
  try {
    const t = await apis.getThread(threadId.value).send()
    threadInfo.value = t
    await chatStore.getThreadMessages(threadId.value)
  } catch {
    /* ignore */
  } finally {
    loading.value = false
  }
})
</script>
<template>
  <div v-if="threadId" class="thread-view">
    <div v-if="loading" class="loading">加载话题中...</div>
    <template v-else>
      <div class="thread-header">
        <span @click="globalStore.leaveThread()" class="back-btn">← 返回</span>
        <span class="thread-title">🧵 {{ threadInfo?.name || '话题' }}</span>
        <span v-if="threadInfo?.status" class="thread-status">{{ threadInfo.status }}</span>
      </div>
      <div class="thread-messages">
        <div v-for="msg in messages" :key="msg.id" class="thread-msg">
          <el-avatar :size="24" :src="msg.fromUser.avatar" class="msg-avatar" />
          <div class="msg-body">
            <span class="msg-author">{{ msg.fromUser.nickname }}</span>
            <span class="msg-content">{{ msg.content }}</span>
          </div>
        </div>
        <div v-if="!messages.length" class="empty">暂无话题消息</div>
      </div>
    </template>
  </div>
  <div v-else class="no-thread">未选择话题</div>
</template>
<style lang="scss" scoped>
.thread-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.thread-header {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--divider-color);
}
.back-btn {
  font-size: 13px;
  color: var(--el-color-primary);
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
}
.thread-title {
  flex: 1;
  font-weight: 600;
}
.thread-status {
  padding: 2px 8px;
  font-size: 11px;
  color: var(--font-secondary);
  background-color: var(--bg-hover);
  border-radius: 4px;
}
.thread-messages {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}
.thread-msg {
  display: flex;
  gap: 8px;
  padding: 6px 16px;
  &:hover {
    background-color: var(--bg-hover);
  }
}
.msg-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}
.msg-body {
  flex: 1;
  min-width: 0;
}
.msg-author {
  margin-right: 8px;
  font-size: 13px;
  font-weight: 500;
}
.msg-content {
  font-size: 13px;
  color: var(--font-main);
}
.loading,
.empty,
.no-thread {
  padding: 24px;
  font-size: 13px;
  color: var(--font-secondary);
  text-align: center;
}
</style>
