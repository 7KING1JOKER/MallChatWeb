<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGlobalStore } from '@/stores/global'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { MessageType } from '@/services/types'
import MentionPicker from '../MentionPicker.vue'

const globalStore = useGlobalStore()
const chatStore = useChatStore()
const userStore = useUserStore()
const inputText = ref('')
const showMention = ref(false)
const mentionSearch = ref('')
const replyMsg = computed(() => chatStore.currentMsgReply)
const isSign = computed(() => userStore.isSign)

async function sendText() {
  const text = inputText.value.trim()
  if (!text || !globalStore.currentChannelId) return
  await chatStore.sendMessage?.({ channelId: globalStore.currentChannelId, content: text, msgType: MessageType.TEXT, replyMsgId: replyMsg.value?.id, threadId: globalStore.currentThreadId || undefined })
  inputText.value = ''
  chatStore.clearReply()
}

function onInputChange(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value; inputText.value = val
  const idx = val.lastIndexOf('@')
  if (idx >= 0 && (idx === 0 || val[idx - 1] === ' ')) { mentionSearch.value = val.slice(idx + 1); showMention.value = true }
  else { showMention.value = false }
}
function onMentionSelect(nickname: string) { inputText.value = inputText.value.replace(/@\S*$/, `@${nickname} `); showMention.value = false }
</script>
<template>
  <div class="chat-box">
    <div v-if="replyMsg?.id" class="reply-bar">回复 {{ replyMsg.fromUser?.nickname }} <el-button size="small" text @click="chatStore.clearReply()">✕</el-button></div>
    <div class="input-row">
      <div class="input-wrapper">
        <textarea :value="inputText" class="msg-textarea" :placeholder="isSign ? '发送消息...' : '点此登录后发言~'" rows="1" v-login="() => {}" @input="onInputChange" @keydown.enter.exact.prevent="sendText()" />
        <MentionPicker v-if="showMention" :search="mentionSearch" @select="onMentionSelect" />
      </div>
      <el-button type="primary" size="small" :disabled="!inputText.trim()" @click="sendText">发送</el-button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.chat-box { padding:0 16px 16px }
.reply-bar { display:flex;align-items:center;justify-content:space-between;padding:4px 12px;font-size:13px;background-color:var(--bg-hover);border-radius:4px;margin-bottom:8px }
.input-row { display:flex;align-items:flex-end;gap:8px;background-color:var(--bg-input,rgba(255,255,255,.06));border-radius:8px;padding:8px 12px }
.input-wrapper { flex:1;position:relative }
.msg-textarea { width:100%;border:none;outline:none;background:transparent;color:var(--font-main);font-size:14px;font-family:inherit;resize:none }
</style>
