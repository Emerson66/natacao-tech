import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/core/services/api'
import { ROLES_VALIDAS, type RoleValida } from '@/core/types/roles'

function sanitizarRole(role: string | null): RoleValida | null {
  if (!role) return null
  return (ROLES_VALIDAS as readonly string[]).includes(role)
    ? (role as RoleValida)
    : null
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) return false
    const payload = JSON.parse(atob(parts[1]))
    return payload.exp * 1000 > Date.now()
  } catch (e) {
    return false
  }
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const user = ref<string | null>(localStorage.getItem('user'))
  const role = ref<RoleValida | null>(
    sanitizarRole(localStorage.getItem('role'))
  )
  const token = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)

  const isAuthenticated = computed(
    () => !!user.value && !!role.value && isTokenValid(token.value)
  )
  const userRole = computed(() => role.value)
  const isAdmin = computed(() => role.value === 'ADMIN')
  const isDiretor = computed(
    () => role.value === 'ADMIN' || role.value === 'DIRETOR'
  )
  const isCoordenador = computed(
    () =>
      role.value === 'ADMIN' ||
      role.value === 'DIRETOR' ||
      role.value === 'COORDENADOR'
  )

  function checkAuth() {
    const storedToken = localStorage.getItem('token')
    if (!storedToken || !isTokenValid(storedToken)) {
      _limparSessao()
      return
    }
    token.value = storedToken
    api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
  }

  async function signIn(email: string, pass: string) {
    loading.value = true
    try {
      const response = await api.post('/auth/login', {
        login: email,
        password: pass,
      })

      const userLogin = response.data.login
      const userRoleData = response.data.role
      const accessToken = response.data.token
      const refreshToken = response.data.refreshToken
      const roleValidado = sanitizarRole(userRoleData)

      if (!roleValidado || !accessToken) {
        return {
          success: false,
          error: 'Acesso negado: Perfil ou token inválido.',
        }
      }

      localStorage.setItem('user', userLogin)
      localStorage.setItem('role', roleValidado)
      localStorage.setItem('token', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      user.value = userLogin
      role.value = roleValidado
      token.value = accessToken

      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

      return { success: true }
    } catch (error: any) {
      const status = error.response?.status
      let msg = 'Erro ao conectar. Tente novamente.'
      if (status === 401 || status === 403) msg = 'Credenciais incorretas.'
      else if (status === 429) msg = 'Muitas tentativas. Aguarde.'
      return { success: false, error: msg }
    } finally {
      loading.value = false
    }
  }

  function _limparSessao() {
    localStorage.removeItem('user')
    localStorage.removeItem('role')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    user.value = null
    role.value = null
    token.value = null
    delete api.defaults.headers.common['Authorization']
  }

  async function signOut() {
    try {
      const rToken = localStorage.getItem('refreshToken')
      await api.post('/auth/logout', { refreshToken: rToken })
    } catch (error) {
      console.error('Erro no logout', error)
    } finally {
      _limparSessao()
      router.push('/login')
    }
  }

  async function alterarSenha(payload: any) {
    try {
      await api.put('/api/usuarios/alterar-senha', payload)
    } catch (error) {
      throw error
    }
  }
  async function promoverDiretor(uuid: string, academiaId: string) {
    await api.patch(`/api/usuarios/${uuid}/promover-diretor`, null, {
      params: { academiaId },
    })
  }
  async function rebaixarUsuario(uuid: string) {
    try {
      await api.patch(`/api/usuarios/${uuid}/rebaixar-usuario`)
    } catch (error) {
      throw error
    }
  }

  return {
    user,
    role,
    token,
    loading,
    isAuthenticated,
    userRole,
    isAdmin,
    isDiretor,
    isCoordenador,
    checkAuth,
    signIn,
    signOut,
    alterarSenha,
    promoverDiretor,
    rebaixarUsuario,
  }
})
