<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'

defineEmits<{ toggleThread: []; toggleMembers: [] }>()

const router = useRouter()
const serverStore = useServerStore()
const globalStore = useGlobalStore()

const ch = computed(() => {
  const cid = globalStore.currentChannelId
  for (const cat of serverStore.currentDetail?.categories || []) {
    const found = cat.channels.find((c) => c.id === cid)
    if (found) return found
  }
  return null
})

const sid = computed(() => globalStore.currentServerId)

function goMembers() {
  if (sid.value) router.push(`/servers/${sid.value}/members`)
}
function goSettings() {
  if (sid.value) router.push(`/servers/${sid.value}/settings`)
}
function goSearch() {
  if (sid.value) router.push(`/servers/${sid.value}/search`)
}
</script>

<template>
  <div class="chat-header">
    <div class="header-left">
      <span class="channel-hash">#</span>
      <div class="header-info">
        <span class="channel-name">{{ ch?.name || '' }}</span>
        <span v-if="ch?.topic" class="channel-topic">{{ ch.topic }}</span>
      </div>
    </div>
    <div class="header-actions">
      <button class="header-btn" title="搜索消息" @click="goSearch">
        <span class="btn-icon">🔍</span>
      </button>
      <button class="header-btn" title="话题" @click="$emit('toggleThread')">
        <span class="btn-icon">🧵</span>
      </button>
      <button class="header-btn" title="成员" @click="$emit('toggleMembers')">
        <span class="btn-icon">👥</span>
      </button>
      <button class="header-btn" title="成员列表" @click="goMembers">
        <span class="btn-icon">📋</span>
      </button>
      <button class="header-btn" title="服务器设置" @click="goSettings">
        <span class="btn-icon">⚙️</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  min-height: 48px;
  padding: 0 16px;
  background-color: var(--background-wrapper, #272a37);
  border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 6%));
}

.header-left {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.channel-hash {
  flex-shrink: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--font-secondary, #949ba4);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.channel-name {
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-topic {
  overflow: hidden;
  font-size: 12px;
  color: var(--font-secondary, #949ba4);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
}

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--bg-hover, rgba(255, 255, 255, 8%));
  }
}

.btn-icon {
  font-size: 16px;
}
</style>
