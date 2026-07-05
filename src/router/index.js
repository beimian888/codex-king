import { createRouter, createWebHistory } from 'vue-router'
import * as autoRoutes from 'vue-router/auto-routes'
import { useTokenStore } from '@/stores/tokenStore'
import { isNowInLegionWarTime } from '@/utils/clubBattleUtils'
import { isSystemAdminSession } from '@/utils/systemManagementData'

const generatedRoutes = autoRoutes.routes ?? []

const getAccountRouteProps = (route, inAppLayout = false) => ({
  token: route.query.token,
  name: route.query.name,
  server: route.query.server,
  wsUrl: route.query.wsUrl,
  api: route.query.api,
  auto: route.query.auto === 'true',
  inAppLayout
})

const my_routes = [
  {
    path: '/',
    name: 'LandingHome',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页',
      requiresToken: false
    }
  },
  {
    path: '/tokens',
    name: 'TokenImport',
    component: () => import('@/views/TokenImport/index.vue'),
    meta: {
      title: '账号管理',
      requiresToken: false
    },
    props: route => getAccountRouteProps(route)
  },
  {
    name: 'DefaultLayout',
    path: '/admin',
    component: () => import('@/layout/DefaultLayout.vue'),
    children: [
      {
        path: 'dashboard',
        redirect: '/admin/game-features'
      },
      {
        path: 'account-management',
        name: 'AccountManagement',
        component: () => import('@/views/TokenImport/index.vue'),
        meta: {
          title: '账号管理',
          requiresToken: false
        },
        props: route => ({
          ...getAccountRouteProps(route),
          inAppLayout: true
        })
      },
      {
        path: 'system-management',
        name: 'SystemManagement',
        component: () => import('@/views/SystemManagement.vue'),
        meta: {
          title: '系统管理',
          requiresToken: false
        }
      },
      {
        path: 'game-features',
        name: 'GameFeatures',
        component: () => import('@/views/GameFeatures.vue'),
        meta: {
          title: '游戏功能',
          requiresToken: true
        }
      },
      {
        path: 'web-game',
        name: 'WebGame',
        component: () => import('@/views/WebGame.vue'),
        meta: {
          title: '网页游戏',
          requiresToken: false
        }
      },
      {
        path: 'message-test',
        name: 'MessageTest',
        component: () => import('@/components/Test/MessageTester.vue'),
        meta: {
          title: '消息测试',
          requiresToken: true
        }
      },
      {
        path: 'legion-war',
        name: 'LegionWar',
        component: () => import('@/views/LegionWar.vue'),
        meta: {
          title: '实时盐场',
          requiresToken: true
        }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: {
          title: '个人设置',
          requiresToken: true
        }
      },
      {
        path: 'daily-tasks',
        name: 'DailyTasks',
        component: () => import('@/views/DailyTasks.vue'),
        meta: {
          title: '日常任务',
          requiresToken: true
        }
      },
      {
        path: 'batch-daily-tasks',
        name: 'BatchDailyTasks',
        component: () => import('@/views/BatchDailyTasks.vue'),
        meta: {
          title: '自动任务',
          requiresToken: true
        }
      },
      ...generatedRoutes,
    ]
  },
  {
    path: '/websocket-test',
    name: 'WebSocketTest',
    component: () => import('@/components/Test/WebSocketTester.vue'),
    meta: {
      title: 'WebSocket测试',
      requiresToken: true
    }
  },
  {
    path: '/login',
    redirect: '/admin/account-management'
  },
  {
    path: '/register',
    redirect: '/admin/account-management'
  },
  {
    path: '/game-roles',
    redirect: '/admin/account-management'
  },
  ...generatedRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面不存在'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: my_routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

autoRoutes.handleHotUpdate?.(router)

router.beforeEach((to, from, next) => {
  const tokenStore = useTokenStore()

  document.title = to.meta.title
    ? `${to.meta.title} - 北冕之王`
    : '北冕之王'

  if (to.name === 'LegionWar' && !isNowInLegionWarTime()) {
    next('/admin/game-features')
    return
  }

  if (to.name === 'SystemManagement' && !isSystemAdminSession()) {
    next('/')
    return
  }

  if (to.meta.requiresToken && !tokenStore.hasTokens) {
    next('/admin/account-management')
    return
  }

  next()
})

export default router
