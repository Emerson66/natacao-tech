<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3">
      <div class="flex justify-between items-center flex-wrap gap-3">
        <div class="flex items-center gap-3 flex-wrap">
          <h1 class="text-2xl font-bold text-gray-900">Alunos</h1>
          <button
            @click="toggleFiltro"
            class="text-sm font-medium px-3 py-1.5 rounded-md border transition-colors"
            :class="
              mostrarApenasMeus
                ? 'bg-sky-100 text-sky-700 border-sky-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            "
          >
            {{ mostrarApenasMeus ? 'Ver Todos' : 'Meus Alunos' }}
          </button>
        </div>

        <button
          @click="openModal()"
          class="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 flex items-center gap-2 transition-colors shrink-0"
        >
          <i class="pi pi-plus text-sm"></i>
          <span>Novo Aluno</span>
        </button>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <div class="relative flex-1 min-w-[200px] max-w-sm">
          <i
            class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"
          ></i>
          <input
            v-model="buscaNome"
            type="text"
            placeholder="Buscar aluno por nome..."
            class="w-full pl-9 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-sky-400 placeholder:text-slate-400"
          />
          <button
            v-if="buscaNome"
            @click="buscaNome = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <i class="pi pi-times text-xs"></i>
          </button>
        </div>

        <select
          v-model="filtroProfessor"
          @change="onFiltroProfessorChange"
          class="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:border-sky-400"
        >
          <option value="">Todas as turmas</option>
          <option value="sem_turma">Sem turma</option>
          <option v-for="p in professoresUnicos" :key="p" :value="p">
            {{ p }}
          </option>
        </select>

        <span
          v-if="buscaNome || filtroProfessor"
          class="text-xs text-slate-400 font-medium whitespace-nowrap"
        >
          {{ alunosFiltrados.length }} resultado(s)
        </span>
      </div>
    </div>

    <div
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-600 border-b border-gray-100">
            <tr>
              <th class="px-6 py-4 font-semibold">Nome</th>
              <th class="px-6 py-4 font-semibold">Idade</th>
              <th class="px-6 py-4 font-semibold">Nível</th>
              <th class="px-6 py-4 font-semibold">Turmas</th>
              <th class="px-6 py-4 font-semibold">Status</th>
              <th class="px-6 py-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="student in alunosFiltrados"
              :key="student.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4 font-medium text-slate-800">
                {{ student.name }}
              </td>
              <td class="px-6 py-4 text-slate-500">
                {{ calcularIdade(student.dataNascimento) }} anos
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-full text-xs font-medium"
                >
                  {{ student.level }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1.5 items-center">
                  <template v-if="student.turmas && student.turmas.length > 0">
                    <span
                      v-for="turma in student.turmas.slice(0, 2)"
                      :key="turma"
                      class="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium whitespace-nowrap"
                    >
                      {{ turma }}
                    </span>
                    <span
                      v-if="student.turmas.length > 2"
                      class="px-2 py-1 bg-sky-100 text-sky-700 rounded-md text-xs font-bold cursor-default"
                      :title="student.turmas.slice(2).join(', ')"
                    >
                      +{{ student.turmas.length - 2 }}
                    </span>
                  </template>
                  <span v-else class="text-slate-400 text-xs italic"
                    >Sem turma</span
                  >
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="
                    student.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-red-50 text-red-700 border-red-100'
                  "
                  class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                >
                  {{ student.status === 'active' ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right space-x-1">
                <button
                  @click="abrirHistorico(student.id)"
                  class="w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors inline-flex items-center justify-center"
                  title="Ver Histórico"
                >
                  <i class="pi pi-history"></i>
                </button>
                <button
                  @click="openModal(student)"
                  class="w-8 h-8 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors inline-flex items-center justify-center"
                  title="Editar"
                >
                  <i class="pi pi-pencil"></i>
                </button>
                <button
                  @click="deleteStudent(student.id)"
                  class="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center"
                  title="Excluir"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </td>
            </tr>
            <tr v-if="alunosFiltrados.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                <i class="pi pi-users text-3xl mb-2 block"></i>
                Nenhum aluno encontrado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginação -->
      <div v-if="studentsStore.pagination.totalPages > 1" class="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
        <span class="text-sm text-slate-500">
          Mostrando página {{ studentsStore.pagination.currentPage + 1 }} de {{ studentsStore.pagination.totalPages }} (Total: {{ studentsStore.pagination.totalElements }})
        </span>
        <div class="flex items-center gap-1">
          <button @click="mudarPagina(0)" :disabled="studentsStore.pagination.currentPage === 0" class="px-2.5 py-1.5 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" title="Primeira">
            <i class="pi pi-angle-double-left text-xs"></i>
          </button>
          <button @click="mudarPagina(studentsStore.pagination.currentPage - 1)" :disabled="studentsStore.pagination.currentPage === 0" class="px-2.5 py-1.5 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" title="Anterior">
            <i class="pi pi-angle-left text-xs"></i>
          </button>
          
          <button v-for="p in paginasVisiveis" :key="p" @click="mudarPagina(p)" :class="p === studentsStore.pagination.currentPage ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'" class="w-8 h-8 flex items-center justify-center text-sm border rounded-md transition-colors">
            {{ p + 1 }}
          </button>

          <button @click="mudarPagina(studentsStore.pagination.currentPage + 1)" :disabled="studentsStore.pagination.currentPage === studentsStore.pagination.totalPages - 1" class="px-2.5 py-1.5 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" title="Próxima">
            <i class="pi pi-angle-right text-xs"></i>
          </button>
          <button @click="mudarPagina(studentsStore.pagination.totalPages - 1)" :disabled="studentsStore.pagination.currentPage === studentsStore.pagination.totalPages - 1" class="px-2.5 py-1.5 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" title="Última">
            <i class="pi pi-angle-double-right text-xs"></i>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white rounded-xl max-w-2xl w-full shadow-2xl flex flex-col"
        style="max-height: 90vh"
      >
        <div class="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <h2 class="text-xl font-bold text-slate-800">
            {{ editingId ? 'Editar Aluno' : 'Novo Aluno' }}
          </h2>
        </div>

        <div class="overflow-y-auto flex-1 px-6 py-4">
          <form @submit.prevent="saveStudent" class="space-y-4">
            <div class="grid grid-cols-2 gap-5">
              <div class="col-span-2">
                <label class="block text-sm font-semibold text-slate-700 mb-1.5"
                  >Nome Completo <span class="text-red-500">*</span></label
                >
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="block w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5"
                  >Data de Nascimento <span class="text-red-500">*</span></label
                >
                <input
                  v-model="form.dataNascimento"
                  type="date"
                  required
                  :max="dataMaxNascimento"
                  class="block w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
                />
                <p
                  v-if="form.dataNascimento"
                  class="text-xs text-sky-600 mt-1 font-medium"
                >
                  <i class="pi pi-info-circle mr-1"></i>
                  {{ calcularIdade(form.dataNascimento) }} anos
                </p>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5"
                  >Nível <span class="text-red-500">*</span></label
                >

                <div
                  v-if="levelsStore.loading"
                  class="flex items-center gap-2 text-sm text-slate-400 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                >
                  <i class="pi pi-spin pi-spinner text-sky-400"></i>
                  Carregando níveis...
                </div>

                <div
                  v-else-if="levelsStore.levels.length === 0"
                  class="text-sm text-red-500 border border-red-200 rounded-lg px-3 py-2 bg-red-50"
                >
                  <i class="pi pi-exclamation-circle mr-1"></i>
                  Nenhum nível cadastrado. Cadastre em Admin › Níveis.
                </div>

                <select
                  v-else
                  v-model="form.nivelId"
                  required
                  class="block w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm bg-white outline-none"
                >
                  <option value="" disabled>Selecione um nível</option>
                  <option
                    v-for="level in levelsStore.levels"
                    :key="level.uuid"
                    :value="level.uuid"
                  >
                    {{ level.nome }}
                  </option>
                </select>

                <p v-if="editingId" class="text-[10px] text-slate-400 mt-1">
                  <i class="pi pi-info-circle mr-0.5"></i>
                  Alterar o nível atualizará a tabela de habilidades do aluno.
                </p>
              </div>

              <div class="col-span-2">
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-semibold text-slate-700"
                    >Turmas</label
                  >
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400">
                      {{ form.turmasIds.length }} selecionada(s)
                    </span>
                    <select
                      v-model="filtroModalProfessor"
                      class="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-500 focus:outline-none focus:border-sky-400"
                    >
                      <option value="">Todos os professores</option>
                      <option
                        v-for="p in professoresUnicosModal"
                        :key="p"
                        :value="p"
                      >
                        {{ p }}
                      </option>
                    </select>
                  </div>
                </div>

                <div
                  class="border border-slate-200 rounded-lg bg-slate-50 overflow-hidden"
                >
                  <div class="overflow-y-auto" style="max-height: 180px">
                    <div class="p-2 space-y-1.5">
                      <label
                        v-for="c in turmasFiltradas"
                        :key="c.uuid"
                        class="flex items-center gap-3 bg-white px-3 py-2.5 rounded-md border border-slate-100 cursor-pointer hover:border-sky-200 hover:bg-sky-50 transition-colors"
                        :class="{
                          'border-sky-300 bg-sky-50': form.turmasIds.includes(
                            c.uuid
                          ),
                        }"
                      >
                        <input
                          type="checkbox"
                          :value="c.uuid"
                          v-model="form.turmasIds"
                          class="rounded text-sky-500 focus:ring-sky-500 border-slate-300 w-4 h-4 shrink-0"
                        />
                        <div class="flex flex-col min-w-0">
                          <span
                            class="text-sm font-semibold text-slate-700 truncate"
                          >
                            {{ c.nome }}
                          </span>
                          <span class="text-xs text-slate-400">
                            {{ c.horarioInicio?.substring?.(0, 5) ?? '' }}
                            <span v-if="c.professor?.nome">
                              · {{ c.professor.nome }}
                            </span>
                            <span v-if="c.nivelAlvo?.nome" class="text-sky-500">
                              · {{ c.nivelAlvo.nome }}
                            </span>
                          </span>
                        </div>
                      </label>

                      <div
                        v-if="turmasFiltradas.length === 0"
                        class="text-xs text-slate-400 py-4 text-center"
                      >
                        Nenhuma turma encontrada.
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="turmasFiltradas.length > 4"
                    class="px-3 py-1.5 bg-slate-100 border-t border-slate-200 text-[10px] text-slate-400 text-center"
                  >
                    <i class="pi pi-angle-down mr-1"></i>
                    Role para ver mais {{ turmasFiltradas.length }} turmas
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5"
                  >Contato (WhatsApp) <span class="text-red-500">*</span></label
                >
                <input
                  v-model="form.contact"
                  type="text"
                  required
                  placeholder="(00) 00000-0000"
                  class="block w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5"
                  >Status</label
                >
                <select
                  v-model="form.status"
                  required
                  class="block w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm bg-white outline-none"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <div
          class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0"
        >
          <button
            type="button"
            @click="showModal = false"
            class="px-5 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="saveStudent"
            class="px-5 py-2.5 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 shadow-sm shadow-sky-200 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="historicoModal.visivel"
      header="Histórico de Avaliações"
      :style="{ width: '30rem' }"
      modal
    >
      <ul class="space-y-3">
        <li
          v-for="item in historicoModal.dados"
          :key="item.uuid"
          class="p-4 border border-slate-100 bg-slate-50 rounded-lg"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="font-bold text-slate-800">{{
              formatarDataLocal(item.dataAvaliacao)
            }}</span>
            <span
              :class="
                item.promovido
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-slate-500 bg-slate-100'
              "
              class="px-2 py-1 text-xs font-bold rounded"
            >
              {{ item.promovido ? 'Promovido' : 'Mantido' }}
            </span>
          </div>
          <div class="text-sm text-slate-600">
            Nível: <strong>{{ item.nivelNome }}</strong>
          </div>
          <div
            v-if="item.observacoes"
            class="text-xs text-slate-500 mt-1 italic"
          >
            "{{ item.observacoes }}"
          </div>
        </li>
        <li
          v-if="historicoModal.dados.length === 0"
          class="text-center text-slate-500 py-6"
        >
          Nenhum histórico encontrado.
        </li>
      </ul>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { useStudentsStore } from '../stores/students'
import { useClassesStore } from '../../classes/stores/classes'
import { useLevelsStore } from '../../levels/stores/levels'

const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const levelsStore = useLevelsStore()

const showModal = ref(false)
const editingId = ref<string | null>(null)
const mostrarApenasMeus = ref(false)
const filtroProfessor = ref('')
const filtroModalProfessor = ref('')
const buscaNome = ref('')

const historicoModal = ref<{ visivel: boolean; dados: any[] }>({
  visivel: false,
  dados: [],
})

const dataMaxNascimento = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const form = ref({
  name: '',
  dataNascimento: '',
  nivelId: '',
  level: 'Iniciante',
  turmasIds: [] as string[],
  status: 'active' as 'active' | 'inactive',
  contact: '',
})

function calcularIdade(dataNasc: string | undefined | null): number {
  if (!dataNasc) return 0
  let nascimento: Date
  if (Array.isArray(dataNasc)) {
    const [y, m, d] = dataNasc as any
    nascimento = new Date(y, m - 1, d)
  } else {
    nascimento = new Date(dataNasc)
  }
  if (isNaN(nascimento.getTime())) return 0
  const hoje = new Date()
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const mes = hoje.getMonth() - nascimento.getMonth()
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--
  }
  return Math.max(0, idade)
}

const professoresUnicos = computed(() => {
  const nomes = new Set<string>()
  classesStore.classes.forEach((c: any) => {
    if (c.professor?.nome) nomes.add(c.professor.nome)
  })
  return Array.from(nomes).sort()
})

const professoresUnicosModal = computed(() => professoresUnicos.value)

const turmasFiltradas = computed(() => {
  if (!filtroModalProfessor.value) return classesStore.classes
  return classesStore.classes.filter(
    (c: any) => c.professor?.nome === filtroModalProfessor.value
  )
})

const alunosFiltrados = computed(() => {
  let lista = studentsStore.students

  if (filtroProfessor.value && filtroProfessor.value !== 'sem_turma') {
    const turmasDoProf = classesStore.classes
      .filter((c: any) => c.professor?.nome === filtroProfessor.value)
      .map((c: any) => c.nome)

    lista = lista.filter((s: any) => {
      if (!s.turmas || s.turmas.length === 0) return false
      return s.turmas.some((t: string) => turmasDoProf.includes(t))
    })
  }

  return lista
})

let debounceTimeout: any = null
watch(buscaNome, (newVal) => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    studentsStore.fetchStudents({ page: 0, nome: newVal, semTurma: filtroProfessor.value === 'sem_turma' })
  }, 500)
})

async function onFiltroProfessorChange() {
  await studentsStore.fetchStudents({
    page: 0,
    nome: buscaNome.value,
    semTurma: filtroProfessor.value === 'sem_turma'
  })
}

async function mudarPagina(page: number) {
  if (page < 0 || page >= studentsStore.pagination.totalPages) return
  await studentsStore.fetchStudents({ page, nome: buscaNome.value, semTurma: filtroProfessor.value === 'sem_turma' })
}

const paginasVisiveis = computed(() => {
  const current = studentsStore.pagination.currentPage
  const total = studentsStore.pagination.totalPages
  
  if (total <= 5) return Array.from({ length: total }, (_, i) => i)
  
  let start = Math.max(0, current - 2)
  let end = Math.min(total - 1, current + 2)
  
  if (end - start < 4) {
    if (start === 0) end = Math.min(4, total - 1)
    else if (end === total - 1) start = Math.max(0, total - 5)
  }
  
  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

onMounted(async () => {
  await Promise.all([
    studentsStore.fetchStudents(),
    classesStore.fetchClasses(),
    levelsStore.fetchLevels(),
  ])
})

async function toggleFiltro() {
  mostrarApenasMeus.value = !mostrarApenasMeus.value
  if (mostrarApenasMeus.value && studentsStore.fetchMeusAlunos) {
    await studentsStore.fetchMeusAlunos()
  } else {
    await studentsStore.fetchStudents({ semTurma: filtroProfessor.value === 'sem_turma' })
  }
}

async function abrirHistorico(uuid: string) {
  if (studentsStore.fetchHistoricoAluno) {
    historicoModal.value.dados = await studentsStore.fetchHistoricoAluno(uuid)
  }
  historicoModal.value.visivel = true
}

async function openModal(student?: any) {
  filtroModalProfessor.value = ''

  if (levelsStore.levels.length === 0) {
    await levelsStore.fetchLevels()
  }

  if (student) {
    editingId.value = student.id

    const selectedClassIds =
      student.turmas && student.turmas.length > 0
        ? (student.turmas
            .map((nome: string) => {
              const cls = classesStore.classes.find((c) => c.nome === nome)
              return cls ? cls.uuid : null
            })
            .filter(Boolean) as string[])
        : []

    form.value = {
      name: student.name,
      dataNascimento: student.dataNascimento || '',
      nivelId: student.nivelId,
      level: student.level || 'Iniciante',
      turmasIds: selectedClassIds,
      status: student.status,
      contact: student.contact,
    }
  } else {
    editingId.value = null
    form.value = {
      name: '',
      dataNascimento: '',
      nivelId: '',
      level: 'Iniciante',
      turmasIds: [],
      status: 'active',
      contact: '',
    }
  }
  showModal.value = true
}

async function saveStudent() {
  try {
    if (editingId.value) {
      await studentsStore.updateStudent(editingId.value, {
        nome: form.value.name,
        dataNascimento: form.value.dataNascimento || null,
        telefoneResponsavel: form.value.contact,
        nivelId: form.value.nivelId || null,
        novasTurmasIds: form.value.turmasIds,
      })
    } else {
      await studentsStore.addStudent({
        nome: form.value.name,
        dataNascimento: form.value.dataNascimento || null,
        telefoneResponsavel: form.value.contact,
        nomeResponsavel: 'Responsável',
        nivelId: form.value.nivelId,
        turmasIds: form.value.turmasIds,
      })
    }
    showModal.value = false
  } catch (e) {
    console.error(e)
    alert('Erro ao salvar o aluno. Verifique os dados.')
  }
}

function deleteStudent(id: string) {
  if (confirm('Tem certeza que deseja excluir este aluno?')) {
    studentsStore.deleteStudent(id)
  }
}

function formatarDataLocal(dt: string | number[]): string {
  if (!dt) return '--/--/----'
  if (Array.isArray(dt)) {
    const [y, m, d] = dt
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
  }
  return new Date(dt).toLocaleDateString('pt-BR')
}
</script>
