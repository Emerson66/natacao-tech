<template>
  <div class="max-w-6xl mx-auto p-4 space-y-6">
    <ConfirmDialog />

    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Minhas Turmas</h1>
        <p class="text-gray-500">Gerencie horários, níveis e alunos.</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <IconField iconPosition="left" class="w-full sm:w-64">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            placeholder="Buscar turma..."
            class="w-full"
          />
        </IconField>
        <Button
          label="Nova Turma"
          icon="pi pi-plus"
          @click="openCreateModal"
          class="w-full sm:w-auto"
        />
      </div>
    </div>

    <div class="flex items-center gap-3 flex-wrap">
      <span class="text-sm font-semibold text-slate-500">Filtrar por:</span>
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

    <div v-if="classesStore.loading" class="text-center py-10">
      <i class="pi pi-spin pi-spinner text-4xl text-sky-500"></i>
    </div>

    <div
      v-else-if="filteredClasses.length === 0"
      class="text-center py-12 bg-white rounded-xl border border-gray-100"
    >
      <i class="pi pi-calendar text-4xl text-slate-200 mb-3 block"></i>
      <p class="text-gray-500">Nenhuma turma encontrada.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="turma in filteredClasses"
        :key="turma.uuid"
        @click="openClassStudentsModal(turma)"
        class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-sky-400 transition-all duration-300 group flex flex-col justify-between cursor-pointer"
      >
        <div>
          <div class="flex justify-between items-start mb-4">
            <div
              class="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-bold text-xl group-hover:bg-sky-500 group-hover:text-white transition-colors duration-300"
            >
              {{ turma.nome?.charAt(0)?.toUpperCase() ?? '?' }}
            </div>
            <Tag
              :value="turma.nivelAlvo?.nome || 'Multinível'"
              severity="info"
              class="text-xs"
            />
          </div>

          <h3 class="font-bold text-lg text-gray-800 mb-1 leading-tight">
            {{ turma.nome }}
          </h3>

          <div class="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <i class="pi pi-clock text-sky-400"></i>
            <span class="font-medium">
              {{ formatarHorario(turma.horarioInicio) }} –
              {{ formatarHorario(turma.horarioFim) }}
            </span>
          </div>

          <div class="flex flex-wrap gap-1 mb-4">
            <span
              v-for="(dia, i) in formatDays(turma.diasSemana ?? [])"
              :key="`${turma.uuid}-dia-${i}`"
              class="text-[10px] uppercase font-bold px-2 py-1 bg-slate-50 text-slate-500 rounded-md border border-slate-100"
            >
              {{ dia }}
            </span>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-50 flex flex-col gap-2 mt-auto">
          <div class="flex items-center text-sm text-gray-600">
            <i class="pi pi-user mr-2 text-slate-400"></i>
            {{ turma.professor?.nome || 'Sem professor atribuído' }}
          </div>
          <div class="flex items-center justify-between text-sm text-gray-600">
            <span class="flex items-center gap-2">
              <i class="pi pi-users text-slate-400"></i>
              {{ turma.quantidadeAlunos ?? 0 }} alunos
            </span>
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="secondary"
              class="w-8 h-8 !text-gray-300 hover:!text-red-500 hover:bg-red-50 transition-colors z-10"
              v-tooltip.bottom="'Excluir Turma'"
              @click.stop="confirmDelete(turma)"
            />
          </div>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="showCreateModal"
      modal
      header="Nova Turma"
      :style="{ width: '32rem' }"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="font-bold text-sm text-gray-700"
            >Nome da Turma <span class="text-red-500">*</span></label
          >
          <InputText v-model="form.nome" placeholder="Ex: Baby Manhã A" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-bold text-sm text-gray-700"
              >Início <span class="text-red-500">*</span></label
            >
            <InputText
              v-model="form.horarioInicio"
              type="time"
              class="w-full"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-bold text-sm text-gray-700"
              >Fim <span class="text-red-500">*</span></label
            >
            <InputText v-model="form.horarioFim" type="time" class="w-full" />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <label class="font-bold text-sm text-gray-700"
              >Nível Alvo <span class="text-red-500">*</span></label
            >
            <button
              v-if="levelsStore.fetchError"
              @click="levelsStore.refetchLevels()"
              class="text-xs text-sky-600 hover:underline flex items-center gap-1"
            >
              <i class="pi pi-refresh text-[10px]"></i> Recarregar
            </button>
          </div>
          <div
            v-if="levelsStore.loading"
            class="flex items-center gap-2 text-sm text-slate-400 py-2"
          >
            <i class="pi pi-spin pi-spinner"></i> Carregando níveis...
          </div>
          <div
            v-else-if="levelsStore.fetchError"
            class="flex items-center gap-2 text-sm text-red-500 py-2"
          >
            <i class="pi pi-exclamation-circle"></i>
            {{ levelsStore.fetchError }}
          </div>
          <Select
            v-else
            v-model="form.nivelAlvoId"
            :options="levelsStore.levels"
            optionLabel="nome"
            optionValue="uuid"
            placeholder="Selecione o nível"
            class="w-full"
            filter
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-bold text-sm text-gray-700"
            >Professor Responsável <span class="text-red-500">*</span></label
          >
          <Select
            v-model="form.professorId"
            :options="professores"
            optionLabel="nome"
            optionValue="uuid"
            placeholder="Selecione um professor"
            class="w-full"
            filter
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-bold text-sm text-gray-700"
            >Dias da Semana <span class="text-red-500">*</span></label
          >
          <MultiSelect
            v-model="form.diasSemana"
            :options="weekDays"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecione os dias"
            :maxSelectedLabels="3"
            class="w-full"
          />
        </div>
        <div class="flex justify-end gap-2 mt-2 pt-4 border-t border-gray-100">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            @click="showCreateModal = false"
          />
          <Button
            label="Criar Turma"
            icon="pi pi-check"
            @click="saveClass"
            :loading="submitting"
          />
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showStudentsModal"
      modal
      header="Gerenciar Turma"
      :style="{ width: '40rem' }"
    >
      <div v-if="selectedClass" class="flex flex-col gap-5 pt-2">
        <div
          class="bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <p class="text-sm text-gray-500">
              Turma:
              <strong class="text-gray-800">{{ selectedClass.nome }}</strong>
              ({{ formatarHorario(selectedClass.horarioInicio) }})
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-gray-600">Professor:</span>
            <Select
              :modelValue="selectedClass.professor?.uuid"
              @update:modelValue="(val) => atualizarProfessor(val)"
              :options="professores"
              optionLabel="nome"
              optionValue="uuid"
              placeholder="Alterar Professor"
              class="w-48 text-sm"
            />
          </div>
        </div>

        <div
          class="flex gap-2 items-center bg-sky-50 p-3 rounded-lg border border-sky-100"
        >
          <Select
            v-model="alunoSelecionado"
            :options="alunosSemTurma"
            optionLabel="nome"
            optionValue="uuid"
            placeholder="Selecione um aluno sem turma..."
            class="flex-1"
            filter
          />
          <Button
            label="Matricular"
            icon="pi pi-user-plus"
            @click="matricular()"
            :disabled="!alunoSelecionado"
          />
        </div>

        <div>
          <h4 class="font-bold text-gray-700 text-sm mb-3 border-b pb-2">
            Alunos Matriculados ({{ classStudents.length }})
          </h4>

          <div v-if="loadingClassStudents" class="flex justify-center py-6">
            <i class="pi pi-spin pi-spinner text-2xl text-sky-400"></i>
          </div>

          <div
            v-else-if="classStudents.length === 0"
            class="text-center py-6 text-gray-500"
          >
            <i class="pi pi-users text-3xl mb-2 text-slate-300 block"></i>
            Nenhum aluno matriculado nesta turma.
          </div>

          <ul
            v-else
            class="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-2"
          >
            <li
              v-for="student in classStudents"
              :key="student.uuid"
              class="py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
            >
              <div class="flex items-center">
                <div
                  class="w-10 h-10 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-bold mr-4 shrink-0"
                >
                  {{ student.nome?.charAt(0)?.toUpperCase() ?? '?' }}
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-900">
                    {{ student.nome }}
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    Nível:
                    <span class="font-medium">{{
                      student.nivelNome ?? student.nivelAtual ?? 'Sem Nível'
                    }}</span>
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2 sm:self-auto self-end">
                <Select
                  v-model="transferirTurmaId[student.uuid]"
                  :options="
                    classesStore.classes.filter(
                      (c) => c.uuid !== selectedClass.uuid
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
                  @click="transferirAluno(student.uuid)"
                  :disabled="!transferirTurmaId[student.uuid]"
                  v-tooltip.top="'Transferir'"
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
import { formatDays } from '@/core/utils/formatters'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ConfirmDialog from 'primevue/confirmdialog'

const toast = useToast()
const confirm = useConfirm()
const classesStore = useClassesStore()
const levelsStore = useLevelsStore()

const showCreateModal = ref(false)
const showStudentsModal = ref(false)
const submitting = ref(false)
const searchQuery = ref('')
const filtroProfessor = ref('')
const selectedClass = ref<any>(null)
const professores = ref<any[]>([])

const classStudents = ref<any[]>([])
const loadingClassStudents = ref(false)
const alunosSemTurma = ref<any[]>([])
const alunoSelecionado = ref<string | null>(null)
const transferirTurmaId = ref<Record<string, string>>({})

const form = ref({
  nome: '',
  horarioInicio: '',
  horarioFim: '',
  diasSemana: [] as string[],
  nivelAlvoId: null as string | null,
  professorId: null as string | null,
})

const weekDays = [
  { label: 'Segunda-feira', value: 'SEGUNDA' },
  { label: 'Terça-feira', value: 'TERCA' },
  { label: 'Quarta-feira', value: 'QUARTA' },
  { label: 'Quinta-feira', value: 'QUINTA' },
  { label: 'Sexta-feira', value: 'SEXTA' },
  { label: 'Sábado', value: 'SABADO' },
]

const professoresUnicos = computed(() => {
  const nomes = new Set<string>()
  classesStore.classes.forEach((c: any) => {
    if (c.professor?.nome) nomes.add(c.professor.nome)
  })
  return Array.from(nomes).sort()
})

const filteredClasses = computed(() => {
  let list = classesStore.classes as any[]

  if (searchQuery.value) {
    const lower = searchQuery.value.toLowerCase()
    list = list.filter(
      (c) =>
        (c.nome ?? '').toLowerCase().includes(lower) ||
        (c.nivelAlvo?.nome ?? '').toLowerCase().includes(lower) ||
        (c.professor?.nome ?? '').toLowerCase().includes(lower)
    )
  }

  if (filtroProfessor.value) {
    list = list.filter((c) => c.professor?.nome === filtroProfessor.value)
  }

  return list
})

function formatarHorario(horario: any): string {
  if (!horario) return '--:--'
  if (Array.isArray(horario)) {
    const h = String(horario[0]).padStart(2, '0')
    const m = String(horario[1] || 0).padStart(2, '0')
    return `${h}:${m}`
  }
  return typeof horario === 'string' ? horario.substring(0, 5) : '--:--'
}

const carregarProfessores = async () => {
  try {
    const { data } = await api.get('/api/professores')
    professores.value = data
  } catch (err) {
    console.error('Erro ao buscar professores', err)
  }
}

const carregarAlunosSemTurma = async () => {
  try {
    const { data } = await api.get<any[]>('/api/turmas/alunos/sem-turma')
    alunosSemTurma.value = data
  } catch {}
}

const carregarAlunosDaTurma = async (turmaUuid: string) => {
  loadingClassStudents.value = true
  classStudents.value = []
  try {
    const { data } = await api.get<any[]>(`/api/turmas/${turmaUuid}/alunos`)
    classStudents.value = data
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao carregar alunos.',
    })
  } finally {
    loadingClassStudents.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    classesStore.fetchClasses(),
    levelsStore.fetchLevels(),
    carregarProfessores(),
    carregarAlunosSemTurma(),
  ])

  window.addEventListener('levels-error', (e: Event) => {
    const msg = (e as CustomEvent).detail
    toast.add({ severity: 'warn', summary: 'Níveis', detail: msg, life: 5000 })
  })
})

async function openClassStudentsModal(classItem: any) {
  selectedClass.value = classItem
  alunoSelecionado.value = null
  transferirTurmaId.value = {}
  showStudentsModal.value = true
  await carregarAlunosDaTurma(classItem.uuid)
}

function openCreateModal() {
  form.value = {
    nome: '',
    horarioInicio: '',
    horarioFim: '',
    diasSemana: [],
    nivelAlvoId: null,
    professorId: null,
  }

  if (levelsStore.levels.length === 0) levelsStore.refetchLevels()
  showCreateModal.value = true
}

async function matricular() {
  if (!alunoSelecionado.value || !selectedClass.value) return
  try {
    await api.post(
      `/api/turmas/${selectedClass.value.uuid}/alunos/${alunoSelecionado.value}`
    )
    await Promise.all([
      classesStore.fetchClasses(),
      carregarAlunosDaTurma(selectedClass.value.uuid),
      carregarAlunosSemTurma(),
    ])
    alunoSelecionado.value = null
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Aluno matriculado.',
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: e.response?.data?.message ?? 'Falha ao matricular.',
    })
  }
}

async function transferirAluno(alunoUuid: string) {
  const novaTurmaUuid = transferirTurmaId.value[alunoUuid]
  if (!novaTurmaUuid || !selectedClass.value) return
  try {
    await api.patch(`/api/alunos/${alunoUuid}/transferencia`, {
      novasTurmasIds: [novaTurmaUuid],
    })
    await Promise.all([
      classesStore.fetchClasses(),
      carregarAlunosDaTurma(selectedClass.value.uuid),
    ])
    delete transferirTurmaId.value[alunoUuid]
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Aluno transferido.',
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: e.response?.data?.message ?? 'Falha ao transferir.',
    })
  }
}

async function atualizarProfessor(novoProfessorId: string) {
  if (!selectedClass.value) return
  try {
    await api.patch(`/api/turmas/${selectedClass.value.uuid}/professor`, null, {
      params: { professorId: novoProfessorId },
    })
    await classesStore.fetchClasses()
    selectedClass.value = classesStore.classes.find(
      (c) => c.uuid === selectedClass.value.uuid
    )
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

function confirmDelete(turma: any) {
  confirm.require({
    message: `Excluir a turma "${turma.nome}"?`,
    header: 'Confirmar Exclusão',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Excluir',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const res = await classesStore.deleteClass(turma.uuid)
      toast.add({
        severity: res.success ? 'success' : 'error',
        summary: res.success ? 'Sucesso' : 'Erro',
        detail: res.success ? 'Turma excluída.' : 'Não foi possível excluir.',
      })
    },
  })
}

async function saveClass() {
  if (
    !form.value.nome ||
    !form.value.horarioInicio ||
    !form.value.horarioFim ||
    form.value.diasSemana.length === 0 ||
    !form.value.nivelAlvoId ||
    !form.value.professorId
  ) {
    return toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Preencha todos os campos obrigatórios.',
    })
  }
  submitting.value = true
  try {
    const payload: any = {
      nome: form.value.nome,
      horarioInicio:
        form.value.horarioInicio.length === 5
          ? `${form.value.horarioInicio}:00`
          : form.value.horarioInicio,
      horarioFim:
        form.value.horarioFim.length === 5
          ? `${form.value.horarioFim}:00`
          : form.value.horarioFim,
      diasSemana: form.value.diasSemana,
      nivelAlvoId: form.value.nivelAlvoId,
      professorId: form.value.professorId,
    }
    const res = await classesStore.createClass(payload)
    if (res.success) {
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Turma criada!',
      })
      showCreateModal.value = false
    } else {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: res.error ?? 'Falha ao criar turma.',
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha na comunicação com o servidor.',
    })
  } finally {
    submitting.value = false
  }
}
</script>
