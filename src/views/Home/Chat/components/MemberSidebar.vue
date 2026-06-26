<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useServerStore } from '@/stores/server'
import { useRouter } from 'vue-router'
import { PermissionBit } from '@/services/types'

const props = defineProps<{ serverId: number }>()
const emit = defineEmits<{ close: [] }>()
const serverStore = useServerStore()
const router = useRouter()

onMounted(async () => {
  await serverStore.getMembers(props.serverId, true)
})

// 分组：在线 → 管理员 → 普通 → 离线
const groups = computed(() => {
  const online: typeof serverStore.members = []
  const admins: typeof serverStore.members = []
  const normal: typeof serverStore.members = []
  for (const m of serverStore.members) {
    const isAdmin = m.roles?.some((r) => r.permissions & PermissionBit.ADMINISTRATOR)
    const isOnline = serverStore.isOnline(m.userId)
    if (isOnline) online.push(m)
    else if (isAdmin) admins.push(m)
    else normal.push(m)
  }
  return { online, admins, normal }
})

function viewAll() {
  router.push(`/servers/${props.serverId}/members`)
}
</script>

<template>
  <aside class="member-sidebar">
    <div class="panel-header">
      <span>👥 成员 ({{ serverStore.members.length }})</span>
      <el-button size="small" text @click="$emit('close')">✕</el-button>
    </div>

    <div class="member-list">
      <!-- 在线 -->
      <div v-if="groups.online.length" class="member-group">
        <div class="group-label">在线 — {{ groups.online.length }}</div>
        <div v-for="m in groups.online" :key="m.userId" class="member-item">
          <el-badge is-dot type="success" :offset="[0, 28]">
            <el-avatar :size="32" :src="m.avatar" shape="rounded">
              {{ m.nickname?.charAt(0) || 'U' }}
            </el-avatar>
          </el-badge>
          <div class="member-info">
            <div class="member-name">
              {{ m.serverNickname || m.nickname }}
            </div>
            <div class="member-roles">
              <span
                v-for="r in m.roles || []"
                :key="r.id"
                class="mini-role"
                :style="{ color: r.color || 'var(--el-color-primary)' }"
              >
                {{ r.name }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 管理员（离线） -->
      <div v-if="groups.admins.length" class="member-group">
        <div class="group-label">管理员 — {{ groups.admins.length }}</div>
        <div v-for="m in groups.admins" :key="m.userId" class="member-item offline">
          <el-avatar :size="32" :src="m.avatar" shape="rounded">
            {{ m.nickname?.charAt(0) || 'U' }}
          </el-avatar>
          <div class="member-info">
            <div class="member-name">{{ m.serverNickname || m.nickname }}</div>
          </div>
        </div>
      </div>

      <!-- 普通成员（离线） -->
      <div v-if="groups.normal.length" class="member-group">
        <div class="group-label">离线 — {{ groups.normal.length }}</div>
        <div v-for="m in groups.normal" :key="m.userId" class="member-item offline">
          <el-avatar :size="32" :src="m.avatar" shape="rounded">
            {{ m.nickname?.charAt(0) || 'U' }}
          </el-avatar>
          <div class="member-info">
            <div class="member-name">{{ m.serverNickname || m.nickname }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <el-button size="small" text @click="viewAll">查看全部成员 →</el-button>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.member-sidebar {
  display: flex;
  flex-direction: column;
  width: 240px;
  min-width: 240px;
  height: 100%;
  background-color: var(--background-secondary, #2b2d31);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-weight: 600;
  border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 6%));
}

.member-list {
  flex: 1;
  padding: 4px 0;
  overflow-y: auto;
}

.member-group {
  margin-bottom: 8px;
}

.group-label {
  padding: 8px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--font-secondary, #949ba4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.member-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 6px 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--bg-hover, rgba(255, 255, 255, 5%));
  }

  &.offline {
    opacity: 0.6;
  }
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 1px;
}

.mini-role {
  padding: 0 5px;
  font-size: 10px;
  font-weight: 500;
  background: rgba(255, 255, 255, 8%);
  border-radius: 3px;
}

.panel-footer {
  padding: 8px 16px;
  border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 6%));
}
</style>
