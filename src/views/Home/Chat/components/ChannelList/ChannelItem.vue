<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChannelVO } from '@/services/types'
import { ChannelType, PermissionBit } from '@/services/types'
import { useServerStore } from '@/stores/server'

const props = defineProps<{ 
  channel: ChannelVO
  serverId: number
  unreadCount?: number
  isActive?: boolean 
}>()

const emit = defineEmits<{ 
  click: [channelId: number]
  edit: [channel: ChannelVO]
  delete: [channel: ChannelVO]
}>()

const serverStore = useServerStore()
const dropdownRef = ref<any>(null)

const isVoice = computed(() => props.channel.type === ChannelType.VOICE)

const badge = computed(() =>
  props.unreadCount ? (props.unreadCount > 99 ? 99 : props.unreadCount) : 0,
)

const canManage = computed(() => {
  return serverStore.hasPermission(PermissionBit.MANAGE_CHANNELS) ||
         serverStore.hasPermission(PermissionBit.ADMINISTRATOR)
})

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  if (!canManage.value) return
  if (dropdownRef.value) {
    dropdownRef.value.handleOpen()
  }
}

const handleEdit = () => {
  emit('edit', props.channel)
}

const handleDelete = () => {
  emit('delete', props.channel)
}

const handleClick = () => {
  emit('click', props.channel.id)
}
</script>

<template>
  <el-dropdown
    ref="dropdownRef"
    trigger="contextmenu"
    placement="bottom-start"
    :hide-on-click="true"
    class="channel-dropdown"
    @command="(cmd: string) => { if (cmd === 'edit') handleEdit(); else if (cmd === 'delete') handleDelete(); }"
  >
    <div
      :class="['channel-card', { active: isActive, voice: isVoice }]"
      @click="handleClick"
      @contextmenu.prevent="handleContextMenu"
    >
      <div class="card-left">
        <span class="channel-icon">{{ isVoice ? '🔊' : '#' }}</span>
      </div>
      <div class="card-body">
        <span class="channel-name">{{ channel.name }}</span>
        <span v-if="channel.topic" class="channel-topic">{{ channel.topic }}</span>
      </div>
      <el-badge v-if="badge" :value="badge" :max="99" class="unread-badge" />
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="edit">📝 编辑频道</el-dropdown-item>
        <el-dropdown-item command="delete" style="color: #f56c6c;">🗑 删除频道</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
.channel-dropdown {
  display: block !important;
  width: 100% !important;
}

.channel-dropdown :deep(.el-dropdown__wrapper) {
  display: block !important;
  width: 100% !important;
}

.channel-card {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 4px;
  font-size: 14px;
  color: var(--font-secondary, #949ba4);
  cursor: pointer;
  background: var(--bg-card, rgba(255, 255, 255, 3%));
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.15s ease;
  width: 100%;

  &:hover {
    color: var(--font-main);
    background: var(--bg-hover, rgba(255, 255, 255, 6%));
    border-color: var(--border-hover, rgba(255, 255, 255, 8%));
  }

  &.active {
    color: var(--font-main, #fff);
    background: var(--bg-active, rgba(88, 101, 242, 15%));
    border-color: var(--el-color-primary, #5865f2);

    .channel-icon {
      color: var(--el-color-primary, #5865f2);
    }
  }
}

.card-left {
  flex-shrink: 0;
}

.channel-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 18px;
  background: rgba(0, 0, 0, 20%);
  border-radius: 6px;
  transition: color 0.15s;
}

.card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.channel-name {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-topic {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.6;
}

.unread-badge {
  flex-shrink: 0;
}
</style>