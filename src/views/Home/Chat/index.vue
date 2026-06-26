<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGlobalStore } from '@/stores/global'
import { useServerStore } from '@/stores/server'
import { useChatStore } from '@/stores/chat'
import ChannelList from './components/ChannelList/index.vue'
import ChatList from './components/ChatList/index.vue'
import ChatBox from './components/ChatBox/index.vue'
import ChatHeader from './components/ChatHeader.vue'
import ThreadPanel from './components/ThreadPanel.vue'
import MemberSidebar from './components/MemberSidebar.vue'

const route = useRoute()
const globalStore = useGlobalStore()
const serverStore = useServerStore()
const chatStore = useChatStore()

const channelId = computed(() => {
  const id = route.params.channelId
  return id ? Number(id) : null
})
const serverId = computed(() => {
  const id = route.params.serverId
  return id ? Number(id) : null
})

watch(
  [serverId, channelId],
  async ([sid, cid]) => {
    if (sid && sid !== globalStore.currentServerId) {
      await globalStore.enterServer(sid)
      await serverStore.getServerDetail(sid)
    }
    if (cid && cid !== globalStore.currentChannelId) {
      globalStore.enterChannel(cid)
      chatStore.getChannelMessages(cid)
    }
  },
  { immediate: true },
)

const showThread = ref(false)
const showMembers = ref(false)

function toggleThreadPanel() {
  showThread.value = !showThread.value
  showMembers.value = false
}
function toggleMemberPanel() {
  showMembers.value = !showMembers.value
  showThread.value = false
}
</script>
<template>
  <div class="chat-layout">
    <ChannelList />
    <div class="chat-main">
      <ChatHeader
        v-if="channelId"
        @toggle-thread="toggleThreadPanel"
        @toggle-members="toggleMemberPanel"
      />
      <ChatList v-if="channelId" />
      <div v-else class="no-channel">
        <div class="no-channel-inner">
          <span class="no-channel-icon">💬</span>
          <p>选择一个频道开始聊天</p>
          <p class="sub">请从左侧频道列表中选择或创建一个频道</p>
        </div>
      </div>
      <ChatBox v-if="channelId" />
    </div>
    <ThreadPanel
      v-if="showThread && channelId"
      :channel-id="channelId"
      @close="showThread = false"
    />
    <MemberSidebar
      v-if="showMembers && serverId"
      :server-id="serverId"
      @close="showMembers = false"
    />
  </div>
</template>
<style lang="scss" scoped>
.chat-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}
.chat-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}
.no-channel {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--font-secondary);
}
.no-channel-inner {
  text-align: center;
  .no-channel-icon {
    display: block;
    margin-bottom: 12px;
    font-size: 48px;
  }
  p {
    margin: 0;
    &.sub {
      margin-top: 6px;
      font-size: 13px;
      opacity: 0.6;
    }
  }
}
</style>
