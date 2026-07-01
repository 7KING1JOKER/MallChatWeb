<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useGlobalStore } from '@/stores/global'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { MessageType } from '@/services/types'
import type { EmojiVO } from '@/services/types'
import { useUpload } from '@/hooks/useUpload'
import { formatBytes } from '@/utils'
import wsIns from '@/utils/websocket'
import MentionPicker from '../MentionPicker.vue'
import EmojiPicker from '@/components/EmojiPicker/index.vue'

const globalStore = useGlobalStore()
const chatStore = useChatStore()
const userStore = useUserStore()

const inputText = ref('')
const showMention = ref(false)
const mentionSearch = ref('')
const showEmojiPicker = ref(false)
const replyMsg = computed(() => chatStore.currentMsgReply)
const isSign = computed(() => userStore.isSign)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// ── Multi-file state ──
interface FileAttachment {
  id: number
  name: string
  size: number
  uploading: boolean
  progress: number
  done: boolean
  error: boolean
}
const fileAttachments = ref<FileAttachment[]>([])

// ── TYPING with debounce ──
let typingTimer: ReturnType<typeof setTimeout> | null = null

function handleTyping() {
  if (!globalStore.currentChannelId) return
  wsIns.sendTypingStart(globalStore.currentChannelId)
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    if (globalStore.currentChannelId) wsIns.sendTypingStop(globalStore.currentChannelId)
  }, 2000)
}

// ── Collect pending file IDs ──
const pendingFileIds = computed(() =>
  fileAttachments.value.filter((f) => f.done).map((f) => f.id),
)

const hasUploading = computed(() =>
  fileAttachments.value.some((f) => f.uploading),
)

// ── Send ──
async function sendText() {
  const text = inputText.value.trim()
  // 允许纯文件消息（无文本）发送
  if ((!text && !pendingFileIds.value.length) || !globalStore.currentChannelId) return
  if (hasUploading.value) return
  if (typingTimer) {
    clearTimeout(typingTimer)
    typingTimer = null
  }
  wsIns.sendTypingStop(globalStore.currentChannelId)
  const fileIds = pendingFileIds.value.length ? pendingFileIds.value : undefined
  // 根据文件类型决定 msgType：图片→IMAGE，其他文件→FILE，无文件→TEXT
  let msgType = MessageType.TEXT
  if (fileIds && fileIds.length > 0) {
    const firstAtt = fileAttachments.value.find(f => f.done)
    if (firstAtt) {
      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(firstAtt.name)
      msgType = isImage ? MessageType.IMAGE : MessageType.FILE
    }
  }
  await chatStore.sendMessage?.({
    channelId: globalStore.currentChannelId,
    content: text || '',
    msgType,
    replyMsgId: replyMsg.value?.id,
    threadId: globalStore.currentThreadId || undefined,
    fileIds,
  })
  inputText.value = ''
  fileAttachments.value = []
  chatStore.clearReply()
}

// ── Send sticker (custom emoji message) ──
async function sendSticker(emoji: EmojiVO) {
  if (!globalStore.currentChannelId) return
  await chatStore.sendMessage?.({
    channelId: globalStore.currentChannelId,
    content: emoji.url,
    msgType: MessageType.EMOJI,
    replyMsgId: replyMsg.value?.id,
    threadId: globalStore.currentThreadId || undefined,
  })
  showEmojiPicker.value = false
}

// ── Text input ──
function onInputChange(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value
  inputText.value = val
  handleTyping()
  const idx = val.lastIndexOf('@')
  if (idx >= 0 && (idx === 0 || val[idx - 1] === ' ')) {
    mentionSearch.value = val.slice(idx + 1)
    showMention.value = true
  } else {
    showMention.value = false
  }
}

function onMentionSelect(nickname: string) {
  inputText.value = inputText.value.replace(/@\S*$/, `@${nickname} `)
  showMention.value = false
}

// ── Emoji Picker ──
const emojiBtnRef = ref<HTMLElement | null>(null)
function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value
}

function onSelectUnicode(emoji: string) {
  const ta = textareaRef.value
  if (ta) {
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = inputText.value.slice(0, start)
    const after = inputText.value.slice(end)
    inputText.value = before + emoji + after
    // Restore cursor position after the inserted emoji
    nextTick(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + emoji.length
    })
  } else {
    inputText.value += emoji
  }
  // Keep picker open for multi-select; close only on explicit close or outside click
}

function onSelectSticker(emoji: EmojiVO) {
  sendSticker(emoji)
}

// ── File Upload (sequential multi-file) ──
async function onFileChange(e: Event) {
  const fileList = (e.target as HTMLInputElement).files
  if (!fileList || fileList.length === 0) return
  const input = e.target as HTMLInputElement

  for (const file of Array.from(fileList)) {
    const attachment: FileAttachment = {
      id: 0,
      name: file.name,
      size: file.size,
      uploading: true,
      progress: 0,
      done: false,
      error: false,
    }
    fileAttachments.value.push(attachment)
    const idx = fileAttachments.value.length - 1

    // Use a fresh upload hook per file to get independent state tracking
    const { uploadFile, pendingFileId, progress, onStart, onChange } = useUpload()
    const attach = fileAttachments.value[idx]

    onStart(() => {
      attach.uploading = true
      attach.progress = 0
    })

    await new Promise<void>((resolve) => {
      onChange((status) => {
        if (status === 'success') {
          attach.uploading = false
          attach.done = true
          attach.progress = 100
          attach.id = pendingFileId.value ?? 0
          resolve()
        } else if (status === 'fail') {
          attach.uploading = false
          attach.error = true
          resolve()
        }
      })
      // Poll progress from the upload hook
      const poll = setInterval(() => {
        attach.progress = progress.value
        if (!attach.uploading) clearInterval(poll)
      }, 100)

      uploadFile(file)
    })
  }

  // Reset input so same files can be re-selected
  input.value = ''
}

function removeAttachment(index: number) {
  fileAttachments.value.splice(index, 1)
}

// Enter 发送，Shift+Enter 换行
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendText()
  }
}
</script>

<template>
  <div class="chat-box">
    <!-- 回复提示条 -->
    <div v-if="replyMsg?.id" class="reply-bar">
      <span class="reply-label">
        ↩ 回复 <strong>{{ replyMsg.fromUser?.nickname }}</strong>
      </span>
      <span class="reply-preview">{{ replyMsg.content?.slice(0, 80) }}</span>
      <el-button size="small" text class="reply-close" @click="chatStore.clearReply()">✕</el-button>
    </div>

    <!-- 文件附件预览 chips -->
    <div v-if="fileAttachments.length" class="attachment-chips">
      <div
        v-for="(att, i) in fileAttachments"
        :key="i"
        :class="['attachment-chip', { uploading: att.uploading, error: att.error }]"
      >
        <span class="chip-icon">
          <template v-if="att.error">❌</template>
          <template v-else-if="att.done">📎</template>
          <template v-else>⏳</template>
        </span>
        <span class="chip-name">{{ att.name }}</span>
        <span class="chip-size">{{ formatBytes(att.size) }}</span>
        <!-- Progress bar for uploading -->
        <span v-if="att.uploading" class="chip-progress">
          <span class="chip-progress-fill" :style="{ width: att.progress + '%' }"></span>
        </span>
        <button class="chip-remove" @click="removeAttachment(i)">✕</button>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="input-row">
      <!-- Emoji picker button -->
      <button
        ref="emojiBtnRef"
        class="toolbar-btn"
        title="表情"
        @click="toggleEmojiPicker"
      >
        <span class="toolbar-btn-icon">😊</span>
      </button>

      <!-- File upload button -->
      <label class="toolbar-btn" title="上传文件">
        <span class="toolbar-btn-icon">📎</span>
        <input type="file" multiple hidden @change="onFileChange" />
      </label>

      <div class="input-wrapper">
        <textarea
          ref="textareaRef"
          :value="inputText"
          class="msg-textarea"
          :placeholder="isSign ? '发送消息...' : '点此登录后发言~'"
          rows="1"
          @input="onInputChange"
          @keydown="onKeydown"
        />
        <MentionPicker v-if="showMention" :search="mentionSearch" @select="onMentionSelect" />
      </div>

      <el-button
        type="primary"
        size="small"
        :disabled="(!inputText.trim() && !pendingFileIds.length) || hasUploading"
        class="send-btn"
        @click="sendText"
      >
        发送
      </el-button>
    </div>

    <!-- Emoji Picker -->
    <EmojiPicker
      v-if="globalStore.currentServerId"
      :server-id="globalStore.currentServerId"
      :visible="showEmojiPicker"
      :trigger-el="emojiBtnRef"
      @select-unicode="onSelectUnicode"
      @select-sticker="onSelectSticker"
      @close="showEmojiPicker = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.chat-box {
  padding: 0 16px 20px;
}

.reply-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 6px 12px;
  margin-bottom: 8px;
  font-size: 13px;
  background-color: var(--bg-hover, rgba(255, 255, 255, 5%));
  border-left: 3px solid var(--el-color-primary, #5865f2);
  border-radius: 0 6px 6px 0;
}

.reply-label {
  flex-shrink: 0;
  color: var(--font-secondary);

  strong {
    color: var(--font-main);
  }
}

.reply-preview {
  flex: 1;
  overflow: hidden;
  color: var(--font-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.7;
}

.reply-close {
  flex-shrink: 0;
}

// ── Attachment Chips ──
.attachment-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.attachment-chip {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  background: var(--bg-card, rgba(255, 255, 255, 5%));
  border: 1px solid var(--divider-color, rgba(255, 255, 255, 8%));
  border-radius: 8px;

  &.uploading {
    border-color: var(--el-color-primary);
  }

  &.error {
    border-color: var(--el-color-danger, #f56c6c);
    color: var(--el-color-danger, #f56c6c);
  }
}

.chip-icon {
  flex-shrink: 0;
  font-size: 14px;
}

.chip-name {
  max-width: 160px;
  overflow: hidden;
  color: var(--font-main);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip-size {
  flex-shrink: 0;
  color: var(--font-secondary);
  opacity: 0.7;
}

.chip-progress {
  width: 48px;
  height: 4px;
  background: var(--bg-hover, rgba(255, 255, 255, 8%));
  border-radius: 2px;
  overflow: hidden;
}

.chip-progress-fill {
  height: 100%;
  background: var(--el-color-primary, #5865f2);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.chip-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  font-size: 11px;
  color: var(--font-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 50%;

  &:hover {
    color: var(--font-main);
    background: var(--bg-hover, rgba(255, 255, 255, 10%));
  }
}

// ── Input Row ──
.input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 10px 12px;
  background-color: var(--bg-input, rgba(255, 255, 255, 5%));
  border-radius: 10px;
  transition: background-color 0.2s;

  &:focus-within {
    background-color: var(--bg-input-focus, rgba(255, 255, 255, 8%));
    outline: 1px solid var(--el-color-primary-light-5, rgba(88, 101, 242, 30%));
  }
}

.toolbar-btn {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 50%;
  transition: all 0.15s;

  &:hover {
    background-color: var(--bg-hover, rgba(255, 255, 255, 10%));
  }
}

.toolbar-btn-icon {
  font-size: 20px;
  line-height: 1;
}

.input-wrapper {
  position: relative;
  flex: 1;
}

.msg-textarea {
  width: 100%;
  padding: 4px 0;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: var(--font-main);
  resize: none;
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: var(--font-secondary);
  }
}

.send-btn {
  flex-shrink: 0;
  border-radius: 8px;
}
</style>
