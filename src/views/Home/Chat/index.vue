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

const channelId = computed(() => { const id = route.params.channelId; return id ? Number(id) : null })
const serverId = computed(() => { const id = route.params.serverId; return id ? Number(id) : null })

watch([serverId, channelId], async ([sid, cid]) => {
  if (sid && sid !== globalStore.currentServerId) {
    await globalStore.enterServer(sid)
    await serverStore.getServerDetail(sid)
  }
  if (cid && cid !== globalStore.currentChannelId) {
    globalStore.enterChannel(cid)
    chatStore.getChannelMessages(cid)
  }
}, { immediate: true })

const showThread = ref(false)
const showMembers = ref(false)
</script>
<template>
  <div class="chat-layout">
    <ChannelList />
    <div class="chat-main">
      <ChatHeader v-if="channelId" @toggle-thread="showThread = !showThread; showMembers = false" @toggle-members="showMembers = !showMembers; showThread = false" />
      <ChatList v-if="channelId" />
      <div v-else class="no-channel">请选择一个频道开始聊天</div>
      <ChatBox v-if="channelId" />
    </div>
    <ThreadPanel v-if="showThread && channelId" :channel-id="channelId" @close="showThread = false" />
    <MemberSidebar v-if="showMembers && serverId" :server-id="serverId" @close="showMembers = false" />
  </div>
</template>
<style lang="scss" scoped>
.chat-layout { display:flex;height:100%;overflow:hidden }
.chat-main { flex:1;display:flex;flex-direction:column;min-width:0 }
.no-channel { flex:1;display:flex;align-items:center;justify-content:center;color:var(--font-secondary);font-size:16px }
</style>
