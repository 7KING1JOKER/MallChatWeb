<script setup lang="ts">
import { onMounted } from 'vue'
import { useServerStore } from '@/stores/server'
const props = defineProps<{ serverId: number }>()
const emit = defineEmits<{ close: [] }>()
const serverStore = useServerStore()
onMounted(() => { serverStore.getMembers(props.serverId, true) })
</script>
<template>
  <aside class="member-sidebar">
    <div class="panel-header"><span>👥 成员 ({{ serverStore.members.length }})</span><el-button size="small" text @click="$emit('close')">✕</el-button></div>
    <div class="member-list">
      <div v-for="m in serverStore.members" :key="m.userId" class="member-item">
        <el-avatar :size="32" :src="m.avatar" />
        <div class="member-info">
          <div class="member-name">{{ m.serverNickname || m.nickname }}<span v-if="m.roles?.length" class="role-badge">{{ m.roles[0].name }}</span></div>
        </div>
      </div>
    </div>
  </aside>
</template>
<style lang="scss" scoped>
.member-sidebar { width:240px;min-width:240px;background-color:var(--background-secondary);display:flex;flex-direction:column }
.panel-header { display:flex;justify-content:space-between;align-items:center;padding:12px 16px;font-weight:600;border-bottom:1px solid var(--divider-color) }
.member-list { flex:1;overflow-y:auto }
.member-item { display:flex;align-items:center;gap:10px;padding:8px 16px;cursor:pointer;&:hover{background-color:var(--bg-hover)} }
.member-info { flex:1 }
.member-name { font-size:14px;display:flex;align-items:center;gap:6px }
.role-badge { font-size:10px;padding:1px 6px;border-radius:4px;background-color:var(--el-color-primary-light);color:var(--el-color-primary) }
</style>
