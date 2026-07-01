<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useEmojiStore } from '@/stores/emoji'
import type { EmojiVO } from '@/services/types'

const props = defineProps<{
  serverId: number
  visible: boolean
  triggerEl?: HTMLElement | null
}>()

const emit = defineEmits<{
  selectUnicode: [emoji: string]
  selectSticker: [emoji: EmojiVO]
  close: []
}>()

const emojiStore = useEmojiStore()
const activeTab = ref<'unicode' | 'server'>('unicode')

// ── Unicode emoji set ──
const unicodeEmojis = [
  // Smileys & Emotion
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😋','😛','😜',
  '🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪',
  '🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁',
  '😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱',
  '😤','😡','😠','🤬','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖',
  // Gestures & People
  '👍','👎','👏','🙌','🤝','💪','👋','🤚','✋','🖐️','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆',
  '🖕','👇','☝️','🙏','✍️','💅','🤳','💃','🕺','👯','🧗','🤸',
  // Hearts & Love
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟',
  // Nature
  '🐵','🐶','🐱','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐰','🐹','🐭','🐔','🐧','🐦','🐤',
  '🦄','🐴','🐛','🦋','🐌','🐞','🐜','🪲','🐝','🐢','🐍','🦎','🐙','🦑','🐠','🐟','🐡','🐬','🐳',
  '🌸','🌺','🌻','🌹','💐','🍀','🌿','🌵','🌴','🌳','🌲','🍁','🍂','🍃',
  // Food & Drink
  '🍎','🍊','🍋','🍌','🍉','🍇','🍓','🍒','🍑','🍍','🥝','🍅','🥑','🍔','🍕','🍟','🌭','🍿','🧂',
  '🍩','🍪','🎂','🍰','🍫','🍬','🍭','🍦','🍨','☕','🍵','🍺','🍻','🥂','🍷','🧋','🥤',
  // Activities & Sports
  '⚽','🏀','🏈','⚾','🎾','🏐','🎱','🏓','🏸','🏒','⛳','🎣','🤿','🏹','🥊','🏆','🎮','🎲','🎯','🎳',
  // Objects & Symbols
  '💻','📱','⌨️','🖥️','🖨️','📷','🎥','🔦','💡','📚','📌','✂️','🔑','💣','🔪','🧲','⏰','🕹️','🎸',
  '🎹','🎧','🎤','🎬','🎨','🖼️','🚀','✈️','🚗','🚲','⚡','🔥','💧','🌈','⭐','🌟','✨','💫','🪐',
  '✅','❌','⚠️','🚫','➕','➖','💯','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤',
  '🏠','🏢','🏫','🏥','💈','🎪','🎠','🗼','🏰','🗿','♻️','💠','ℹ️','🔞','🆘',
  // Flags
  '🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️',
]

const customEmojis = computed(() => emojiStore.emojiList)

// Load custom emojis when visible
watch(
  () => props.visible,
  (v) => {
    if (v && props.serverId) {
      emojiStore.getEmojiList(props.serverId)
    }
  },
)

function onSelectUnicode(emoji: string) {
  emit('selectUnicode', emoji)
}

function onSelectSticker(emoji: EmojiVO) {
  emit('selectSticker', emoji)
}

function onClose() {
  emit('close')
}

// Close on Escape
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') onClose()
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', onKeydown as any)
}

// ── Dynamic positioning ──
const pickerStyle = ref<Record<string, string>>({})

watch(
  () => props.visible,
  (v) => {
    if (v && props.triggerEl) {
      const rect = props.triggerEl.getBoundingClientRect()
      const pickerWidth = 340
      const pickerHeight = 360
      // Position above the trigger button, aligned to its left edge
      let left = rect.left
      let top = rect.top - 8 // 8px gap above trigger
      // If picker would overflow right edge of viewport
      if (left + pickerWidth > window.innerWidth - 8) {
        left = window.innerWidth - pickerWidth - 8
      }
      // If picker would overflow left edge
      if (left < 8) left = 8
      // If picker would overflow top, position below trigger instead
      if (top - pickerHeight < 8) {
        top = rect.bottom + 8
      } else {
        top = top - pickerHeight
      }
      pickerStyle.value = {
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${pickerWidth}px`,
        maxHeight: `${pickerHeight}px`,
        zIndex: '10001',
      }
    }
  },
)
</script>

<template>
  <div v-if="visible" class="emoji-picker-overlay" @click.self="onClose">
    <div class="emoji-picker" :style="pickerStyle">
      <!-- Tabs -->
      <div class="picker-tabs">
        <button
          :class="['picker-tab', { active: activeTab === 'unicode' }]"
          @click="activeTab = 'unicode'"
        >
          😊 表情
        </button>
        <button
          :class="['picker-tab', { active: activeTab === 'server' }]"
          @click="activeTab = 'server'"
        >
          <span>🖼️ 自定义</span>
          <span v-if="customEmojis.length" class="tab-count">{{ customEmojis.length }}</span>
        </button>
        <button class="picker-close" @click="onClose">✕</button>
      </div>

      <!-- Unicode Grid -->
      <div v-if="activeTab === 'unicode'" class="picker-body unicode-grid">
        <button
          v-for="emoji in unicodeEmojis"
          :key="emoji"
          class="emoji-btn"
          :title="emoji"
          @click="onSelectUnicode(emoji)"
        >
          {{ emoji }}
        </button>
      </div>

      <!-- Server Custom Emoji Grid -->
      <div v-if="activeTab === 'server'" class="picker-body server-grid">
        <div
          v-for="emoji in customEmojis"
          :key="emoji.id"
          class="sticker-btn"
          :title="emoji.name"
          @click="onSelectSticker(emoji)"
        >
          <img :src="emoji.url" :alt="emoji.name" class="sticker-img" loading="lazy" />
          <span class="sticker-name">{{ emoji.name }}</span>
        </div>
        <div v-if="!customEmojis.length" class="empty-hint">
          <span>暂无自定义表情</span>
          <span class="hint-sub">前往 服务器设置 → 表情管理 上传</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.emoji-picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
}

.emoji-picker {
  display: flex;
  flex-direction: column;
  background: var(--background-wrapper, #1e1f22);
  border: 1px solid var(--divider-color, rgba(255, 255, 255, 10%));
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 50%);
  overflow: hidden;
}

.picker-tabs {
  display: flex;
  gap: 0;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 8%));
  background: var(--bg-card, rgba(255, 255, 255, 2%));
}

.picker-tab {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--font-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition: all 0.15s;

  &:hover {
    color: var(--font-main);
    background: var(--bg-hover, rgba(255, 255, 255, 5%));
  }

  &.active {
    color: var(--font-main);
    background: var(--bg-hover, rgba(255, 255, 255, 10%));
  }
}

.tab-count {
  margin-left: 6px;
  padding: 0 5px;
  font-size: 10px;
  color: var(--font-secondary);
  background: var(--bg-hover, rgba(255, 255, 255, 10%));
  border-radius: 8px;
}

.picker-close {
  margin-left: auto;
  padding: 4px 10px;
  font-size: 14px;
  color: var(--font-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;

  &:hover {
    color: var(--font-main);
    background: var(--bg-hover, rgba(255, 255, 255, 5%));
  }
}

.picker-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

// Unicode emoji grid
.unicode-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
}

.emoji-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  font-size: 20px;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition: background-color 0.12s, transform 0.12s;

  &:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 8%));
    transform: scale(1.18);
  }
}

// Server custom emoji grid
.server-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.sticker-btn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 8px 4px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.12s;

  &:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 8%));
  }
}

.sticker-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 4px;
}

.sticker-name {
  max-width: 60px;
  overflow: hidden;
  font-size: 11px;
  color: var(--font-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-hint {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 32px 16px;
  font-size: 13px;
  color: var(--font-secondary);

  .hint-sub {
    font-size: 11px;
    opacity: 0.6;
  }
}
</style>
