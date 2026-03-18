<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const isDiretorOuAcima = computed(() =>
  ['ADMIN', 'DIRETOR', 'COORDENADOR'].includes(auth.role ?? '')
)

const isAdminOuDiretor = computed(() =>
  ['ADMIN', 'DIRETOR'].includes(auth.role ?? '')
)

const menuItems = computed(() => {
  const items = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/' },
    { label: 'Turmas', icon: 'pi pi-calendar', route: '/classes' },
    { label: 'Avaliações', icon: 'pi pi-check-square', route: '/assessments' },
  ]

  if (['DIRETOR', 'COORDENADOR', 'PROFESSOR'].includes(auth.role ?? '')) {
    items.push({
      label: 'Relatórios',
      icon: 'pi pi-chart-bar',
      route: '/reports',
    })
  }

  return items
})

const iniciais = computed((): string => {
  const raw: string = auth.user ?? ''
  const atIndex: number = raw.indexOf('@')
  const local: string = atIndex >= 0 ? raw.substring(0, atIndex) : raw
  const partes: string[] = local
    .split(/[.\-_]/)
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
  return (
    partes
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('') || '?'
  )
})

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    ADMIN: 'Administrador',
    DIRETOR: 'Diretor',
    COORDENADOR: 'Coordenador',
    PROFESSOR: 'Professor',
  }
  return map[auth.role ?? ''] ?? auth.role ?? ''
})

const roleBadgeCls = computed(() => {
  const map: Record<string, string> = {
    ADMIN: 'bg-purple-50 text-purple-700 border-purple-200/60',
    DIRETOR: 'bg-blue-50 text-blue-700 border-blue-200/60',
    COORDENADOR: 'bg-amber-50 text-amber-700 border-amber-200/60',
    PROFESSOR: 'bg-sky-50 text-sky-700 border-sky-200/60',
  }
  return map[auth.role ?? ''] ?? 'bg-slate-50 text-slate-600 border-slate-200'
})

function navigate(path: string) {
  router.push(path)
}

function logout() {
  auth.signOut()
  router.push('/login')
}

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav
    class="h-full w-full bg-white/95 backdrop-blur-xl flex flex-col border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 font-sans"
  >
    <div
      class="h-24 flex items-center gap-4 px-6 shrink-0 border-b border-slate-100/60 relative overflow-hidden"
    >
      <div
        class="absolute -top-12 -left-12 w-32 h-32 bg-sky-100/50 rounded-full blur-2xl pointer-events-none"
      ></div>

      <div
        class="relative w-11 h-11 rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-50 flex items-center justify-center p-1 z-10 shrink-0 group"
      >
        <img
          src="/images/acquOnwhite.jpeg"
          alt="AcquOn Logo"
          class="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div class="flex flex-col justify-center leading-tight z-10 min-w-0">
        <span class="font-extrabold text-2xl tracking-tight text-slate-800"
          >AcquOn</span
        >
        <span
          class="text-[9px] uppercase font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600 tracking-widest mt-0.5"
          >Gestão Inteligente</span
        >
      </div>
    </div>

    <button
      @click="navigate('/perfil')"
      class="mx-4 mt-6 mb-2 flex items-center gap-3 p-3 rounded-[1.25rem] border transition-all duration-300 text-left group shrink-0 cursor-pointer"
      :class="
        isActive('/perfil')
          ? 'bg-sky-50/50 border-sky-200 shadow-[0_4px_12px_rgba(14,165,233,0.05)]'
          : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200/60'
      "
    >
      <div
        class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-200/50 shrink-0 transition-transform duration-300 group-hover:scale-105"
      >
        {{ iniciais }}
      </div>
      <div class="min-w-0 flex-1 overflow-hidden">
        <p class="text-[13px] text-slate-700 truncate font-bold">
          {{ auth.user }}
        </p>
        <span
          class="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 border"
          :class="roleBadgeCls"
        >
          {{ roleLabel }}
        </span>
      </div>
    </button>

    <div
      class="flex-1 overflow-y-auto py-2 flex flex-col gap-1 custom-scrollbar"
    >
      <p
        class="text-[10px] font-black text-slate-300 uppercase tracking-widest px-6 mb-2 mt-2"
      >
        Menu Principal
      </p>

      <a
        v-for="item in menuItems"
        :key="item.route"
        @click="navigate(item.route)"
        class="flex items-center gap-3.5 px-4 py-3.5 mx-4 rounded-2xl cursor-pointer transition-all duration-300 font-semibold group relative overflow-hidden"
        :class="
          isActive(item.route)
            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(14,165,233,0.4)]'
            : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-700'
        "
      >
        <i
          :class="[
            item.icon,
            'text-[1.1rem] transition-transform group-hover:scale-110 duration-300',
            isActive(item.route)
              ? 'text-white drop-shadow-md'
              : 'text-slate-400 group-hover:text-sky-500',
          ]"
        />
        <span class="text-[13px] tracking-wide">{{ item.label }}</span>
      </a>

      <template v-if="isDiretorOuAcima">
        <p
          class="text-[10px] font-black text-slate-300 uppercase tracking-widest px-6 mt-6 mb-2"
        >
          Administração
        </p>

        <a
          @click="navigate('/admin/usuarios')"
          class="flex items-center gap-3.5 px-4 py-3.5 mx-4 rounded-2xl cursor-pointer transition-all duration-300 font-semibold group relative overflow-hidden"
          :class="
            isActive('/admin/usuarios')
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(14,165,233,0.4)]'
              : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-700'
          "
        >
          <i
            :class="[
              'pi pi-users text-[1.1rem] transition-transform group-hover:scale-110 duration-300',
              isActive('/admin/usuarios')
                ? 'text-white drop-shadow-md'
                : 'text-slate-400 group-hover:text-sky-500',
            ]"
          />
          <span class="text-[13px] tracking-wide">Usuários</span>
        </a>

        <a
          @click="navigate('/students')"
          class="flex items-center gap-3.5 px-4 py-3.5 mx-4 rounded-2xl cursor-pointer transition-all duration-300 font-semibold group relative overflow-hidden"
          :class="
            isActive('/students')
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(14,165,233,0.4)]'
              : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-700'
          "
        >
          <i
            :class="[
              'pi pi-user-plus text-[1.1rem] transition-transform group-hover:scale-110 duration-300',
              isActive('/students')
                ? 'text-white drop-shadow-md'
                : 'text-slate-400 group-hover:text-sky-500',
            ]"
          />
          <span class="text-[13px] tracking-wide">Alunos</span>
        </a>

        <template v-if="isAdminOuDiretor">
          <a
            @click="navigate('/admin/academias')"
            class="flex items-center gap-3.5 px-4 py-3.5 mx-4 rounded-2xl cursor-pointer transition-all duration-300 font-semibold group relative overflow-hidden"
            :class="
              isActive('/admin/academias')
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(14,165,233,0.4)]'
                : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-700'
            "
          >
            <i
              :class="[
                'pi pi-building text-[1.1rem] transition-transform group-hover:scale-110 duration-300',
                isActive('/admin/academias')
                  ? 'text-white drop-shadow-md'
                  : 'text-slate-400 group-hover:text-sky-500',
              ]"
            />
            <span class="text-[13px] tracking-wide">Academias</span>
          </a>

          <a
            @click="navigate('/admin/niveis')"
            class="flex items-center gap-3.5 px-4 py-3.5 mx-4 rounded-2xl cursor-pointer transition-all duration-300 font-semibold group relative overflow-hidden"
            :class="
              isActive('/admin/niveis')
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(14,165,233,0.4)]'
                : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-700'
            "
          >
            <i
              :class="[
                'pi pi-star text-[1.1rem] transition-transform group-hover:scale-110 duration-300',
                isActive('/admin/niveis')
                  ? 'text-white drop-shadow-md'
                  : 'text-slate-400 group-hover:text-sky-500',
              ]"
            />
            <span class="text-[13px] tracking-wide">Níveis</span>
          </a>

          <a
            @click="navigate('/admin/habilidades')"
            class="flex items-center gap-3.5 px-4 py-3.5 mx-4 rounded-2xl cursor-pointer transition-all duration-300 font-semibold group relative overflow-hidden"
            :class="
              isActive('/admin/habilidades')
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(14,165,233,0.4)]'
                : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-700'
            "
          >
            <i
              :class="[
                'pi pi-list text-[1.1rem] transition-transform group-hover:scale-110 duration-300',
                isActive('/admin/habilidades')
                  ? 'text-white drop-shadow-md'
                  : 'text-slate-400 group-hover:text-sky-500',
              ]"
            />
            <span class="text-[13px] tracking-wide">Habilidades</span>
          </a>

          <a
            @click="navigate('/admin/reset-senha')"
            class="flex items-center gap-3.5 px-4 py-3.5 mx-4 rounded-2xl cursor-pointer transition-all duration-300 font-semibold group relative overflow-hidden"
            :class="
              isActive('/admin/reset-senha')
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(14,165,233,0.4)]'
                : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-700'
            "
          >
            <i
              :class="[
                'pi pi-key text-[1.1rem] transition-transform group-hover:scale-110 duration-300',
                isActive('/admin/reset-senha')
                  ? 'text-white drop-shadow-md'
                  : 'text-slate-400 group-hover:text-sky-500',
              ]"
            />
            <span class="text-[13px] tracking-wide">Reset de Senha</span>
          </a>

          <a
            @click="navigate('/admin/integracao')"
            class="flex items-center gap-3.5 px-4 py-3.5 mx-4 rounded-2xl cursor-pointer transition-all duration-300 font-semibold group relative overflow-hidden"
            :class="
              isActive('/admin/integracao')
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(14,165,233,0.4)]'
                : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-700'
            "
          >
            <i
              :class="[
                'pi pi-sync text-[1.1rem] transition-transform group-hover:scale-110 duration-300',
                isActive('/admin/integracao')
                  ? 'text-white drop-shadow-md'
                  : 'text-slate-400 group-hover:text-sky-500',
              ]"
            />
            <span class="text-[13px] tracking-wide">Importar EVO</span>
            <span
              class="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full border transition-colors"
              :class="
                isActive('/admin/integracao')
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              "
            >
              EVO
            </span>
          </a>
        </template>
      </template>
    </div>

    <div
      class="p-4 border-t border-slate-100/60 shrink-0 space-y-1 bg-slate-50/30"
    >
      <a
        @click="navigate('/guia')"
        class="flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-300 font-semibold group"
        :class="
          isActive('/guia')
            ? 'bg-sky-100/50 text-sky-700'
            : 'text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-800'
        "
      >
        <i
          :class="[
            'pi pi-book text-[1.1rem] transition-colors',
            isActive('/guia')
              ? 'text-sky-600'
              : 'text-slate-400 group-hover:text-sky-500',
          ]"
        />
        <span class="text-[13px] tracking-wide">Guia de Uso</span>
      </a>

      <button
        @click="logout"
        class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group cursor-pointer font-semibold"
      >
        <i
          class="pi pi-sign-out text-[1.1rem] text-slate-400 group-hover:text-red-500 transition-colors"
        />
        <span class="text-[13px] tracking-wide">Sair do Sistema</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 4px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #cbd5e1;
}
</style>
