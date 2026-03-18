<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useAuthStore } from '@/core/stores/auth'
import api from '@/core/services/api'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ConfirmDialog from 'primevue/confirmdialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const toast = useToast()
const confirm = useConfirm()
const auth = useAuthStore()

const isAdmin = computed(() => auth.role === 'ADMIN')

const academias = ref<{ uuid: string; nome: string }[]>([])
const academiaSelecionada = ref<string>('')
const loadingAcademias = ref(false)

const nomeBusca = ref('')
const resultados = ref<UsuarioResumo[]>([])
const loadingBusca = ref(false)
const buscaRealizada = ref(false)

const resetando = ref<Record<string, boolean>>({})

interface UsuarioResumo {
  uuid: string
  login: string
  role: string
  nomeProfessor: string
  nomeAcademia: string
}

async function carregarAcademias() {
  if (!isAdmin.value) return
  loadingAcademias.value = true
  try {
    const { data } = await api.get('/api/academias')
    academias.value = data.map((a: any) => ({ uuid: a.uuid, nome: a.nome }))
  } catch {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar academias.' })
  } finally {
    loadingAcademias.value = false
  }
}

carregarAcademias()

const buscaHabilitada = computed(() =>
  isAdmin.value ? !!academiaSelecionada.value : true
)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(nomeBusca, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!val.trim() || !buscaHabilitada.value) {
    resultados.value = []
    buscaRealizada.value = false
    return
  }
  debounceTimer = setTimeout(() => buscar(), 400)
})

watch(academiaSelecionada, () => {
  resultados.value = []
  buscaRealizada.value = false
  if (nomeBusca.value.trim()) buscar()
})

async function buscar() {
  if (!nomeBusca.value.trim()) return
  loadingBusca.value = true
  buscaRealizada.value = false
  try {
    const params: Record<string, string> = { nome: nomeBusca.value.trim() }
    if (isAdmin.value && academiaSelecionada.value) {
      params.academiaId = academiaSelecionada.value
    }
    const { data } = await api.get<UsuarioResumo[]>('/api/usuarios/buscar', { params })
    resultados.value = data
    buscaRealizada.value = true
  } catch (e: any) {
    const msg = e.response?.data?.mensagem || e.response?.data?.message || 'Falha na busca.'
    toast.add({ severity: 'error', summary: 'Erro', detail: msg })
  } finally {
    loadingBusca.value = false
  }
}

function confirmarReset(usuario: UsuarioResumo) {
  confirm.require({
    message: `Resetar a senha de "${usuario.nomeProfessor}"? A nova senha será Natacao@123`,
    header: 'Confirmar Reset de Senha',
    icon: 'pi pi-key',
    acceptLabel: 'Resetar',
    rejectLabel: 'Cancelar',
    accept: () => executarReset(usuario),
  })
}

async function executarReset(usuario: UsuarioResumo) {
  resetando.value[usuario.uuid] = true
  try {
    await api.patch(`/api/usuarios/${usuario.uuid}/resetar-senha`)
    toast.add({
      severity: 'success',
      summary: 'Senha Resetada',
      detail: `Senha de "${usuario.nomeProfessor}" redefinida para: Natacao@123`,
      life: 7000,
    })
  } catch (e: any) {
    const msg = e.response?.data?.mensagem || e.response?.data?.message || 'Falha ao resetar.'
    toast.add({ severity: 'error', summary: 'Erro', detail: msg })
  } finally {
    resetando.value[usuario.uuid] = false
  }
}

const roleBadge = (role: string): { label: string; cls: string } => {
  const map: Record<string, { label: string; cls: string }> = {
    ADMIN:       { label: 'Admin',       cls: 'bg-purple-100 text-purple-700 border-purple-200' },
    DIRETOR:     { label: 'Diretor',     cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    COORDENADOR: { label: 'Coordenador', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    PROFESSOR:   { label: 'Professor',   cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  }
  return map[role] ?? { label: role, cls: 'bg-slate-100 text-slate-500' }
}

const iniciais = (nome: string) =>
  (nome ?? '?').split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 p-4">
    <ConfirmDialog />

    <div>
      <div class="flex items-center gap-2 mb-1">
        <span class="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          <i class="pi pi-key mr-1 text-[10px]"></i>Segurança
        </span>
      </div>
      <h1 class="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Reset de Senha</h1>
      <p class="text-slate-500 text-sm mt-1">
        Busque um usuário pelo nome e redefina sua senha para o padrão do sistema.
      </p>
    </div>

    <div v-if="isAdmin" class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <label class="block text-sm font-semibold text-slate-700 mb-2">
        Academia <span class="text-red-500">*</span>
        <span class="text-xs font-normal text-slate-400 ml-1">(obrigatório para ADMIN)</span>
      </label>
      <Select
        v-model="academiaSelecionada"
        :options="academias"
        optionLabel="nome"
        optionValue="uuid"
        placeholder="Selecione uma academia para habilitar a busca..."
        :loading="loadingAcademias"
        class="w-full"
        showClear
      />
      <p v-if="!academiaSelecionada" class="text-xs text-amber-500 mt-2 flex items-center gap-1">
        <i class="pi pi-exclamation-circle text-xs"></i>
        Selecione uma academia antes de buscar usuários
      </p>
    </div>

    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <label class="block text-sm font-semibold text-slate-700 mb-2">
        Buscar usuário por nome
      </label>
      <IconField iconPosition="left" class="w-full">
        <InputIcon>
          <i v-if="loadingBusca" class="pi pi-spin pi-spinner text-sky-400" />
          <i v-else class="pi pi-search text-slate-400" />
        </InputIcon>
        <InputText
          v-model="nomeBusca"
          placeholder="Digite o nome do usuário..."
          :disabled="!buscaHabilitada"
          class="w-full"
        />
      </IconField>
      <p v-if="!buscaHabilitada && isAdmin" class="text-xs text-slate-400 mt-2">
        Selecione uma academia acima para habilitar a busca.
      </p>
      <p v-else class="text-xs text-slate-400 mt-2">
        Busca automática ao digitar (mín. 1 caractere)
      </p>
    </div>

    <div v-if="loadingBusca" class="flex justify-center py-10">
      <i class="pi pi-spin pi-spinner text-3xl text-sky-400"></i>
    </div>

    <div
      v-else-if="buscaRealizada && resultados.length === 0"
      class="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center"
    >
      <i class="pi pi-search text-4xl text-slate-300 mb-3 block"></i>
      <p class="text-slate-500 font-medium">Nenhum usuário encontrado</p>
      <p class="text-slate-400 text-sm mt-1">Tente um nome diferente.</p>
    </div>

    <div v-else-if="resultados.length > 0" class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {{ resultados.length }} resultado(s)
        </p>
      </div>

      <div class="divide-y divide-slate-50">
        <div
          v-for="usuario in resultados"
          :key="usuario.uuid"
          class="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group"
        >
          <div class="flex items-center gap-4 min-w-0">
            <!-- Avatar -->
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {{ iniciais(usuario.nomeProfessor) }}
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-slate-800 text-sm">{{ usuario.nomeProfessor }}</p>
              <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                <span class="text-xs text-slate-500">
                  <i class="pi pi-envelope mr-1"></i>{{ usuario.login }}
                </span>
                <span v-if="usuario.nomeAcademia" class="text-xs text-sky-600 font-medium">
                  <i class="pi pi-building mr-1"></i>{{ usuario.nomeAcademia }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0 ml-3">
            <span
              class="text-xs font-semibold px-2 py-0.5 rounded-full border hidden sm:inline-flex"
              :class="roleBadge(usuario.role).cls"
            >
              {{ roleBadge(usuario.role).label }}
            </span>
            <Button
              icon="pi pi-key"
              label="Resetar"
              size="small"
              severity="warning"
              outlined
              :loading="resetando[usuario.uuid]"
              @click="confirmarReset(usuario)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
      <i class="pi pi-info-circle text-amber-500 mt-0.5 shrink-0"></i>
      <div class="text-xs text-amber-700 leading-relaxed">
        <strong>Senha padrão após reset:</strong> <code class="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">Natacao@123</code>
        <br class="mt-1" />
        Informe ao usuário que ele deve alterar a senha no primeiro acesso via
        <strong>Perfil → Alterar Senha</strong>.
      </div>
    </div>
  </div>
</template>