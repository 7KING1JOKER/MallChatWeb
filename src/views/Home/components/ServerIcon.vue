<script setup lang="ts">
import { computed } from 'vue'
import type { ServerVO } from '@/services/types'

const props = defineProps<{
  server: ServerVO
  unreadCount?: number
  isActive: boolean
}>()

const emit = defineEmits<{ click: [serverId: number] }>()

const badgeCount = computed(() => {
  if (!props.unreadCount) return 0
  return props.unreadCount > 99 ? 99 : props.unreadCount
})
</script>

<template>
  <el-tooltip effect="dark" :content="server.name" placement="right">
    <div class="server-icon-wrapper" @click="emit('click', server.id)">
      <el-badge :value="badgeCount" :hidden="!badgeCount" :max="99">
        <el-avatar
          shape="rounded"
          :size="48"
          :src="server.icon"
          :class="['server-icon', { active: isActive }]"
        >
          {{ server.name?.charAt(0) || 'S' }}
        </el-avatar>
      </el-badge>
    </div>
  </el-tooltip>
</template>

<style lang="scss" scoped>
.server-icon-wrapper { padding: 6px 0; cursor: pointer; display: flex; justify-content: center; }
.server-icon { transition: border-radius 0.2s; border: 2px solid transparent;
  &:hover { border-radius: 30%; border-color: var(--el-color-primary); }
  &.active { border-radius: 30%; border-color: var(--el-color-primary); }
}
</style>
