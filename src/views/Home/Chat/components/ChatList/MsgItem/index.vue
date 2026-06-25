<script setup lang="ts">
import { computed } from 'vue'
import type { MessageVO } from '@/services/types'
import { useUserStore } from '@/stores/user'
import { useUserInfo } from '@/hooks/useCached'
import { useChatStore } from '@/stores/chat'
import { useGlobalStore } from '@/stores/global'
import { formatTimestamp } from '@/utils/computedTime'
import renderReplyContent from '@/utils/renderReplyContent'
import ContextMenu from '../ContextMenu/index.vue'
import RenderMessage from '@/components/RenderMessage/index.vue'

const props = defineProps<{ message: MessageVO }>()
const userStore = useUserStore()
const chatStore = useChatStore()
const globalStore = useGlobalStore()
const sender = useUserInfo(props.message.fromUser.id)
const isMe = computed(() => props.message.fromUser.id === userStore.userInfo.id)
const isEdited = computed(() => props.message.status === 2)
const time = computed(() => props.message.createTime ? formatTimestamp(new Date(props.message.createTime).getTime()) : '')
const replyMsg = computed(() => props.message.replyMsgId && globalStore.currentChannelId ? chatStore.getMessages(globalStore.currentChannelId).find(m => m.id === props.message.replyMsgId) : null)
const replyContent = computed(() => replyMsg.value ? renderReplyContent(replyMsg.value.fromUser.nickname, replyMsg.value.msgType, replyMsg.value.content) : null)
</script>
<template>
  <div :class="['msg-item', { 'is-me': isMe }]">
    <div v-if="(message as any).timeBlock" class="time-block">{{ (message as any).timeBlock }}</div>
    <div class="msg-content">
      <el-avatar :size="36" :src="sender.avatar" class="msg-avatar" />
      <div class="msg-body">
        <div class="msg-header">
          <span class="msg-nickname">{{ sender.nickname || message.fromUser.nickname }}</span>
          <span class="msg-time">{{ time }}</span>
          <span v-if="isEdited" class="edited-tag">(已编辑)</span>
        </div>
        <div v-if="replyContent" class="reply-ref">{{ replyContent }}</div>
        <RenderMessage :message="message" />
        <div v-if="message.reactions?.length" class="reaction-row">
          <span v-for="r in message.reactions" :key="r.emoji" :class="['reaction-chip', { reacted: r.reacted }]" @click="() => {}">{{ r.emoji }} {{ r.count }}</span>
        </div>
        <div v-if="message.thread" class="thread-entry" @click="globalStore.enterThread(message.thread.id)">🧵 {{ message.thread.name || '话题' }} · {{ message.thread.messageCount }} 条回复</div>
      </div>
    </div>
    <ContextMenu :message="message" />
  </div>
</template>
<style lang="scss" scoped>
.msg-item { padding:2px 16px;&:hover{background-color:var(--bg-hover,rgba(255,255,255,.02))} }
.time-block { text-align:center;font-size:12px;color:var(--font-secondary);margin:12px 0 }
.msg-content { display:flex;gap:12px;padding:4px 0 }
.msg-avatar { flex-shrink:0;margin-top:2px }
.msg-body { flex:1;min-width:0 }
.msg-header { display:flex;align-items:baseline;gap:8px;margin-bottom:2px }
.msg-nickname { font-weight:500;font-size:14px }
.msg-time { font-size:11px;color:var(--font-secondary) }
.edited-tag { font-size:10px;color:var(--font-secondary) }
.reply-ref { font-size:12px;color:var(--font-secondary);border-left:2px solid var(--font-secondary);padding-left:8px;margin-bottom:4px }
.reaction-row { display:flex;gap:4px;margin-top:4px;flex-wrap:wrap }
.reaction-chip { display:inline-flex;align-items:center;gap:2px;padding:2px 8px;border-radius:8px;font-size:13px;cursor:pointer;background-color:var(--bg-hover);&:hover{border:1px solid var(--el-color-primary)}&.reacted{background-color:var(--el-color-primary-light);border:1px solid var(--el-color-primary)} }
.thread-entry { margin-top:4px;font-size:12px;color:var(--el-color-primary);cursor:pointer;&:hover{text-decoration:underline} }
</style>
