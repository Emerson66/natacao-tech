<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/core/services/api'
import type { HistoricoAvaliacaoDTO } from '@/core/types/api'

import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const toast = useToast()

interface AlunoOpcao {
  label: string
  value: string
  nivel?: string
  turmas?: string[]
}

const todosAlunos = ref<AlunoOpcao[]>([])
const loadingAlunos = ref(false)

const buscaNome = ref('')
const filtroNivel = ref('')
const filtroTurma = ref('')

const selectedStudentUuid = ref<string>('')

const history = ref<HistoricoAvaliacaoDTO[]>([])
const loadingHistory = ref(false)
const downloading = ref(false)
const sendingWA = ref(false)

const showDetailModal = ref(false)
const selectedReport = ref<any>(null)

onMounted(async () => {
  loadingAlunos.value = true
  try {
    const { data } = await api.get('/api/alunos')
    const lista = Array.isArray(data) ? data : (data?.content ?? [])

    todosAlunos.value = lista
      .map((a: any) => ({
        label: (a.nome ?? a.name ?? '').trim(),
        value: a.uuid ?? a.id ?? '',
        nivel: a.nivelAtual?.nome ?? a.nivelNome ?? a.nivelAtual ?? '',
        turmas: Array.isArray(a.nomesTurmas)
          ? a.nomesTurmas
          : Array.isArray(a.turmas)
            ? a.turmas.map((t: any) =>
                typeof t === 'string' ? t : (t?.nome ?? '')
              )
            : [],
      }))
      .filter((a: AlunoOpcao) => a.label && a.value)
      .sort((a: AlunoOpcao, b: AlunoOpcao) =>
        a.label.localeCompare(b.label, 'pt-BR')
      )
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao carregar alunos.',
    })
  } finally {
    loadingAlunos.value = false
  }
})

const niveisUnicos = computed(() => {
  const set = new Set<string>()
  todosAlunos.value.forEach((a) => {
    if (a.nivel) set.add(a.nivel)
  })
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
})

const turmasUnicas = computed(() => {
  const set = new Set<string>()
  todosAlunos.value.forEach((a) =>
    a.turmas?.forEach((t) => {
      if (t) set.add(t)
    })
  )
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
})

const alunosFiltrados = computed(() => {
  let lista = todosAlunos.value

  const q = buscaNome.value.trim().toLowerCase()
  if (q) {
    lista = lista.filter((a) => a.label.toLowerCase().includes(q))
  }

  if (filtroNivel.value) {
    lista = lista.filter((a) => a.nivel === filtroNivel.value)
  }

  if (filtroTurma.value) {
    lista = lista.filter((a) => a.turmas?.includes(filtroTurma.value))
  }

  return [...lista].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
})

const alunoSelecionado = computed(
  () =>
    todosAlunos.value.find((a) => a.value === selectedStudentUuid.value) ?? null
)

async function selecionarAluno(uuid: string) {
  selectedStudentUuid.value = uuid
  if (!uuid) {
    history.value = []
    return
  }
  await fetchHistory(uuid)
}

async function fetchHistory(uuid: string) {
  loadingHistory.value = true
  history.value = []
  try {
    const res = await api.get(`/api/alunos/${uuid}/historico`)
    const data = res.data?.content ?? res.data ?? []
    history.value = Array.isArray(data) ? data : []
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Não foi possível buscar o histórico.',
    })
  } finally {
    loadingHistory.value = false
  }
}

function viewReport(data: HistoricoAvaliacaoDTO) {
  selectedReport.value = {
    uuid: data.uuid,
    data: formatarData(data.dataAvaliacao),
    nivel: (data as any).nivelNome ?? data.nivel ?? '—',
    pontuacao: data.pontuacaoTotal ?? 0,
    status: data.promovido ? 'aprovado' : 'manter',
    feedback: data.observacoes || 'Sem observações.',
    habilidades: data.habilidadesAprovadas || [],
  }
  showDetailModal.value = true
}

async function sendToWhatsApp() {
  if (!selectedReport.value?.uuid) return
  sendingWA.value = true
  try {
    await api.post(`/api/whatsapp/enviar-avaliacao/${selectedReport.value.uuid}`)
    toast.add({ severity: 'success', summary: 'WhatsApp enviado!', life: 5000 })
  } catch (e: any) {
    const status = e.response?.status
    if (!status || status === 404 || status === 501) {
      const text =
        `Olá! Confira o relatório de natação:\n` +
        `📅 Data: ${selectedReport.value.data}\n` +
        `🏊 Nível: ${selectedReport.value.nivel}\n` +
        `⭐ Aprovadas: ${selectedReport.value.pontuacao} habilidade(s)\n` +
        `💬 Feedback: ${selectedReport.value.feedback}`
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
      toast.add({
        severity: 'info',
        summary: 'Abrindo WhatsApp',
        detail: 'Redirecionado para WhatsApp Web.',
        life: 4000,
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Erro ao enviar',
        detail: e.response?.data?.message ?? 'Falha ao enviar.',
      })
    }
  } finally {
    sendingWA.value = false
  }
}

async function downloadPDF() {
  if (!selectedReport.value?.uuid) return
  downloading.value = true
  try {
    const response = await api.get(
      `/api/avaliacoes/${selectedReport.value.uuid}/pdf`,
      {
        responseType: 'blob',
      }
    )
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `relatorio_avaliacao.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Download iniciado!',
      life: 3000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao baixar o PDF.',
      life: 4000,
    })
  } finally {
    downloading.value = false
  }
}

function formatarData(dt: any): string {
  if (!dt) return '--/--/----'
  if (Array.isArray(dt)) {
    const [y, m, d] = dt
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
  }
  return new Date(dt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function limparFiltros() {
  buscaNome.value = ''
  filtroNivel.value = ''
  filtroTurma.value = ''
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 p-4">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
        Histórico Escolar
      </h1>
      <p class="text-slate-500 text-sm mt-1">Acompanhe a evolução do aluno.</p>
    </div>

    <div
      class="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4"
    >
      <div class="flex items-center justify-between">
        <p class="text-sm font-bold text-slate-700">
          <i class="pi pi-filter mr-1.5 text-sky-500"></i>Selecione o Aluno
        </p>
        <button
          v-if="buscaNome || filtroNivel || filtroTurma"
          @click="limparFiltros"
          class="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
        >
          <i class="pi pi-times text-[10px]"></i> Limpar filtros
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="relative">
          <i
            class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"
          ></i>
          <input
            v-model="buscaNome"
            type="text"
            placeholder="Buscar por nome..."
            class="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:border-sky-400 placeholder:text-slate-400"
          />
          <button
            v-if="buscaNome"
            @click="buscaNome = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
          >
            <i class="pi pi-times text-xs"></i>
          </button>
        </div>

        <select
          v-model="filtroNivel"
          class="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600 focus:outline-none focus:border-sky-400"
        >
          <option value="">Todos os níveis</option>
          <option v-for="n in niveisUnicos" :key="n" :value="n">{{ n }}</option>
        </select>

        <select
          v-model="filtroTurma"
          class="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600 focus:outline-none focus:border-sky-400"
        >
          <option value="">Todas as turmas</option>
          <option v-for="t in turmasUnicas" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <div
        v-if="loadingAlunos"
        class="flex items-center gap-2 text-slate-400 text-sm py-2"
      >
        <i class="pi pi-spin pi-spinner text-sky-400"></i> Carregando alunos...
      </div>

      <div v-else>
        <p class="text-xs text-slate-400 mb-2">
          {{ alunosFiltrados.length }} aluno(s) encontrado(s)
          <span
            v-if="buscaNome || filtroNivel || filtroTurma"
            class="text-sky-500"
            >· filtrado(s)</span
          >
        </p>

        <div
          class="border border-slate-200 rounded-lg overflow-hidden"
          :class="
            alunosFiltrados.length === 0 ? '' : 'max-h-56 overflow-y-auto'
          "
        >
          <div
            v-if="alunosFiltrados.length === 0"
            class="text-center py-8 text-slate-400 text-sm bg-slate-50"
          >
            <i class="pi pi-search text-2xl mb-2 block text-slate-300"></i>
            Nenhum aluno encontrado.
          </div>

          <button
            v-for="aluno in alunosFiltrados"
            :key="aluno.value"
            @click="selecionarAluno(aluno.value)"
            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-sky-50 transition-colors border-b border-slate-50 last:border-0"
            :class="
              selectedStudentUuid === aluno.value
                ? 'bg-sky-50 border-l-2 border-l-sky-400'
                : 'bg-white'
            "
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                :class="
                  selectedStudentUuid === aluno.value
                    ? 'bg-sky-500'
                    : 'bg-slate-200 text-slate-500'
                "
              >
                {{ aluno.label.charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate">
                  {{ aluno.label }}
                </p>
                <p class="text-xs text-slate-400 mt-0.5">
                  <span v-if="aluno.nivel" class="text-sky-600 font-medium">{{
                    aluno.nivel
                  }}</span>
                  <span
                    v-if="aluno.nivel && aluno.turmas?.length"
                    class="mx-1 text-slate-300"
                    >·</span
                  >
                  <span v-if="aluno.turmas?.length"
                    >{{ aluno.turmas.slice(0, 2).join(', ')
                    }}<span v-if="aluno.turmas.length > 2">
                      +{{ aluno.turmas.length - 2 }}</span
                    ></span
                  >
                </p>
              </div>
            </div>
            <i
              v-if="selectedStudentUuid === aluno.value"
              class="pi pi-check-circle text-sky-500 shrink-0 ml-2"
            ></i>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="selectedStudentUuid"
      class="bg-white p-6 rounded-xl shadow-sm border border-slate-100"
    >
      <div class="flex items-center gap-3 mb-5">
        <div
          class="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-sm shrink-0"
        >
          {{ alunoSelecionado?.label.charAt(0).toUpperCase() ?? '?' }}
        </div>
        <div>
          <h2 class="font-bold text-slate-800">
            {{ alunoSelecionado?.label }}
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            <span
              v-if="alunoSelecionado?.nivel"
              class="text-sky-600 font-medium"
              >{{ alunoSelecionado.nivel }}</span
            >
          </p>
        </div>
      </div>

      <div v-if="loadingHistory" class="flex justify-center py-10">
        <i class="pi pi-spin pi-spinner text-4xl text-sky-500"></i>
      </div>

      <div
        v-else-if="history.length === 0"
        class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400"
      >
        <i class="pi pi-inbox text-4xl mb-2 block text-slate-300"></i>
        Nenhuma avaliação encontrada para este aluno.
      </div>

      <DataTable
        v-else
        :value="history"
        stripedRows
        responsiveLayout="scroll"
        class="text-sm"
      >
        <Column header="Data" style="min-width: 110px">
          <template #body="{ data }">
            <span class="font-medium text-slate-700">{{
              formatarData(data.dataAvaliacao)
            }}</span>
          </template>
        </Column>

        <Column header="Nível" style="min-width: 120px">
          <template #body="{ data }">
            <span class="text-slate-700">{{
              data.nivelNome ?? data.nivel ?? '—'
            }}</span>
          </template>
        </Column>

        <Column header="Habilidades" style="min-width: 100px">
          <template #body="{ data }">
            <span class="font-semibold text-slate-700">{{
              data.pontuacaoTotal ?? 0
            }}</span>
            <span class="text-slate-400 text-xs ml-1">aprovadas</span>
          </template>
        </Column>

        <Column header="Status" style="min-width: 110px">
          <template #body="{ data }">
            <Tag
              :value="data.promovido ? 'Promovido' : 'Mantido'"
              :severity="data.promovido ? 'success' : 'warn'"
            />
          </template>
        </Column>

        <Column header="Ações" style="min-width: 80px">
          <template #body="{ data }">
            <Button
              icon="pi pi-eye"
              text
              rounded
              size="small"
              v-tooltip.top="'Ver detalhes'"
              @click="viewReport(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="showDetailModal"
      modal
      header="Detalhes da Avaliação"
      :style="{ width: '90vw', maxWidth: '560px' }"
    >
      <div v-if="selectedReport" class="space-y-5 pt-2">
        <div
          class="bg-slate-50 p-4 rounded-xl flex items-center justify-between"
        >
          <div>
            <p
              class="text-xs text-slate-400 font-medium uppercase tracking-wider"
            >
              Data
            </p>
            <h2 class="text-lg font-bold text-slate-800 mt-0.5">
              {{ selectedReport.data }}
            </h2>
            <p class="text-sm text-slate-500 mt-0.5">
              {{ selectedReport.nivel }}
            </p>
          </div>
          <Tag
            :value="
              selectedReport.status === 'aprovado' ? 'Promovido' : 'Em Evolução'
            "
            :severity="
              selectedReport.status === 'aprovado' ? 'success' : 'warn'
            "
          />
        </div>

        <div class="text-center py-3">
          <span
            class="text-xs font-bold text-slate-400 uppercase tracking-widest"
            >Habilidades Aprovadas</span
          >
          <div class="text-5xl font-extrabold text-slate-900 mt-2 mb-4">
            {{ selectedReport.pontuacao }}
          </div>
        </div>

        <div class="bg-sky-50 p-4 rounded-xl border border-sky-100">
          <h4 class="font-bold text-sky-800 mb-2 text-sm">
            <i class="pi pi-comments mr-2"></i>Feedback do Professor
          </h4>
          <p class="text-sky-900 text-sm italic">
            "{{ selectedReport.feedback }}"
          </p>
        </div>

        <div class="flex flex-col gap-3 pt-2">
          <Button
            label="Baixar PDF"
            icon="pi pi-file-pdf"
            severity="danger"
            class="w-full"
            :loading="downloading"
            @click="downloadPDF"
          />
          <Button
            label="Enviar por WhatsApp"
            icon="pi pi-whatsapp"
            severity="success"
            class="w-full"
            :loading="sendingWA"
            @click="sendToWhatsApp"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>
