<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useReportsStore } from '@/modules/reports/stores/reports'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

const toast = useToast()
const store = useReportsStore()

const dataInicio = ref('')
const dataFim = ref('')

type FiltroStatus = 'todos' | 'avaliados' | 'pendentes'
const filtroStatus = ref<FiltroStatus>('todos')

const jaFezBusca = ref(false)

async function buscar() {
  if (!dataInicio.value || !dataFim.value) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Preencha ambas as datas antes de buscar.',
      life: 3000,
    })
    return
  }
  if (dataInicio.value > dataFim.value) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'A data início deve ser anterior à data fim.',
      life: 3000,
    })
    return
  }
  jaFezBusca.value = true
  await store.fetchRelatorioPeriodo(dataInicio.value, dataFim.value)

  if (store.error) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: store.error,
      life: 4000,
    })
  }
}

const dadosFiltrados = computed(() => {
  if (filtroStatus.value === 'avaliados') {
    return store.relatorioPeriodo.filter((a) => a.avaliadoNoPeriodo)
  }
  if (filtroStatus.value === 'pendentes') {
    return store.relatorioPeriodo.filter((a) => !a.avaliadoNoPeriodo)
  }
  return store.relatorioPeriodo
})

const totalAlunos = computed(() => store.relatorioPeriodo.length)
const totalAvaliados = computed(
  () => store.relatorioPeriodo.filter((a) => a.avaliadoNoPeriodo).length,
)
const totalPendentes = computed(
  () => store.relatorioPeriodo.filter((a) => !a.avaliadoNoPeriodo).length,
)

function formatarData(dt: string | null): string {
  if (!dt) return '—'
  const d = new Date(dt)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 p-4">
    <!-- Header -->
    <div>
      <h1 class="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
        Relatório de Avaliações por Período
      </h1>
      <p class="text-slate-500 text-sm mt-1">
        Verifique quais alunos foram avaliados dentro do período selecionado.
      </p>
    </div>

    <!-- Filtros  -->
    <div
      class="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4"
    >
      <p class="text-sm font-bold text-slate-700">
        <i class="pi pi-filter mr-1.5 text-sky-500"></i>Filtros
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <!-- Data Início -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 mb-1"
            >Data Início</label
          >
          <input
            v-model="dataInicio"
            type="date"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:border-sky-400"
          />
        </div>

        <!-- Data Fim -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 mb-1"
            >Data Fim</label
          >
          <input
            v-model="dataFim"
            type="date"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:border-sky-400"
          />
        </div>

        <!-- Botão Buscar -->
        <div>
          <Button
            label="Buscar"
            icon="pi pi-search"
            :loading="store.loading"
            @click="buscar"
            class="w-full"
          />
        </div>

        <!-- Filtro local de status -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 mb-1"
            >Status</label
          >
          <select
            v-model="filtroStatus"
            class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600 focus:outline-none focus:border-sky-400"
          >
            <option value="todos">Todos</option>
            <option value="avaliados">Avaliados</option>
            <option value="pendentes">Pendentes</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Estado vazio - antes de buscar -->
    <div
      v-if="!jaFezBusca"
      class="text-center py-14 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400"
    >
      <i class="pi pi-calendar text-4xl mb-3 block text-slate-300"></i>
      <p class="text-sm">Selecione um período e clique em <strong>Buscar</strong> para gerar o relatório.</p>
    </div>

    <!-- Loading -->
    <div
      v-else-if="store.loading"
      class="flex items-center justify-center gap-2 py-14 text-slate-400 text-sm bg-white rounded-xl border border-slate-100"
    >
      <i class="pi pi-spin pi-spinner text-2xl text-sky-400"></i>
      <span>Carregando relatório...</span>
    </div>

    <!-- Resultados -->
    <template v-else-if="jaFezBusca && !store.loading">
      <!-- Contadores -->
      <div class="grid grid-cols-3 gap-4" v-if="store.relatorioPeriodo.length > 0">
        <div
          class="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center"
        >
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total
          </p>
          <p class="text-3xl font-extrabold text-slate-800 mt-1">
            {{ totalAlunos }}
          </p>
        </div>
        <div
          class="bg-white rounded-xl border border-emerald-100 shadow-sm p-4 text-center"
        >
          <p class="text-xs font-bold text-emerald-500 uppercase tracking-wider">
            Avaliados
          </p>
          <p class="text-3xl font-extrabold text-emerald-600 mt-1">
            {{ totalAvaliados }}
          </p>
        </div>
        <div
          class="bg-white rounded-xl border border-amber-100 shadow-sm p-4 text-center"
        >
          <p class="text-xs font-bold text-amber-500 uppercase tracking-wider">
            Pendentes
          </p>
          <p class="text-3xl font-extrabold text-amber-600 mt-1">
            {{ totalPendentes }}
          </p>
        </div>
      </div>

      <!-- Tabela vazia -->
      <div
        v-if="store.relatorioPeriodo.length === 0"
        class="text-center py-14 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400"
      >
        <i class="pi pi-inbox text-4xl mb-3 block text-slate-300"></i>
        <p class="text-sm">Nenhum aluno encontrado para o período selecionado.</p>
      </div>

      <!-- Tabela com dados -->
      <div
        v-else
        class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <DataTable
          :value="dadosFiltrados"
          stripedRows
          responsiveLayout="scroll"
          class="text-sm"
          :paginator="dadosFiltrados.length > 15"
          :rows="15"
        >
          <Column header="Nome" field="nome" sortable style="min-width: 180px">
            <template #body="{ data }">
              <span class="font-semibold text-slate-800">{{ data.nome }}</span>
            </template>
          </Column>

          <Column header="Nível" field="nivel" sortable style="min-width: 130px">
            <template #body="{ data }">
              <span class="text-sky-600 font-medium">{{ data.nivel || '—' }}</span>
            </template>
          </Column>

          <Column header="Turma(s)" style="min-width: 160px">
            <template #body="{ data }">
              <span class="text-slate-600">{{
                Array.isArray(data.turmas) && data.turmas.length
                  ? data.turmas.join(', ')
                  : '—'
              }}</span>
            </template>
          </Column>

          <Column
            header="Última Avaliação"
            sortable
            :sortField="'dataUltimaAvaliacao'"
            style="min-width: 150px"
          >
            <template #body="{ data }">
              <span class="text-slate-700">{{
                formatarData(data.dataUltimaAvaliacao)
              }}</span>
            </template>
          </Column>

          <Column header="Status" style="min-width: 140px">
            <template #body="{ data }">
              <span
                v-if="data.avaliadoNoPeriodo"
                class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                ✅ Avaliado
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200"
              >
                ⏳ Pendente
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </div>
</template>
