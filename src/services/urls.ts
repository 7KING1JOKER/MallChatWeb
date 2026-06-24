// 本地配置到 .env 里面修改。生产配置在 .env.production 里面
const prefix = import.meta.env.PROD ? import.meta.env.VITE_API_PREFIX : ''
export default {
  // ============ 鉴权 ============
  authLogin: `${prefix}/api/v1/auth/login`,
  authRefresh: `${prefix}/api/v1/auth/refresh`,

  // ============ 用户 ============
  getUserMe: `${prefix}/api/v1/users/me`,
  updateUserMe: `${prefix}/api/v1/users/me`,
  bindWeChat: `${prefix}/api/v1/users/me/bind-wx`,
  getUserById: (id: number) => `${prefix}/api/v1/users/${id}`,

  // ============ Server ============
  createServer: `${prefix}/api/v1/servers`,
  getMyServers: `${prefix}/api/v1/servers`,
  discoverServers: `${prefix}/api/v1/servers/discover`,
  getServerDetail: (serverId: number) => `${prefix}/api/v1/servers/${serverId}`,
  updateServer: (serverId: number) => `${prefix}/api/v1/servers/${serverId}`,
  deleteServer: (serverId: number) => `${prefix}/api/v1/servers/${serverId}`,
  getUnread: (serverId: number) => `${prefix}/api/v1/servers/${serverId}/unread`,

  // ============ Category ============
  createCategory: (serverId: number) => `${prefix}/api/v1/servers/${serverId}/categories`,
  updateCategory: (serverId: number, categoryId: number) =>
    `${prefix}/api/v1/servers/${serverId}/categories/${categoryId}`,
  deleteCategory: (serverId: number, categoryId: number) =>
    `${prefix}/api/v1/servers/${serverId}/categories/${categoryId}`,

  // ============ Channel ============
  createChannel: (serverId: number) => `${prefix}/api/v1/servers/${serverId}/channels`,
  getChannels: (serverId: number) => `${prefix}/api/v1/servers/${serverId}/channels`,
  getChannelDetail: (serverId: number, channelId: number) =>
    `${prefix}/api/v1/servers/${serverId}/channels/${channelId}`,
  updateChannel: (serverId: number, channelId: number) =>
    `${prefix}/api/v1/servers/${serverId}/channels/${channelId}`,
  deleteChannel: (serverId: number, channelId: number) =>
    `${prefix}/api/v1/servers/${serverId}/channels/${channelId}`,

  // ============ Member ============
  getMembers: (serverId: number) => `${prefix}/api/v1/servers/${serverId}/members`,
  joinServer: (serverId: number) => `${prefix}/api/v1/servers/${serverId}/members`,
  leaveOrKick: (serverId: number, userId: number) =>
    `${prefix}/api/v1/servers/${serverId}/members/${userId}`,
  updateMemberNickname: (serverId: number) =>
    `${prefix}/api/v1/servers/${serverId}/members/me/nickname`,
  transferOwnership: (serverId: number) =>
    `${prefix}/api/v1/servers/${serverId}/members/transfer-ownership`,

  // ============ Role ============
  createRole: (serverId: number) => `${prefix}/api/v1/servers/${serverId}/roles`,
  getRoles: (serverId: number) => `${prefix}/api/v1/servers/${serverId}/roles`,
  updateRole: (serverId: number, roleId: number) =>
    `${prefix}/api/v1/servers/${serverId}/roles/${roleId}`,
  deleteRole: (serverId: number, roleId: number) =>
    `${prefix}/api/v1/servers/${serverId}/roles/${roleId}`,
  assignRoles: (serverId: number, userId: number) =>
    `${prefix}/api/v1/servers/${serverId}/members/${userId}/roles`,
  removeRole: (serverId: number, userId: number, roleId: number) =>
    `${prefix}/api/v1/servers/${serverId}/members/${userId}/roles/${roleId}`,

  // ============ ChannelPermission ============
  setChannelPermission: (channelId: number) => `${prefix}/api/v1/channels/${channelId}/permissions`,
  getChannelPermissions: (channelId: number) =>
    `${prefix}/api/v1/channels/${channelId}/permissions`,
  deleteChannelPermission: (channelId: number, permId: number) =>
    `${prefix}/api/v1/channels/${channelId}/permissions/${permId}`,

  // ============ Message ============
  sendMessage: (channelId: number) => `${prefix}/api/v1/channels/${channelId}/messages`,
  getMessages: (channelId: number) => `${prefix}/api/v1/channels/${channelId}/messages`,
  getMessage: (channelId: number, msgId: number) =>
    `${prefix}/api/v1/channels/${channelId}/messages/${msgId}`,
  editMessage: (channelId: number, msgId: number) =>
    `${prefix}/api/v1/channels/${channelId}/messages/${msgId}`,
  deleteMessage: (channelId: number, msgId: number) =>
    `${prefix}/api/v1/channels/${channelId}/messages/${msgId}`,

  // ============ Thread ============
  createThread: (channelId: number) => `${prefix}/api/v1/channels/${channelId}/threads`,
  getThreads: (channelId: number) => `${prefix}/api/v1/channels/${channelId}/threads`,
  getThread: (threadId: number) => `${prefix}/api/v1/threads/${threadId}`,
  getThreadMessages: (threadId: number) => `${prefix}/api/v1/threads/${threadId}/messages`,
  updateThread: (threadId: number) => `${prefix}/api/v1/threads/${threadId}`,

  // ============ Reaction ============
  addReaction: (msgId: number) => `${prefix}/api/v1/messages/${msgId}/reactions`,
  removeReaction: (msgId: number) => `${prefix}/api/v1/messages/${msgId}/reactions`,
  getReactions: (msgId: number) => `${prefix}/api/v1/messages/${msgId}/reactions`,

  // ============ File ============
  getPresignedUrl: `${prefix}/api/v1/upload/presigned`,
  confirmUpload: `${prefix}/api/v1/upload/confirm`,
  getFile: (fileId: number) => `${prefix}/api/v1/files/${fileId}`,
  getDownloadUrl: (fileId: number) => `${prefix}/api/v1/files/${fileId}/download`,

  // ============ 其他 ============
  // Emoji
  uploadEmoji: (serverId: number) => `${prefix}/api/v1/servers/${serverId}/emojis`,
  getEmojis: (serverId: number) => `${prefix}/api/v1/servers/${serverId}/emojis`,
  deleteEmoji: (serverId: number, emojiId: number) =>
    `${prefix}/api/v1/servers/${serverId}/emojis/${emojiId}`,

  // Invite
  createInvite: (serverId: number) => `${prefix}/api/v1/servers/${serverId}/invites`,
  joinByInvite: (serverId: number) => `${prefix}/api/v1/servers/${serverId}/invites/join`,

  // Search
  searchMessages: (serverId: number) => `${prefix}/api/v1/servers/${serverId}/search`,
}
