import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import AppLayout from '@/layouts/AppLayout.vue'
import type { RoleValida } from '@/core/types/roles'

const LandingView = () => import('@/modules/public/views/LandingView.vue')
const LoginView = () => import('@/modules/auth/views/LoginView.vue')
const AssessmentsView = () =>
  import('@/modules/assessments/views/AssessmentsView.vue')
const AttendanceView = () =>
  import('@/modules/attendance/views/AttendanceView.vue')
const DashboardView = () =>
  import('@/modules/dashboard/views/DashboardView.vue')
const StudentsView = () => import('@/modules/students/views/StudentsView.vue')
const ReportsView = () => import('@/modules/reports/views/ReportsView.vue')
const ClassesView = () => import('@/modules/classes/views/ClassesView.vue')
const GuiaView = () => import('@/modules/guia/views/GuiaView.vue')

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    requiresAuth?: boolean
    allowedRoles?: Array<RoleValida>
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/welcome',
      name: 'landing',
      component: LandingView,
      meta: { public: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: DashboardView },
        {
          path: 'assessments',
          name: 'assessments',
          component: AssessmentsView,
        },
        { path: 'attendance', name: 'attendance', component: AttendanceView },
        {
          path: 'students',
          name: 'students',
          component: StudentsView,
          meta: {
            requiresAuth: true,
            allowedRoles: ['ADMIN', 'DIRETOR', 'COORDENADOR'],
          },
        },
        {
          path: 'reports',
          name: 'reports',
          component: ReportsView,
          meta: {
            requiresAuth: true,
            allowedRoles: ['DIRETOR', 'COORDENADOR', 'PROFESSOR'],
          },
        },
        { path: 'classes', name: 'classes', component: ClassesView },
        {
          path: 'perfil',
          name: 'perfil',
          component: () => import('@/modules/profile/views/ProfileView.vue'),
        },
        {
          path: 'guia',
          name: 'guia',
          component: GuiaView,
        },
        {
          path: 'admin/usuarios',
          name: 'admin-usuarios',
          component: () =>
            import('@/modules/admin/views/AdminUsuariosView.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: ['ADMIN', 'DIRETOR', 'COORDENADOR'],
          },
        },
        {
          path: 'admin/academias',
          name: 'admin-academias',
          component: () => import('@/modules/admin/views/AcademiasView.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: ['ADMIN', 'DIRETOR'],
          },
        },

        {
          path: 'admin/niveis',
          name: 'admin-niveis',
          component: () => import('@/modules/admin/views/AdminNiveisView.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: ['ADMIN', 'DIRETOR'],
          },
        },
        {
          path: 'admin/habilidades',
          name: 'admin-habilidades',
          component: () => import('@/modules/admin/views/HabilidadesView.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: ['ADMIN', 'DIRETOR'],
          },
        },
      ],
    },

    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (!auth.user) {
    auth.checkAuth()
  }

  const isAuthenticated = !!auth.user
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)
  const allowedRoles = to.meta.allowedRoles

  if (requiresAuth && !isAuthenticated) {
    return next('/welcome')
  }

  if (to.path === '/welcome' && isAuthenticated) {
    return next('/')
  }

  if (to.path === '/login' && isAuthenticated) {
    return next('/')
  }

  if (
    allowedRoles &&
    (!auth.role || !allowedRoles.includes(auth.role as any))
  ) {
    return next('/')
  }

  next()
})

export default router
