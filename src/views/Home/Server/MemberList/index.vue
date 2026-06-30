<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { useUserStore } from '@/stores/user'
import { PermissionBit } from '@/services/types'
import type { MemberVO, RoleVO } from '@/services/types'
import apis from '@/services/apis'

const route = useRoute()
const serverStore = useServerStore()
const globalStore = useGlobalStore()
const userStore = useUserStore()

const serverId = computed(() => Number(route.params.serverId))
const loading = ref(false)
const searchText = ref('')

onMounted(async () => {
  const sid = serverId.value
  if (sid && sid !== globalStore.currentServerId) {
    await globalStore.enterServer(sid)
    await serverStore.getServerDetail(sid)
  }
  await loadMembers()
  await serverStore.getRoles(serverId.value)
})

async function loadMembers() {
  loading.value = true
  try {
    await serverStore.getMembers(serverId.value, true)
  } finally {
    loading.value = false
  }
}

function onScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
    if (!serverStore.memberCursor.isLast) {
      serverStore.getMembers(serverId.value)
    }
  }
}

const filteredMembers = computed(() => {
  const q = searchText.value.toLowerCase()
  if (!q) return serverStore.members
  return serverStore.members.filter(
    (m) =>
      m.nickname.toLowerCase().includes(q) ||
      (m.serverNickname && m.serverNickname.toLowerCase().includes(q)),
  )
})

const sortedMembers = computed(() => {
  const list = [...filteredMembers.value]
  return list.sort((a, b) => {
    const aAdmin = a.roles?.some((r) => r.permissions & PermissionBit.ADMINISTRATOR) ? 1 : 0
    const bAdmin = b.roles?.some((r) => r.permissions & PermissionBit.ADMINISTRATOR) ? 1 : 0
    if (aAdmin !== bAdmin) return bAdmin - aAdmin
    const aOnline = serverStore.isOnline(a.userId) ? 1 : 0
    const bOnline = serverStore.isOnline(b.userId) ? 1 : 0
    return bOnline - aOnline
  })
})

const isOwner = computed(() => serverStore.currentServer?.ownerId === userStore.userInfo?.id)
const canKick = computed(() => serverStore.hasPermission(PermissionBit.KICK_MEMBERS))
const canManageRoles = computed(() => 
  isOwner.value || serverStore.hasPermission(PermissionBit.MANAGE_ROLES)
)

async function kickMember(userId: number) {
  try {
    await apis.leaveOrKick(serverId.value, userId).send()
    serverStore.removeMember(userId)
    ElMessage.success('已踢出成员')
  } catch {
    ElMessage.error('踢出失败')
  }
}

// ============ 移除角色 ============
async function removeRole(member: MemberVO, roleId: number) {
  const role = member.roles?.find(r => r.id === roleId)
  if (!role) return

  if (role.name === '@everyone') {
    ElMessage.warning('不能移除 @everyone 角色')
    return
  }

  const isSelf = member.userId === userStore.userInfo?.id
  if (isSelf && member.roles.length <= 1) {
    ElMessage.warning('不能移除自己的最后一个角色')
    return
  }

  if (!isOwner.value && !serverStore.hasPermission(PermissionBit.MANAGE_ROLES)) {
    ElMessage.warning('你没有权限管理角色')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定移除 ${member.serverNickname || member.nickname} 的「${role.name}」角色？`,
      '移除角色',
      {
        confirmButtonText: '确定移除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await apis.removeRole(serverId.value, member.userId, role.id).send()
    
    const target = serverStore.members.find(m => m.userId === member.userId)
    if (target) {
      target.roles = target.roles.filter(r => r.id !== role.id)
    }
    
    ElMessage.success(`已移除「${role.name}」角色`)
  } catch (error: any) {
    if (error !== 'cancel') {
      const errMsg = error?.data?.message || error?.message || '移除角色失败'
      ElMessage.error(errMsg)
    }
  }
}

// ============ 角色分配弹窗 ============
const roleModalVisible = ref(false)
const roleTarget = ref<MemberVO | null>(null)

function openRoleModal(member: MemberVO) {
  roleTarget.value = member
  roleModalVisible.value = true
}

async function assignRole(roleId: number) {
  if (!roleTarget.value) return
  try {
    await apis.assignRoles(serverId.value, roleTarget.value.userId, { roleIds: [roleId] }).send()
    await serverStore.getMembers(serverId.value, true)
    roleModalVisible.value = false
    ElMessage.success('角色已分配')
  } catch {
    ElMessage.error('分配失败')
  }
}
</script>

<template>
  <div class="member-page">
    <div class="page-header">
      <h2>👥 成员列表</h2>
      <span class="member-count">{{ serverStore.members.length }} 人</span>
    </div>
    <div class="search-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索成员..."
        clearable
        :prefix-icon="'🔍'"
      />
    </div>
    <div class="member-list" @scroll="onScroll">
      <div v-if="loading && !sortedMembers.length" class="loading">加载中...</div>
      <div v-for="m in sortedMembers" :key="m.userId" class="member-row">
        <div class="member-avatar-col">
          <el-badge
            :is-dot="serverStore.isOnline(m.userId)"
            :hidden="!serverStore.isOnline(m.userId)"
            type="success"
            class="online-dot"
          >
            <el-avatar :size="40" shape="rounded" :src="m.avatar">
              {{ m.nickname?.charAt(0) || 'U' }}
            </el-avatar>
          </el-badge>
        </div>
        <div class="member-info">
          <div class="member-top">
            <span class="member-name">{{ m.serverNickname || m.nickname }}</span>
            <span v-if="m.serverNickname" class="member-original">@{{ m.nickname }}</span>
            <span
              v-for="r in m.roles || []"
              :key="r.id"
              class="role-tag"
              :style="{ backgroundColor: r.color ? r.color + '30' : 'var(--el-color-primary-light-5)', color: r.color || 'var(--el-color-primary)' }"
            >
              {{ r.name }}
            </span>
            <span v-if="serverStore.currentServer?.ownerId === m.userId" class="owner-tag">👑 创建者</span>
          </div>
        </div>
        <div v-if="isOwner || (canKick && serverStore.currentServer?.ownerId !== m.userId)" class="member-actions">
          <!-- 角色管理下拉菜单 -->
          <el-dropdown v-if="canManageRoles && m.roles && m.roles.length > 0" @command="(roleId: number) => removeRole(m, roleId)">
            <el-button size="small" text>
              移除角色 <el-icon><IEpArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled style="color: var(--font-secondary); font-size: 12px;">
                  选择要移除的角色
                </el-dropdown-item>
                <el-dropdown-item
                  v-for="r in m.roles"
                  :key="r.id"
                  :command="r.id"
                  :disabled="r.name === '@everyone'"
                  :style="{ color: r.name === '@everyone' ? 'var(--font-secondary)' : '#f56c6c' }"
                >
                  <span
                    class="role-color-dot-small"
                    :style="{ backgroundColor: r.color || '#5865f2' }"
                  ></span>
                  {{ r.name }}
                  <span v-if="r.name === '@everyone'" style="font-size: 11px; color: var(--font-secondary); margin-left: 4px;">
                    (不可移除)
                  </span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-button v-if="isOwner" size="small" text @click="openRoleModal(m)">分配角色</el-button>
          <el-button
            v-if="
              (canKick || isOwner) && serverStore.currentServer?.ownerId !== m.userId
            "
            size="small"
            text
            type="danger"
            @click="kickMember(m.userId)"
          >
            踢出
          </el-button>
        </div>
      </div>
      <div v-if="!loading && !sortedMembers.length" class="empty">暂无成员</div>
    </div>

    <!-- 角色分配弹窗 -->
    <el-dialog v-model="roleModalVisible" title="分配角色" width="360px">
      <div class="role-list">
        <div
          v-for="r in serverStore.roles"
          :key="r.id"
          class="role-option"
          @click="assignRole(r.id)"
        >
          <span
            class="role-color-dot"
            :style="{ backgroundColor: r.color || '#5865f2' }"
          ></span>
          <span class="role-name">{{ r.name }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.member-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.page-header {
  display: flex;
  gap: 12px;
  align-items: baseline;
  padding: 20px 24px 12px;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }
}

.member-count {
  font-size: 14px;
  color: var(--font-secondary);
}

.search-bar {
  padding: 0 24px 12px;
}

.member-list {
  flex: 1;
  padding: 0 8px 16px;
  overflow-y: auto;
}

.member-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 16px;
  border-radius: 8px;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--bg-hover);
  }
}

.member-avatar-col {
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-top {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.member-name {
  font-size: 15px;
  font-weight: 600;
}

.member-original {
  font-size: 12px;
  color: var(--font-secondary);
}

.role-tag {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 10px;
}

.owner-tag {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #f0b132;
  background: rgba(240, 177, 50, 15%);
  border-radius: 10px;
}

.member-actions {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.member-row:hover .member-actions {
  opacity: 1;
}

.loading,
.empty {
  padding: 40px;
  font-size: 14px;
  color: var(--font-secondary);
  text-align: center;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-option {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--bg-hover);
  }
}

.role-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.role-color-dot-small {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 6px;
  border-radius: 50%;
  vertical-align: middle;
}
</style>