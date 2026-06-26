import type {
  AccountBindReq,
  CursorPage,
  CategoryVO,
  ChannelPermissionVO,
  ChannelVO,
  CreateChannelReq,
  CreateRoleReq,
  CreateThreadReq,
  EmojiVO,
  FileVO,
  InviteVO,
  LoginReq,
  MemberVO,
  MessageVO,
  PresignedResp,
  ReactionVO,
  RefreshTokenReq,
  RoleVO,
  SearchParams,
  SendMsgReq,
  ServerDetailVO,
  ServerVO,
  SetPermReq,
  ThreadVO,
  TransferOwnershipReq,
  UnreadVO,
  UpdateChannelReq,
  UpdateMemberNicknameReq,
  UpdateRoleReq,
  UpdateThreadReq,
  UserVO,
} from '@/services/types'
import { alovaIns } from './request'
import urls from './urls'

const getRequest = <T>(url: string, config?: any) =>
  alovaIns.Get<T>(url, { ...config, localCache: 0 })
const postRequest = <T>(url: string, params?: any) => alovaIns.Post<T, unknown>(url, params)
const putRequest = <T>(url: string, params?: any) => alovaIns.Put<T, unknown>(url, params)
const deleteRequest = <T>(url: string, params?: any) => alovaIns.Delete<T, unknown>(url, params)

export default {
  // ============ 鉴权 ============
  /** 登录 */
  login: (data: LoginReq) => postRequest<UserVO>(urls.authLogin, data),
  /** 刷新 Token（后端返回 ApiResult&lt;String&gt;，即 data 为原始 token 字符串） */
  refreshToken: (data: RefreshTokenReq) => postRequest<string>(urls.authRefresh, data),

  // ============ 用户 ============
  /** 获取当前用户信息 */
  getUserMe: () => getRequest<UserVO>(urls.getUserMe),
  /** 修改当前用户信息（昵称/头像/邮箱） */
  updateUserMe: (data: { nickname?: string; avatar?: string; email?: string }) =>
    putRequest<UserVO>(urls.updateUserMe, data),
  /** 绑定微信 */
  bindWeChat: (data: AccountBindReq) => postRequest<UserVO>(urls.bindWeChat, data),
  /** 获取指定用户信息 */
  getUserById: (id: number) => getRequest<UserVO>(urls.getUserById(id)),

  // ============ Server ============
  /** 创建服务器 */
  createServer: (data: { name: string; description?: string; icon?: string }) =>
    postRequest<ServerVO>(urls.createServer, data),
  /** 我的服务器列表 */
  getMyServers: () => getRequest<ServerVO[]>(urls.getMyServers),
  /** 发现公开服务器（游标分页） */
  discoverServers: (params?: { cursor?: string; pageSize?: number }) =>
    getRequest<CursorPage<ServerVO>>(urls.discoverServers, { params }),
  /** 服务器详情（含 categories + channels 嵌套 + myRoles） */
  getServerDetail: (serverId: number) => getRequest<ServerDetailVO>(urls.getServerDetail(serverId)),
  /** 编辑服务器 */
  updateServer: (serverId: number, data: { name?: string; description?: string; icon?: string }) =>
    putRequest<ServerVO>(urls.updateServer(serverId), data),
  /** 删除服务器 */
  deleteServer: (serverId: number) => deleteRequest<void>(urls.deleteServer(serverId)),
  /** 获取各频道未读计数 */
  getUnread: (serverId: number) => getRequest<Record<number, number>>(urls.getUnread(serverId)),

  // ============ Category ============
  /** 创建分类 */
  createCategory: (serverId: number, data: { name: string; sortOrder?: number }) =>
    postRequest<CategoryVO>(urls.createCategory(serverId), data),
  /** 编辑分类 */
  updateCategory: (serverId: number, categoryId: number, data: { name?: string }) =>
    putRequest<CategoryVO>(urls.updateCategory(serverId, categoryId), data),
  /** 删除分类 */
  deleteCategory: (serverId: number, categoryId: number) =>
    deleteRequest<void>(urls.deleteCategory(serverId, categoryId)),

  // ============ Channel ============
  /** 创建频道 */
  createChannel: (serverId: number, data: CreateChannelReq) =>
    postRequest<ChannelVO>(urls.createChannel(serverId), data),
  /** 频道列表（嵌套结构，按分类分组） */
  getChannels: (serverId: number) => getRequest<CategoryVO[]>(urls.getChannels(serverId)),
  /** 频道详情 */
  getChannelDetail: (serverId: number, channelId: number) =>
    getRequest<ChannelVO>(urls.getChannelDetail(serverId, channelId)),
  /** 编辑频道 */
  updateChannel: (serverId: number, channelId: number, data: UpdateChannelReq) =>
    putRequest<ChannelVO>(urls.updateChannel(serverId, channelId), data),
  /** 删除频道 */
  deleteChannel: (serverId: number, channelId: number) =>
    deleteRequest<void>(urls.deleteChannel(serverId, channelId)),

  // ============ Member ============
  /** 获取成员列表（游标分页） */
  getMembers: (serverId: number, params?: { cursor?: string; pageSize?: number }) =>
    getRequest<CursorPage<MemberVO>>(urls.getMembers(serverId), { params }),
  /** 加入服务器 */
  joinServer: (serverId: number) => postRequest<MemberVO>(urls.joinServer(serverId)),
  /** 离开或踢出成员 */
  leaveOrKick: (serverId: number, userId: number) =>
    deleteRequest<void>(urls.leaveOrKick(serverId, userId)),
  /** 修改服务器内昵称 */
  updateMemberNickname: (serverId: number, data: UpdateMemberNicknameReq) =>
    putRequest<MemberVO>(urls.updateMemberNickname(serverId), data),
  /** 转让服务器 ownership */
  transferOwnership: (serverId: number, data: TransferOwnershipReq) =>
    putRequest<void>(urls.transferOwnership(serverId), data),

  // ============ Role ============
  /** 创建角色 */
  createRole: (serverId: number, data: CreateRoleReq) =>
    postRequest<RoleVO>(urls.createRole(serverId), data),
  /** 获取角色列表 */
  getRoles: (serverId: number) => getRequest<RoleVO[]>(urls.getRoles(serverId)),
  /** 编辑角色 */
  updateRole: (serverId: number, roleId: number, data: UpdateRoleReq) =>
    putRequest<RoleVO>(urls.updateRole(serverId, roleId), data),
  /** 删除角色 */
  deleteRole: (serverId: number, roleId: number) =>
    deleteRequest<void>(urls.deleteRole(serverId, roleId)),
  /** 为用户分配角色 */
  assignRoles: (serverId: number, userId: number, data: { roleIds: number[] }) =>
    postRequest<RoleVO[]>(urls.assignRoles(serverId, userId), data),
  /** 移除用户角色 */
  removeRole: (serverId: number, userId: number, roleId: number) =>
    deleteRequest<void>(urls.removeRole(serverId, userId, roleId)),

  // ============ ChannelPermission ============
  /** 设置频道权限覆盖 */
  setChannelPermission: (channelId: number, data: SetPermReq) =>
    putRequest<ChannelPermissionVO>(urls.setChannelPermission(channelId), data),
  /** 获取频道权限覆盖列表 */
  getChannelPermissions: (channelId: number) =>
    getRequest<ChannelPermissionVO[]>(urls.getChannelPermissions(channelId)),
  /** 删除频道权限覆盖 */
  deleteChannelPermission: (channelId: number, permId: number) =>
    deleteRequest<void>(urls.deleteChannelPermission(channelId, permId)),

  // ============ Message ============
  /** 发送消息 */
  sendMessage: (channelId: number, data: SendMsgReq) =>
    postRequest<MessageVO>(urls.sendMessage(channelId), data),
  /** 获取消息列表（游标分页） */
  getMessages: (
    channelId: number,
    params?: { cursor?: string; pageSize?: number; threadId?: number },
  ) => getRequest<CursorPage<MessageVO>>(urls.getMessages(channelId), { params }),
  /** 获取单条消息 */
  getMessage: (channelId: number, msgId: number) =>
    getRequest<MessageVO>(urls.getMessage(channelId, msgId)),
  /** 编辑消息 */
  editMessage: (channelId: number, msgId: number, data: { content: string }) =>
    putRequest<MessageVO>(urls.editMessage(channelId, msgId), data),
  /** 删除消息 */
  deleteMessage: (channelId: number, msgId: number) =>
    deleteRequest<void>(urls.deleteMessage(channelId, msgId)),

  // ============ Thread ============
  /** 创建话题 */
  createThread: (channelId: number, data: CreateThreadReq) =>
    postRequest<ThreadVO>(urls.createThread(channelId), data),
  /** 获取话题列表 */
  getThreads: (channelId: number, params?: { cursor?: string; pageSize?: number }) =>
    getRequest<CursorPage<ThreadVO>>(urls.getThreads(channelId), { params }),
  /** 获取话题详情 */
  getThread: (threadId: number) => getRequest<ThreadVO>(urls.getThread(threadId)),
  /** 获取话题内消息 */
  getThreadMessages: (threadId: number, params?: { cursor?: string; pageSize?: number }) =>
    getRequest<CursorPage<MessageVO>>(urls.getThreadMessages(threadId), { params }),
  /** 编辑话题 */
  updateThread: (threadId: number, data: UpdateThreadReq) =>
    putRequest<ThreadVO>(urls.updateThread(threadId), data),

  // ============ Reaction ============
  /** 添加 Reaction */
  addReaction: (msgId: number, emoji: string) =>
    postRequest<ReactionVO[]>(urls.addReaction(msgId) + `?emoji=${encodeURIComponent(emoji)}`),
  /** 移除 Reaction */
  removeReaction: (msgId: number, emoji: string) =>
    deleteRequest<void>(urls.removeReaction(msgId) + `?emoji=${encodeURIComponent(emoji)}`),
  /** 获取消息的 Reaction 列表 */
  getReactions: (msgId: number) => getRequest<ReactionVO[]>(urls.getReactions(msgId)),

  // ============ File ============
  /** 获取预签名上传 URL */
  getPresignedUrl: (data: { fileName: string; fileSize: number; mimeType: string }) =>
    postRequest<PresignedResp>(urls.getPresignedUrl, data),
  /** 确认上传完成 */
  confirmUpload: (data: { fileId: number }) => postRequest<FileVO>(urls.confirmUpload, data),
  /** 获取文件元数据 */
  getFile: (fileId: number) => getRequest<FileVO>(urls.getFile(fileId)),
  /** 获取文件下载 URL */
  getDownloadUrl: (fileId: number) =>
    getRequest<{ downloadUrl: string }>(urls.getDownloadUrl(fileId)),

  // ============ Emoji ============
  /** 上传自定义表情 */
  uploadEmoji: (serverId: number, data: FormData) =>
    postRequest<EmojiVO>(urls.uploadEmoji(serverId), data),
  /** 获取表情列表 */
  getEmojis: (serverId: number) => getRequest<EmojiVO[]>(urls.getEmojis(serverId)),
  /** 删除表情 */
  deleteEmoji: (serverId: number, emojiId: number) =>
    deleteRequest<void>(urls.deleteEmoji(serverId, emojiId)),

  // ============ Invite ============
  /** 创建邀请链接 */
  createInvite: (serverId: number, data?: { maxUses?: number; expireHours?: number }) =>
    postRequest<InviteVO>(urls.createInvite(serverId), data),
  /** 通过邀请码加入服务器 */
  joinByInvite: (serverId: number, data: { code: string }) =>
    postRequest<ServerVO>(urls.joinByInvite(serverId), data),

  // ============ Search ============
  /** 消息搜索 */
  searchMessages: (serverId: number, params: SearchParams) =>
    getRequest<CursorPage<MessageVO>>(urls.searchMessages(serverId), { params }),
}
