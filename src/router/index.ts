import { createRouter, createWebHistory } from 'vue-router'
import createGuard from './guard'

const HomeView = () => import(/* webpackChunkName: "Home" */ '@/views/Home/index.vue')
const HomeChatView = () => import(/* webpackChunkName: "Home" */ '@/views/Home/Chat/index.vue')
const DiscoverView = () => import(/* webpackChunkName: "Home" */ '@/views/Home/Discover/index.vue')
const SearchView = () => import(/* webpackChunkName: "Home" */ '@/views/Home/Search/index.vue')
const MemberListView = () =>
  import(/* webpackChunkName: "Home" */ '@/views/Home/Server/MemberList/index.vue')
const SettingsView = () =>
  import(/* webpackChunkName: "Home" */ '@/views/Home/Server/Settings/index.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      children: [
        {
          path: '',
          name: 'chat',
          component: HomeChatView,
        },
        {
          path: 'discover',
          name: 'discover',
          component: DiscoverView,
        },
        {
          path: 'servers/:serverId/channels/:channelId',
          name: 'channel',
          component: HomeChatView,
        },
        {
          path: 'servers/:serverId/members',
          name: 'members',
          component: MemberListView,
        },
        {
          path: 'servers/:serverId/settings',
          name: 'settings',
          component: SettingsView,
        },
        {
          path: 'servers/:serverId/search',
          name: 'search',
          component: SearchView,
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

createGuard(router)

export default router
