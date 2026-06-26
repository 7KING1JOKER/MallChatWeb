<script setup lang="ts">
import { computed } from 'vue'
import apis from '@/services/apis'
import type { MessageVO } from '@/services/types'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { PermissionBit } from '@/services/types'

const props = defineProps<{ message: MessageVO }>()
const userStore = useUserStore()
const chatStore = useChatStore()
const serverStore = useServerStore()
const globalStore = useGlobalStore()
const isAuthor = computed(() => props.message.fromUser.id === userStore.userInfo.id)
const canManage = computed(
  () =>
    serverStore.hasPermission(PermissionBit.ADMINISTRATOR) ||
    serverStore.hasPermission(PermissionBit.MANAGE_CHANNELS),
)

function replyTo() {
  chatStore.setReply(props.message)
}
async function deleteMsg() {
  await chatStore.deleteMessage(props.message.id)
}
async function createThread() {
  if (!globalStore.currentChannelId) return
  try {
    await apis.createThread(globalStore.currentChannelId, { rootMsgId: props.message.id }).send()
  } catch {
    /* handle error */
  }
}
const emojis = ['👍', '❤️', '😂', '🎉', '🔥']
const emit = defineEmits<{ edit: [msgId: number] }>()
</script>
<template>
  <div class="context-menu">
    <div class="menu-item" @click="replyTo()">↩ 回复</div>
    <div v-if="isAuthor" class="menu-item" @click="$emit('edit', message.id)">✏️ 编辑</div>
    <div v-if="isAuthor || canManage" class="menu-item danger" @click="deleteMsg()">🗑 删除</div>
    <div class="menu-item" @click="createThread()">🧵 创建话题</div>
    <div class="menu-sep" />
    <span v-for="e in emojis" :key="e" class="menu-emoji" @click="() => {}">{{ e }}</span>
  </div>
</template>
<style lang="scss" scoped>
.context-menu {
  position: absolute;
  top: 0;
  right: 16px;
  z-index: 100;
  display: none;
  padding: 4px 0;
  background-color: var(--background-wrapper);
  border: 1px solid var(--divider-color);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 30%);
}
.msg-item:hover .context-menu {
  display: block;
}
.menu-item {
  padding: 6px 16px;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  &:hover {
    background-color: var(--bg-hover);
  }
  &.danger {
    color: var(--el-color-danger);
  }
}
.menu-sep {
  height: 1px;
  margin: 2px 8px;
  background: var(--divider-color);
}
.menu-emoji {
  display: inline-block;
  padding: 4px 8px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  &:hover {
    background-color: var(--bg-hover);
  }
}
</style>
