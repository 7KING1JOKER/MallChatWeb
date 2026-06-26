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
.server-icon-wrapper {
  display: flex;
  justify-content: center;
  padding: 6px 0;
  cursor: pointer;
}

.server-icon {
  border: 2px solid transparent;
  transition: border-radius 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
    border-radius: 30%;
  }

  &.active {
    border-color: var(--el-color-primary);
    border-radius: 30%;
  }
}
</style>
