import { createRouter, createWebHistory } from 'vue-router'
import createGuard from './guard'

const HomeView = () => import(/* webpackChunkName: "Home" */ '@/views/Home/index.vue')
const HomeChatView = () => import(/* webpackChunkName: "Home" */ '@/views/Home/Chat/index.vue')

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
          path: 'servers/:serverId/channels/:channelId',
          name: 'channel',
          component: HomeChatView,
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
