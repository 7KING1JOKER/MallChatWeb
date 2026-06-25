<script setup lang="ts">
import { computed } from 'vue'
import type { MessageVO } from '@/services/types'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { useServerStore } from '@/stores/server'
import { PermissionBit } from '@/services/types'

const props = defineProps<{ message: MessageVO }>()
const userStore = useUserStore()
const chatStore = useChatStore()
const serverStore = useServerStore()
const isAuthor = computed(() => props.message.fromUser.id === userStore.userInfo.id)
const canManage = computed(() => serverStore.hasPermission(PermissionBit.ADMINISTRATOR) || serverStore.hasPermission(PermissionBit.MANAGE_CHANNELS))
function replyTo() { chatStore.setReply(props.message) }
async function deleteMsg() { await chatStore.deleteMsg(props.message.id) }
function createThread() { /* TODO: apis.createThread */ }
</script>
<template>
  <div class="context-menu">
    <div class="menu-item" @click="replyTo()">↩ 回复</div>
    <div v-if="isAuthor" class="menu-item" @click="() => {}">✏️ 编辑</div>
    <div v-if="isAuthor || canManage" class="menu-item danger" @click="deleteMsg()">🗑 删除</div>
    <div class="menu-item" @click="createThread()">🧵 创建话题</div>
    <div class="menu-item" @click="() => {}">👍</div>
  </div>
</template>
<style lang="scss" scoped>
.context-menu { position:absolute;right:16px;top:0;display:none;background-color:var(--background-wrapper);border:1px solid var(--divider-color);border-radius:4px;padding:4px 0;box-shadow:0 2px 8px rgba(0,0,0,.3);z-index:100 }
.msg-item:hover .context-menu { display:block }
.menu-item { padding:6px 16px;font-size:13px;cursor:pointer;white-space:nowrap;&:hover{background-color:var(--bg-hover)}&.danger{color:var(--el-color-danger)} }
</style>
