import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import apis from '@/services/apis'
import { PermissionBit } from '@/services/types'
import type {
  ServerVO,
  ServerDetailVO,
  MemberVO,
  RoleVO,
  CursorPage,
  CategoryVO,
  ChannelVO,
} from '@/services/types'

export const useServerStore = defineStore('server', () => {
  // ===== 状态 =====
  const servers = ref<ServerVO[]>([])
  const currentServer = ref<ServerVO | null>(null)
  const currentDetail = ref<ServerDetailVO | null>(null)
  const members = ref<MemberVO[]>([])
  const memberCursor = reactive({ cursor: '', isLast: false })
  const roles = ref<RoleVO[]>([])
  const onlineUsers = ref<Set<number>>(new Set())

  // ===== Server 列表 =====
  async function getMyServers() {
    const res = await apis.getMyServers().send()
    servers.value = res
  }

  async function getServerDetail(serverId: number) {
    const res = await apis.getServerDetail(serverId).send()
    currentDetail.value = res
    currentServer.value = res.server
  }

  async function createServer(data: { name: string; description?: string; icon?: string }) {
    const res = await apis.createServer(data).send()
    servers.value.push(res)
    return res
  }

  async function updateServer(
    serverId: number,
    data: { name?: string; description?: string; icon?: string },
  ) {
    const res = await apis.updateServer(serverId, data).send()
    currentServer.value = res
    return res
  }

  async function deleteServer(serverId: number) {
    await apis.deleteServer(serverId).send()
    servers.value = servers.value.filter((s) => s.id !== serverId)
    // 如果删除的是当前服务器，清除当前状态
    if (currentServer.value?.id === serverId) {
      currentServer.value = null
      currentDetail.value = null
    }
  }

  /** 重置所有服务器状态（退出登录时调用） */
  function reset() {
    servers.value = []
    currentServer.value = null
    currentDetail.value = null
    members.value = []
    memberCursor.cursor = ''
    memberCursor.isLast = false
    roles.value = []
    onlineUsers.value = new Set()
  }

  // ===== 成员 =====
  async function getMembers(serverId: number, reset = false) {
    if (reset) {
      members.value = []
      memberCursor.cursor = ''
      memberCursor.isLast = false
    }
    if (memberCursor.isLast) return
    const res: CursorPage<MemberVO> = await apis
      .getMembers(serverId, {
        cursor: memberCursor.cursor || undefined,
        pageSize: 50,
      })
      .send()
    if (reset) {
      members.value = res.list
    } else {
      members.value.push(...res.list)
    }
    memberCursor.cursor = res.cursor
    memberCursor.isLast = res.isLast
  }

  function addMember(member: MemberVO) {
    if (!members.value.find((m) => m.userId === member.userId)) {
      members.value.push(member)
    }
  }

  function removeMember(userId: number) {
    members.value = members.value.filter((m) => m.userId !== userId)
  }

  function updateMemberRole(userId: number, newRoles: RoleVO[]) {
    const m = members.value.find((m) => m.userId === userId)
    if (m) m.roles = newRoles
  }

  // ===== 角色 =====
  async function getRoles(serverId: number) {
    roles.value = await apis.getRoles(serverId).send()
  }

  // ===== 在线状态 =====
  function updateOnlineStatus(uid: number, online: boolean) {
    if (online) {
      onlineUsers.value.add(uid)
    } else {
      onlineUsers.value.delete(uid)
    }
  }

  function clearOnlineUsers() {
    onlineUsers.value = new Set()
  }

  function isOnline(uid: number): boolean {
    return onlineUsers.value.has(uid)
  }

  // ===== 权限判断 =====
  function hasPermission(bit: PermissionBit): boolean {
    const myRoles = currentDetail.value?.myRoles ?? []
    if (myRoles.length === 0) return false
    const combined = myRoles.reduce((acc, r) => acc | r.permissions, 0)
    if (combined & PermissionBit.ADMINISTRATOR) return true
    return (combined & bit) !== 0
  }

  // ===== 频道/服务器变更（WS 推送） =====
  function updateChannel(channel: ChannelVO) {
    if (!currentDetail.value) return
    for (const cat of currentDetail.value.categories) {
      const idx = cat.channels.findIndex((c) => c.id === channel.id)
      if (idx !== -1) {
        cat.channels[idx] = { ...cat.channels[idx], ...channel }
        return
      }
    }
  }

  function removeChannelFromTree(channelId: number) {
    if (!currentDetail.value) return
    for (const cat of currentDetail.value.categories) {
      cat.channels = cat.channels.filter((c) => c.id !== channelId)
    }
  }

  function addChannelToTree(categoryId: number | null, channel: ChannelVO) {
    if (!currentDetail.value) return
    const cat = currentDetail.value.categories.find((c) => c.id === categoryId)
    if (cat) {
      cat.channels.push(channel)
    }
  }

  return {
    servers,
    currentServer,
    currentDetail,
    members,
    memberCursor,
    roles,
    onlineUsers,
    getMyServers,
    getServerDetail,
    createServer,
    updateServer,
    deleteServer,
    getMembers,
    addMember,
    removeMember,
    updateMemberRole,
    getRoles,
    updateOnlineStatus,
    clearOnlineUsers,
    isOnline,
    hasPermission,
    updateChannel,
    removeChannelFromTree,
    addChannelToTree,
    reset,
  }
})
