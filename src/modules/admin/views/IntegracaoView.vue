<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/core/stores/auth'
import api from '@/core/services/api'
import type { AcademiaDTO } from '@/core/types/api'

import Button from 'primevue/button'
import Select from 'primevue/select'

const toast = useToast()
const authStore = useAuthStore()

const importando = ref(false)
const carregandoAcademias = ref(false)
const resultadoImportacao = ref<string | null>(null)
const erroImportacao = ref<string | null>(null)
const ultimaImportacao = ref<Date | null>(null)

interface AcademiaOpcao {
  id: number
  uuid: string
  nome: string
}
const academias = ref<AcademiaOpcao[]>([])
const academiaSelecionada = ref<AcademiaOpcao | null>(null)

const podeImportar = computed(
  () => academiaSelecionada.value !== null && !importando.value
)

async function carregarAcademias() {
  carregandoAcademias.value = true
  try {
    const { data } = await api.get<AcademiaDTO[]>('/api/academias')
    academias.value = (data as any[]).map((a: any) => ({
      id: a.id,
      uuid: a.uuid,
      nome: a.nome,
    }))
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Não foi possível carregar as academias.',
      life: 5000,
    })
  } finally {
    carregandoAcademias.value = false
  }
}

onMounted(carregarAcademias)

function parseResultado(
  msg: string
): { novos: number; atualizados: number; requisicoes: number } | null {
  const match = msg.match(
    /(\d+) novos inseridos, (\d+) atualizados.*?(\d+) requisi/i
  )
  if (!match) return null
  return {
    novos: parseInt(match[1] ?? '0'),
    atualizados: parseInt(match[2] ?? '0'),
    requisicoes: parseInt(match[3] ?? '0'),
  }
}

async function importarAlunos() {
  if (!authStore.isAuthenticated || !academiaSelecionada.value) return

  const academiaUuid = academiaSelecionada.value.uuid
  if (!academiaUuid) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Academia sem UUID. Recarregue a página.',
      life: 6000,
    })
    return
  }

  importando.value = true
  resultadoImportacao.value = null
  erroImportacao.value = null

  try {
    const { data } = await api.post<string>(
      `/api/integracoes/evo/importar-alunos/${academiaUuid}`
    )

    if (typeof data === 'string' && data.toLowerCase().startsWith('erro')) {
      erroImportacao.value = data
      toast.add({
        severity: 'error',
        summary: 'Erro na importação',
        detail: data,
        life: 8000,
      })
    } else {
      resultadoImportacao.value = data
      ultimaImportacao.value = new Date()
      toast.add({
        severity: 'success',
        summary: 'Importação concluída!',
        detail: data,
        life: 6000,
      })
    }
  } catch (e: any) {
    const rawData = e.response?.data
    const rawMsg =
      (typeof rawData === 'string' ? rawData : null) ||
      rawData?.mensagem ||
      rawData?.message ||
      null

    if (e.response?.status === 400 && rawMsg) {
      erroImportacao.value = rawMsg
    } else {
      erroImportacao.value =
        rawMsg ||
        'Falha ao conectar com o sistema EVO. Verifique as configurações do servidor.'
    }

    toast.add({
      severity: 'error',
      summary: 'Erro na importação',
      detail: erroImportacao.value,
      life: 8000,
    })
  } finally {
    importando.value = false
  }
}

function formatarDataHora(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const stats = () =>
  resultadoImportacao.value ? parseResultado(resultadoImportacao.value) : null
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 p-4">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <span
          class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
        >
          Integração
        </span>
        <span
          class="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
        >
          EVO
        </span>
      </div>
      <h1 class="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
        Importação de Alunos
      </h1>
      <p class="text-slate-500 text-sm mt-1">
        Sincronize automaticamente os alunos ativos de natação do sistema EVO.
      </p>
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div class="flex items-center gap-4 mb-5">
        <div
          class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-100 shrink-0"
        >
          <i class="pi pi-cloud-download text-white text-xl"></i>
        </div>
        <div>
          <h2 class="font-bold text-slate-800 text-lg">Como funciona</h2>
          <p class="text-slate-400 text-sm">Processo automático em 2 etapas</p>
        </div>
      </div>

      <ol class="space-y-4">
        <li class="flex gap-4 items-start">
          <div
            class="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
          >
            1
          </div>
          <div>
            <p class="font-semibold text-slate-700 text-sm">
              Baixa planilha de ativos
            </p>
            <p class="text-xs text-slate-500 mt-0.5">
              Busca todos os membros com status ativo na EVO e filtra os planos
              que contêm <strong>"nata"</strong> ou <strong>"water"</strong>.
            </p>
          </div>
        </li>
        <li class="flex gap-4 items-start">
          <div
            class="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
          >
            2
          </div>
          <div>
            <p class="font-semibold text-slate-700 text-sm">
              Sincroniza dados detalhados
            </p>
            <p class="text-xs text-slate-500 mt-0.5">
              Para cada aluno encontrado, busca nome completo, data de
              nascimento, telefone e responsável financeiro. Alunos existentes
              são atualizados; novos são inseridos.
            </p>
          </div>
        </li>
      </ol>

      <div
        class="mt-5 pt-5 border-t border-slate-100 flex flex-wrap gap-3 text-xs text-slate-500"
      >
        <span class="flex items-center gap-1.5">
          <i class="pi pi-check-circle text-emerald-500"></i>
          Não duplica registros existentes
        </span>
        <span class="flex items-center gap-1.5">
          <i class="pi pi-check-circle text-emerald-500"></i>
          Atualiza dados desatualizados
        </span>
        <span class="flex items-center gap-1.5">
          <i class="pi pi-check-circle text-emerald-500"></i>
          Preserva níveis e turmas
        </span>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div class="flex items-center gap-3 mb-4">
        <div
          class="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0"
        >
          <i class="pi pi-building text-indigo-600"></i>
        </div>
        <div>
          <h3 class="font-bold text-slate-800 text-sm">Academia de Destino</h3>
          <p class="text-xs text-slate-400">
            Os alunos importados serão vinculados a esta academia
          </p>
        </div>
      </div>

      <Select
        v-model="academiaSelecionada"
        :options="academias"
        optionLabel="nome"
        placeholder="Selecione a academia..."
        :loading="carregandoAcademias"
        :disabled="carregandoAcademias || importando"
        class="w-full"
        showClear
      >
        <template #option="{ option }">
          <div class="flex items-center gap-2">
            <i class="pi pi-building text-slate-400 text-xs"></i>
            <span class="text-sm">{{ option.nome }}</span>
          </div>
        </template>
        <template #value="{ value }">
          <div v-if="value" class="flex items-center gap-2">
            <i class="pi pi-building text-indigo-500 text-xs"></i>
            <span class="text-sm font-medium text-slate-700">{{
              value.nome
            }}</span>
          </div>
        </template>
      </Select>

      <p
        v-if="!academiaSelecionada && !carregandoAcademias"
        class="text-xs text-amber-500 mt-2 flex items-center gap-1"
      >
        <i class="pi pi-exclamation-circle text-xs"></i>
        Selecione uma academia para habilitar a importação
      </p>
      <p
        v-else-if="academiaSelecionada"
        class="text-xs text-emerald-600 mt-2 flex items-center gap-1"
      >
        <i class="pi pi-check-circle text-xs"></i>
        Alunos serão vinculados a
        <strong class="ml-1">{{ academiaSelecionada.nome }}</strong>
      </p>
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h3 class="font-bold text-slate-800">Executar Importação</h3>
          <p class="text-xs text-slate-400 mt-0.5">
            A importação pode levar alguns segundos dependendo do volume de
            alunos.
          </p>
          <p
            v-if="ultimaImportacao"
            class="text-xs text-emerald-600 mt-1 flex items-center gap-1"
          >
            <i class="pi pi-clock text-xs"></i>
            Última execução: {{ formatarDataHora(ultimaImportacao) }}
          </p>
        </div>
        <Button
          label="Importar Agora"
          icon="pi pi-refresh"
          :loading="importando"
          :disabled="!podeImportar"
          class="shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 border-none shadow-md shadow-blue-100 hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
          @click="importarAlunos"
        />
      </div>

      <transition name="fade">
        <div v-if="importando" class="mt-5 pt-5 border-t border-slate-100">
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center"
            >
              <i class="pi pi-spin pi-spinner text-blue-500"></i>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-700">
                Sincronizando com a EVO...
              </p>
              <p class="text-xs text-slate-400">
                Buscando membros ativos de natação.
              </p>
            </div>
          </div>
          <div class="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-progress"
            ></div>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div
          v-if="resultadoImportacao && !importando"
          class="mt-5 pt-5 border-t border-slate-100"
        >
          <div class="flex items-center gap-2 mb-4">
            <div
              class="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center"
            >
              <i class="pi pi-check text-emerald-600 text-sm"></i>
            </div>
            <p class="font-bold text-emerald-700 text-sm">
              Importação concluída com sucesso!
            </p>
          </div>

          <div v-if="stats()" class="grid grid-cols-3 gap-3 mb-4">
            <div
              class="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center"
            >
              <p class="text-2xl font-extrabold text-emerald-700">
                {{ stats()!.novos }}
              </p>
              <p class="text-xs text-emerald-600 font-semibold mt-0.5">
                Novos alunos
              </p>
            </div>
            <div
              class="bg-sky-50 border border-sky-100 rounded-xl p-3 text-center"
            >
              <p class="text-2xl font-extrabold text-sky-700">
                {{ stats()!.atualizados }}
              </p>
              <p class="text-xs text-sky-600 font-semibold mt-0.5">
                Atualizados
              </p>
            </div>
            <div
              class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center"
            >
              <p class="text-2xl font-extrabold text-slate-600">
                {{ stats()!.requisicoes }}
              </p>
              <p class="text-xs text-slate-500 font-semibold mt-0.5">
                Requisições API
              </p>
            </div>
          </div>

          <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p class="text-xs font-mono text-slate-600">
              {{ resultadoImportacao }}
            </p>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div
          v-if="erroImportacao && !importando"
          class="mt-5 pt-5 border-t border-slate-100"
        >
          <div
            class="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl"
          >
            <div
              class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0"
            >
              <i class="pi pi-times text-red-600 text-sm"></i>
            </div>
            <div>
              <p class="font-bold text-red-700 text-sm mb-1">
                Falha na importação
              </p>
              <p class="text-xs text-red-600 font-mono leading-relaxed">
                {{ erroImportacao }}
              </p>
              <p class="text-xs text-red-400 mt-2">
                Verifique se as variáveis
                <code class="bg-red-100 px-1 rounded">evo.api.*</code> estão
                configuradas corretamente no servidor.
              </p>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <div
      class="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start"
    >
      <i class="pi pi-info-circle text-amber-500 mt-0.5"></i>
      <div class="text-xs text-amber-700 leading-relaxed">
        <strong>Importante:</strong> A importação não atribui níveis (toucas)
        automaticamente. Após importar, acesse <strong>Alunos</strong> para
        definir o nível inicial de cada aluno. Turmas também precisam ser
        atribuídas manualmente em <strong>Turmas → Gerenciar</strong>.
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@keyframes progress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}
.animate-progress {
  width: 40%;
  animation: progress 1.4s ease-in-out infinite;
}
</style>
