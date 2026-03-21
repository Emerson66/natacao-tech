<template>
  <div class="max-w-full mx-auto p-4 space-y-5">
    <ConfirmDialog />

    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
      <div>
        <h1
          class="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight"
        >
          Turmas
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Gerencie horários, níveis e alunos.
        </p>
      </div>
      <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <div class="relative w-full sm:w-64">
          <i
            class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"
          ></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar turma..."
            class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-sky-400 text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <Button
          v-if="auth.isCoordenador"
          label="Nova Turma"
          icon="pi pi-plus"
          @click="openCreateModal"
          class="w-full sm:w-auto shrink-0"
        />
      </div>
    </div>

    <div
      v-if="professoresUnicos.length > 0"
      class="flex items-center gap-2 flex-wrap"
    >
      <span class="text-xs font-bold text-slate-400 uppercase tracking-wider"
        >Filtrar:</span
      >
      <button
        @click="filtroProfessor = ''"
        class="text-xs font-bold px-3 py-1.5 rounded-full border transition-colors"
        :class="
          filtroProfessor === ''
            ? 'bg-sky-500 text-white border-sky-500'
            : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300'
        "
      >
        Todos
      </button>
      <button
        v-for="prof in professoresUnicos"
        :key="prof"
        @click="filtroProfessor = prof"
        class="text-xs font-bold px-3 py-1.5 rounded-full border transition-colors"
        :class="
          filtroProfessor === prof
            ? 'bg-sky-500 text-white border-sky-500'
            : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300'
        "
      >
        {{ prof }}
      </button>
    </div>

    <div v-if="classesStore.loading" class="flex justify-center py-16">
      <i class="pi pi-spin pi-spinner text-4xl text-sky-500"></i>
    </div>

    <div
      v-else-if="filteredClasses.length === 0"
      class="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200"
    >
      <i class="pi pi-calendar text-5xl text-slate-200 mb-4 block"></i>
      <p class="text-slate-500 font-medium">Nenhuma turma encontrada.</p>
      <Button
        v-if="auth.isCoordenador"
        label="Criar primeira turma"
        size="small"
        text
        class="mt-3"
        @click="openCreateModal"
      />
    </div>

    <div
      v-else
      class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div
        class="grid agenda-grid border-b border-slate-200 bg-slate-50 sticky top-0 z-10"
      >
        <div
          class="px-3 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center"
        >
          Horário
        </div>
        <div
          v-for="dia in DIAS_SEMANA"
          :key="dia.value"
          class="px-2 py-3 text-center border-l border-slate-200"
          :class="diaEhHoje(dia.value) ? 'bg-sky-50' : ''"
        >
          <span
            class="text-xs font-bold uppercase tracking-wider"
            :class="diaEhHoje(dia.value) ? 'text-sky-600' : 'text-slate-500'"
            >{{ dia.label }}</span
          >
          <div
            v-if="diaEhHoje(dia.value)"
            class="w-1.5 h-1.5 bg-sky-500 rounded-full mx-auto mt-1"
          ></div>
        </div>
      </div>

      <div
        v-for="(horario, hIdx) in horariosUnicos"
        :key="horario"
        class="grid agenda-grid"
        :class="hIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'"
      >
        <div
          class="px-3 py-2 flex items-start justify-end shrink-0 border-r border-slate-100"
        >
          <span
            class="text-xs font-bold text-slate-500 font-mono whitespace-nowrap mt-1"
          >
            {{ horario }}
          </span>
        </div>

        <div
          v-for="dia in DIAS_SEMANA"
          :key="dia.value"
          class="px-1.5 py-1.5 border-l border-slate-100 min-h-[4rem] align-top"
          :class="diaEhHoje(dia.value) ? 'bg-sky-50/30' : ''"
        >
          <div class="space-y-1">
            <div
              v-for="turma in turmasPorHorarioDia(horario, dia.value)"
              :key="turma.uuid"
              class="group relative rounded-lg px-2 py-1.5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border-l-[3px]"
              :style="{
                borderLeftColor: turma.nivelAlvo?.corTouca || '#0ea5e9',
                backgroundColor: hexToRgba(
                  turma.nivelAlvo?.corTouca || '#0ea5e9',
                  0.08
                ),
              }"
              @click="openStudentsModal(turma)"
            >
              <p
                class="text-[11px] font-bold text-slate-800 leading-tight truncate"
              >
                {{ turma.nome }}
              </p>

              <p class="text-[10px] text-slate-500 mt-0.5 font-mono">
                {{ formatarHorario(turma.horarioInicio) }}–{{
                  formatarHorario(turma.horarioFim)
                }}
              </p>

              <div
                class="flex items-center justify-between mt-1 flex-wrap gap-1"
              >
                <span
                  v-if="turma.nivelAlvo"
                  class="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white truncate max-w-[80px]"
                  :style="{
                    backgroundColor: turma.nivelAlvo.corTouca || '#0ea5e9',
                  }"
                >
                  {{ turma.nivelAlvo.nome }}
                </span>
                <span
                  class="text-[9px] text-slate-500 font-semibold whitespace-nowrap"
                >
                  <i class="pi pi-users text-[8px] mr-0.5"></i
                  >{{ turma.quantidadeAlunos ?? 0 }}
                </span>
              </div>

              <p
                v-if="turma.professor"
                class="text-[9px] text-slate-400 mt-0.5 truncate"
              >
                <i class="pi pi-user text-[8px] mr-0.5"></i
                >{{ turma.professor.nome }}
              </p>

              <div
                v-if="auth.isCoordenador"
                class="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button
                  @click.stop="openEditModal(turma)"
                  class="w-5 h-5 bg-white/90 rounded flex items-center justify-center text-slate-500 hover:text-sky-600 shadow-sm"
                  title="Editar"
                >
                  <i class="pi pi-pencil text-[8px]"></i>
                </button>
                <button
                  @click.stop="confirmDelete(turma)"
                  class="w-5 h-5 bg-white/90 rounded flex items-center justify-center text-slate-500 hover:text-red-500 shadow-sm"
                  title="Encerrar"
                >
                  <i class="pi pi-times text-[8px]"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="niveisComCor.length > 0"
        class="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-4 flex-wrap"
      >
        <span
          class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >Níveis:</span
        >
        <div
          v-for="nivel in niveisComCor"
          :key="nivel.nome"
          class="flex items-center gap-1.5"
        >
          <span
            class="w-2.5 h-2.5 rounded-full"
            :style="{ backgroundColor: nivel.cor }"
          ></span>
          <span class="text-[10px] font-semibold text-slate-600">{{
            nivel.nome
          }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="!classesStore.loading && filteredClasses.length > 0"
      class="flex items-center gap-4 text-xs text-slate-400 px-1"
    >
      <span
        ><strong class="text-slate-600">{{ filteredClasses.length }}</strong>
        turma(s)</span
      >
      <span
        ><strong class="text-slate-600">{{ totalAlunos }}</strong> aluno(s)
        matriculado(s)</span
      >
    </div>

    <Dialog
      v-model:visible="showFormModal"
      modal
      :header="editingTurma ? 'Editar Turma' : 'Nova Turma'"
      :style="{ width: '32rem' }"
      :closable="!submitting"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-slate-700"
            >Nome da Turma <span class="text-red-500">*</span></label
          >
          <InputText
            v-model="form.nome"
            placeholder="Ex: Baby Manhã A"
            class="w-full"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-slate-700"
              >Início <span class="text-red-500">*</span></label
            >
            <InputText
              v-model="form.horarioInicio"
              type="time"
              class="w-full"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-slate-700"
              >Fim <span class="text-red-500">*</span></label
            >
            <InputText v-model="form.horarioFim" type="time" class="w-full" />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-slate-700"
            >Dias da Semana <span class="text-red-500">*</span></label
          >
          <div class="flex flex-wrap gap-2">
            <button
              v-for="dia in DIAS"
              :key="dia.value"
              @click="toggleDia(dia.value)"
              class="px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors"
              :class="
                form.diasSemana.includes(dia.value)
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
              "
            >
              {{ dia.label }}
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-slate-700">Nível Alvo</label>
          <Select
            v-model="form.nivelAlvoId"
            :options="levelsStore.levels"
            optionLabel="nome"
            optionValue="uuid"
            placeholder="Selecione o nível (opcional)"
            class="w-full"
            showClear
            filter
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-slate-700">Professor</label>
          <Select
            v-model="form.professorId"
            :options="professores"
            optionLabel="nome"
            optionValue="uuid"
            placeholder="Selecione o professor (opcional)"
            class="w-full"
            showClear
            filter
          />
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            :disabled="submitting"
            @click="showFormModal = false"
          />
          <Button
            :label="editingTurma ? 'Salvar Alterações' : 'Criar Turma'"
            icon="pi pi-check"
            :loading="submitting"
            @click="saveTurma"
          />
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showStudentsModal"
      modal
      header="Gerenciar Turma"
      :style="{ width: '42rem' }"
    >
      <div v-if="selectedClass" class="flex flex-col gap-5 pt-2">
        <div
          class="bg-sky-50 border border-sky-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
        >
          <div>
            <p class="font-bold text-sky-800 text-sm">
              {{ selectedClass.nome }}
            </p>
            <p class="text-xs text-sky-600 mt-0.5">
              {{ formatarHorario(selectedClass.horarioInicio) }} –
              {{ formatarHorario(selectedClass.horarioFim) }}
              <span v-if="selectedClass.nivelAlvo">
                · {{ selectedClass.nivelAlvo.nome }}</span
              >
              <span class="ml-2"
                >· {{ formatDays(selectedClass.diasSemana).join(', ') }}</span
              >
            </p>
          </div>
          <div
            v-if="auth.isCoordenador"
            class="flex items-center gap-2 shrink-0"
          >
            <span class="text-xs font-semibold text-slate-500">Professor:</span>
            <Select
              :modelValue="selectedClass.professor?.uuid ?? null"
              @update:modelValue="trocarProfessor"
              :options="[
                { uuid: null, nome: 'Remover professor' },
                ...professores,
              ]"
              optionLabel="nome"
              optionValue="uuid"
              placeholder="Alterar..."
              class="w-44 text-sm"
            />
          </div>
        </div>

        <div
          v-if="auth.isCoordenador"
          class="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100"
        >
          <Select
            v-model="alunoParaMatricular"
            :options="alunosSemTurma"
            optionLabel="nome"
            optionValue="uuid"
            placeholder="Selecionar aluno sem turma..."
            class="flex-1"
            filter
            :emptyMessage="'Todos os alunos já possuem turma'"
          />
          <Button
            label="Matricular"
            icon="pi pi-user-plus"
            :disabled="!alunoParaMatricular"
            :loading="matriculando"
            @click="matricularAluno"
          />
        </div>

        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-slate-700 text-sm">
              Alunos matriculados
              <span
                class="ml-1.5 bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full"
                >{{ classStudents.length }}</span
              >
            </h4>
          </div>

          <div v-if="loadingStudents" class="flex justify-center py-8">
            <i class="pi pi-spin pi-spinner text-2xl text-sky-400"></i>
          </div>

          <div
            v-else-if="classStudents.length === 0"
            class="text-center py-8 border border-dashed border-slate-200 rounded-xl text-slate-400"
          >
            <i class="pi pi-users text-3xl mb-2 block"></i>
            Nenhum aluno matriculado.
          </div>

          <ul v-else class="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            <li
              v-for="aluno in classStudents"
              :key="aluno.uuid"
              class="flex flex-col sm:flex-row justify-between sm:items-center gap-3 py-3 px-1"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="w-9 h-9 bg-sky-100 text-sky-700 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                >
                  {{
                    (aluno.nome || '?')
                      .split(' ')
                      .slice(0, 2)
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()
                  }}
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-800">
                    {{ aluno.nome }}
                  </p>
                  <p class="text-xs text-slate-400">
                    {{ aluno.nivel || 'Sem nível' }}
                  </p>
                </div>
              </div>
              <div
                v-if="auth.isCoordenador"
                class="flex items-center gap-2 sm:self-auto self-end"
              >
                <Select
                  v-model="transferirParaId[aluno.uuid]"
                  :options="
                    classesStore.classes.filter(
                      (c) => c.uuid !== selectedClass!.uuid
                    )
                  "
                  optionLabel="nome"
                  optionValue="uuid"
                  placeholder="Transferir para..."
                  class="w-40 text-xs"
                />
                <Button
                  icon="pi pi-arrow-right-arrow-left"
                  severity="secondary"
                  outlined
                  size="small"
                  :disabled="!transferirParaId[aluno.uuid]"
                  v-tooltip.top="'Transferir'"
                  @click="transferirAluno(aluno.uuid)"
                />
                <Button
                  icon="pi pi-times"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Remover da turma'"
                  @click="removerAluno(aluno.uuid, aluno.nome)"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import api from '@/core/services/api'
import { useClassesStore } from '@/modules/classes/stores/classes'
import { useLevelsStore } from '@/modules/levels/stores/levels'
import { useAuthStore } from '@/core/stores/auth'
import { formatDays } from '@/core/utils/formatters'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import ConfirmDialog from 'primevue/confirmdialog'
import Tooltip from 'primevue/tooltip'

const vTooltip = Tooltip
const toast = useToast()
const confirm = useConfirm()
const classesStore = useClassesStore()
const levelsStore = useLevelsStore()
const auth = useAuthStore()

const DIAS_SEMANA = [
  { label: 'SEG', value: 'SEGUNDA' },
  { label: 'TER', value: 'TERCA' },
  { label: 'QUA', value: 'QUARTA' },
  { label: 'QUI', value: 'QUINTA' },
  { label: 'SEX', value: 'SEXTA' },
  { label: 'SÁB', value: 'SABADO' },
  { label: 'DOM', value: 'DOMINGO' },
]

const DIAS = [
  { label: 'Seg', value: 'SEGUNDA' },
  { label: 'Ter', value: 'TERCA' },
  { label: 'Qua', value: 'QUARTA' },
  { label: 'Qui', value: 'QUINTA' },
  { label: 'Sex', value: 'SEXTA' },
  { label: 'Sáb', value: 'SABADO' },
  { label: 'Dom', value: 'DOMINGO' },
]

const searchQuery = ref('')
const filtroProfessor = ref('')
const professores = ref<any[]>([])

const showFormModal = ref(false)
const submitting = ref(false)
const editingTurma = ref<any>(null)

const form = ref({
  nome: '',
  horarioInicio: '',
  horarioFim: '',
  diasSemana: [] as string[],
  nivelAlvoId: null as string | null,
  professorId: null as string | null,
})

const showStudentsModal = ref(false)
const selectedClass = ref<any>(null)
const classStudents = ref<any[]>([])
const loadingStudents = ref(false)
const alunosSemTurma = ref<any[]>([])
const alunoParaMatricular = ref<string | null>(null)
const matriculando = ref(false)
const transferirParaId = ref<Record<string, string>>({})

const filteredClasses = computed(() => {
  let list = classesStore.classes as any[]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (c) =>
        (c.nome ?? '').toLowerCase().includes(q) ||
        (c.nivelAlvo?.nome ?? '').toLowerCase().includes(q) ||
        (c.professor?.nome ?? '').toLowerCase().includes(q)
    )
  }
  if (filtroProfessor.value) {
    list = list.filter((c) => c.professor?.nome === filtroProfessor.value)
  }
  return list
})

const professoresUnicos = computed(() => {
  const nomes = new Set<string>()
  classesStore.classes.forEach((c: any) => {
    if (c.professor?.nome) nomes.add(c.professor.nome)
  })
  return Array.from(nomes).sort()
})

const horariosUnicos = computed(() => {
  const set = new Set<string>()
  filteredClasses.value.forEach((c: any) => {
    const h = formatarHorario(c.horarioInicio)
    if (h && h !== '--:--') set.add(h)
  })
  return Array.from(set).sort()
})

function turmasPorHorarioDia(horario: string, dia: string): any[] {
  return filteredClasses.value.filter((c: any) => {
    const h = formatarHorario(c.horarioInicio)
    const dias: string[] = Array.isArray(c.diasSemana) ? c.diasSemana : []
    return h === horario && dias.includes(dia)
  })
}

const totalAlunos = computed(() =>
  filteredClasses.value.reduce(
    (acc: number, c: any) => acc + (c.quantidadeAlunos ?? 0),
    0
  )
)

const niveisComCor = computed(() => {
  const map = new Map<string, string>()
  filteredClasses.value.forEach((c: any) => {
    if (c.nivelAlvo?.nome && c.nivelAlvo?.corTouca) {
      map.set(c.nivelAlvo.nome, c.nivelAlvo.corTouca)
    }
  })
  return Array.from(map.entries()).map(([nome, cor]) => ({ nome, cor }))
})

function formatarHorario(h: any): string {
  if (!h) return '--:--'
  if (Array.isArray(h))
    return `${String(h[0]).padStart(2, '0')}:${String(h[1] || 0).padStart(2, '0')}`
  return String(h).substring(0, 5)
}

function formatTime(t: string): string {
  return t.length === 5 ? `${t}:00` : t
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16) || 14
  const g = parseInt(hex.slice(3, 5), 16) || 165
  const b = parseInt(hex.slice(5, 7), 16) || 233
  return `rgba(${r},${g},${b},${alpha})`
}

function diaEhHoje(dia: string): boolean {
  const hoje = new Date().getDay()
  const map: Record<string, number> = {
    DOMINGO: 0,
    SEGUNDA: 1,
    TERCA: 2,
    QUARTA: 3,
    QUINTA: 4,
    SEXTA: 5,
    SABADO: 6,
  }
  return map[dia] === hoje
}

function toggleDia(dia: string) {
  const i = form.value.diasSemana.indexOf(dia)
  if (i >= 0) form.value.diasSemana.splice(i, 1)
  else form.value.diasSemana.push(dia)
}

onMounted(async () => {
  await Promise.all([
    classesStore.fetchClasses(),
    levelsStore.fetchLevels(),
    carregarProfessores(),
    carregarAlunosSemTurma(),
  ])
})

async function carregarProfessores() {
  try {
    const { data } = await api.get('/api/professores')
    professores.value = data
  } catch {
    console.error('Erro ao carregar professores')
  }
}

async function carregarAlunosSemTurma() {
  try {
    const { data } = await api.get<any[]>('/api/turmas/alunos/sem-turma')
    alunosSemTurma.value = data
  } catch {}
}

async function carregarAlunosDaTurma(uuid: string) {
  loadingStudents.value = true
  classStudents.value = []
  try {
    const { data } = await api.get<any[]>(`/api/turmas/${uuid}/alunos`)
    classStudents.value = data
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao carregar alunos.',
    })
  } finally {
    loadingStudents.value = false
  }
}

function openCreateModal() {
  editingTurma.value = null
  form.value = {
    nome: '',
    horarioInicio: '',
    horarioFim: '',
    diasSemana: [],
    nivelAlvoId: null,
    professorId: null,
  }
  if (levelsStore.levels.length === 0) levelsStore.refetchLevels()
  showFormModal.value = true
}

function openEditModal(turma: any) {
  editingTurma.value = turma
  form.value = {
    nome: turma.nome,
    horarioInicio: formatarHorario(turma.horarioInicio),
    horarioFim: formatarHorario(turma.horarioFim),
    diasSemana: [...(turma.diasSemana ?? [])],
    nivelAlvoId: turma.nivelAlvo?.uuid ?? null,
    professorId: turma.professor?.uuid ?? null,
  }
  if (levelsStore.levels.length === 0) levelsStore.refetchLevels()
  showFormModal.value = true
}

async function saveTurma() {
  if (
    !form.value.nome ||
    !form.value.horarioInicio ||
    !form.value.horarioFim ||
    form.value.diasSemana.length === 0
  ) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Preencha nome, horários e ao menos um dia.',
    })
    return
  }
  submitting.value = true
  try {
    const payload: any = {
      nome: form.value.nome,
      horarioInicio: formatTime(form.value.horarioInicio),
      horarioFim: formatTime(form.value.horarioFim),
      diasSemana: form.value.diasSemana,
      professorId: form.value.professorId || null,
      nivelAlvoId: form.value.nivelAlvoId || null,
    }
    if (editingTurma.value) {
      await api.patch(`/api/turmas/${editingTurma.value.uuid}`, payload)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Turma atualizada!',
      })
    } else {
      await api.post('/api/turmas', payload)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Turma criada!',
      })
    }
    showFormModal.value = false
    await classesStore.fetchClasses()
  } catch (e: any) {
    const status = e.response?.status
    const msg =
      e.response?.data?.mensagem ||
      e.response?.data?.message ||
      'Falha ao salvar turma.'
    if (status === 409) {
      toast.add({
        severity: 'warn',
        summary: 'Nome duplicado',
        detail: 'Já existe uma turma com este nome na academia.',
      })
    } else {
      toast.add({ severity: 'error', summary: 'Erro', detail: msg })
    }
  } finally {
    submitting.value = false
  }
}

function confirmDelete(turma: any) {
  confirm.require({
    message: `Encerrar a turma "${turma.nome}"? Todos os alunos serão desvinculados.`,
    header: 'Encerrar Turma',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Encerrar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const res = await classesStore.deleteClass(turma.uuid)
      toast.add({
        severity: res.success ? 'success' : 'error',
        summary: res.success ? 'Turma encerrada' : 'Erro',
        detail: res.success
          ? `"${turma.nome}" encerrada com sucesso.`
          : (res as any).error || 'Falha.',
      })
    },
  })
}

async function openStudentsModal(turma: any) {
  selectedClass.value = turma
  alunoParaMatricular.value = null
  transferirParaId.value = {}
  showStudentsModal.value = true
  await Promise.all([
    carregarAlunosDaTurma(turma.uuid),
    carregarAlunosSemTurma(),
  ])
}

async function matricularAluno() {
  if (!alunoParaMatricular.value || !selectedClass.value) return
  matriculando.value = true
  try {
    await api.post(
      `/api/turmas/${selectedClass.value.uuid}/alunos/${alunoParaMatricular.value}`
    )
    alunoParaMatricular.value = null
    await Promise.all([
      carregarAlunosDaTurma(selectedClass.value.uuid),
      carregarAlunosSemTurma(),
      classesStore.fetchClasses(),
    ])
    selectedClass.value =
      classesStore.classes.find((c) => c.uuid === selectedClass.value!.uuid) ??
      selectedClass.value
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Aluno matriculado.',
    })
  } catch (e: any) {
    const status = e.response?.status
    toast.add({
      severity: status === 409 ? 'warn' : 'error',
      summary: status === 409 ? 'Já matriculado' : 'Erro',
      detail: e.response?.data?.message ?? 'Falha ao matricular.',
    })
  } finally {
    matriculando.value = false
  }
}

async function removerAluno(alunoUuid: string, nome: string) {
  confirm.require({
    message: `Remover "${nome}" desta turma?`,
    header: 'Remover Aluno',
    icon: 'pi pi-user-minus',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Remover',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.delete(
          `/api/turmas/${selectedClass.value!.uuid}/alunos/${alunoUuid}`
        )
        await Promise.all([
          carregarAlunosDaTurma(selectedClass.value!.uuid),
          carregarAlunosSemTurma(),
          classesStore.fetchClasses(),
        ])
        selectedClass.value =
          classesStore.classes.find(
            (c) => c.uuid === selectedClass.value!.uuid
          ) ?? selectedClass.value
        toast.add({
          severity: 'success',
          summary: 'Removido',
          detail: `${nome} removido da turma.`,
        })
      } catch (e: any) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: e.response?.data?.message ?? 'Falha.',
        })
      }
    },
  })
}

async function transferirAluno(alunoUuid: string) {
  const novaTurmaUuid = transferirParaId.value[alunoUuid]
  if (!novaTurmaUuid || !selectedClass.value) return
  try {
    await api.patch(
      `/api/turmas/${selectedClass.value.uuid}/alunos/${alunoUuid}/transferir`,
      null,
      { params: { novaTurmaUuid } }
    )
    delete transferirParaId.value[alunoUuid]
    await Promise.all([
      carregarAlunosDaTurma(selectedClass.value.uuid),
      classesStore.fetchClasses(),
    ])
    selectedClass.value =
      classesStore.classes.find((c) => c.uuid === selectedClass.value!.uuid) ??
      selectedClass.value
    toast.add({
      severity: 'success',
      summary: 'Transferido',
      detail: 'Aluno transferido com sucesso.',
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: e.response?.data?.message ?? 'Falha ao transferir.',
    })
  }
}

async function trocarProfessor(professorId: string | null) {
  if (!selectedClass.value) return
  try {
    if (professorId) {
      await api.patch(
        `/api/turmas/${selectedClass.value.uuid}/professor`,
        null,
        { params: { professorId } }
      )
    } else {
      await api.patch(`/api/turmas/${selectedClass.value.uuid}`, {
        professorId: null,
      })
    }
    await classesStore.fetchClasses()
    selectedClass.value =
      classesStore.classes.find((c) => c.uuid === selectedClass.value!.uuid) ??
      selectedClass.value
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Professor atualizado.',
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: e.response?.data?.message ?? 'Falha.',
    })
  }
}
</script>

<style scoped>
.agenda-grid {
  display: grid;
  grid-template-columns: 64px repeat(7, minmax(100px, 1fr));
}

@media (max-width: 768px) {
  .agenda-grid {
    grid-template-columns: 56px repeat(5, minmax(80px, 1fr));
  }
}
</style>
