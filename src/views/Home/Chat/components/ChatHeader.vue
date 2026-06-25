<script setup lang="ts">
import { computed } from 'vue'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
defineEmits<{ 'toggleThread': []; 'toggleMembers': [] }>()
const serverStore = useServerStore()
const globalStore = useGlobalStore()
const ch = computed(() => {
  const cid = globalStore.currentChannelId
  for (const cat of serverStore.currentDetail?.categories || []) {
    const found = cat.channels.find((c) => c.id === cid); if (found) return found
  }
  return null
})
</script>
<template>
  <div class="chat-header">
    <div class="header-left">
      <span class="channel-name"># {{ ch?.name || '' }}</span>
      <span v-if="ch?.topic" class="channel-topic">{{ ch.topic }}</span>
    </div>
    <div class="header-actions">
      <el-button size="small" text @click="$emit('toggleThread')">🧵 话题</el-button>
      <el-button size="small" text @click="$emit('toggleMembers')">👥 成员</el-button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.chat-header { display:flex;align-items:center;justify-content:space-between;padding:0 16px;height:48px;min-height:48px;border-bottom:1px solid var(--divider-color) }
.header-left { display:flex;flex-direction:column;gap:1px }
.channel-name { font-size:15px;font-weight:600 }
.channel-topic { font-size:12px;color:var(--font-secondary) }
.header-actions { display:flex;gap:4px }
</style>
