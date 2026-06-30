<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import ServerIcon from './ServerIcon.vue'
import CreateServerModal from './CreateServerModal.vue'

const router = useRouter()
const serverStore = useServerStore()
const globalStore = useGlobalStore()
const userStore = useUserStore()
const createModalRef = ref<InstanceType<typeof CreateServerModal>>()

onMounted(() => {
  if (userStore.isSign) serverStore.getMyServers()
})

// 登录后自动加载服务器列表
watch(
  () => userStore.isSign,
  (isSign) => {
    if (isSign) serverStore.getMyServers()
  },
)

const servers = computed(() => serverStore.servers)
const activeServerId = computed(() => globalStore.currentServerId)

async function onServerClick(serverId: number) {
  try {
    await globalStore.enterServer(serverId)
    await serverStore.getServerDetail(serverId)
  } catch {
    ElMessage.error('加载服务器失败，请重试')
  }
  // 无论数据加载成功与否，都要导航到目标服务器页面
  const cats = serverStore.currentDetail?.categories || []
  const allChannels: (typeof cats)[number]['channels'] = []
  for (const cat of cats) {
    allChannels.push(...cat.channels)
  }
  if (allChannels.length) {
    globalStore.enterChannel(allChannels[0].id)
    router.push(`/servers/${serverId}/channels/${allChannels[0].id}`)
  } else {
    router.push(`/servers/${serverId}/channels/`)
  }
}
</script>

<template>
  <nav class="server-list">
    <router-link to="/discover" class="discover-link" title="发现服务器">
      <el-avatar shape="rounded" :size="48" class="discover-icon">🧭</el-avatar>
    </router-link>
    <div class="server-icons">
      <ServerIcon
        v-for="s in servers"
        :key="s.id"
        :server="s"
        :is-active="activeServerId === s.id"
        @click="onServerClick"
      />
    </div>
    <div class="divider" />
    <div class="create-server-btn" @click="createModalRef?.open()">
      <el-avatar shape="rounded" :size="48" class="add-server-icon">
        <el-icon :size="24"><IEpPlus /></el-icon>
      </el-avatar>
    </div>
    <CreateServerModal ref="createModalRef" />
  </nav>
</template>

<style lang="scss" scoped>
.server-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 72px;
  min-height: 100%;
  padding: 12px 0;
  overflow-y: auto;
  background-color: var(--background-dark, #1e1e2e);
}

.discover-link {
  margin-bottom: 4px;

  .discover-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    background: var(--bg-hover, rgba(255, 255, 255, 5%));
    transition: border-radius 0.2s;

    &:hover {
      background: var(--el-color-primary);
      border-radius: 30%;
    }
  }
}

.server-icons {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.divider {
  width: 32px;
  height: 2px;
  margin: 8px 0;
  background-color: var(--divider-color, rgba(255, 255, 255, 10%));
  border-radius: 1px;
}

.create-server-btn {
  cursor: pointer;

  .add-server-icon {
    background-color: var(--bg-hover, rgba(255, 255, 255, 5%));
    transition: background-color 0.2s, border-radius 0.2s;

    &:hover {
      background-color: var(--el-color-primary);
      border-radius: 30%;
    }
  }
}
</style>
