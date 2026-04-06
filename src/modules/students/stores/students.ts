import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/core/services/api'

export interface Student {
  id: string
  name: string
  dataNascimento: string | null
  nivelId: string
  level: string
  turmas: string[]
  status: 'active' | 'inactive'
  contact: string
}

export const useStudentsStore = defineStore('students', () => {
  const students = ref<Student[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const pagination = ref({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 30
  })

  function mapAluno(a: any): Student {
    let listaTurmas: string[] = []
    if (Array.isArray(a.turmas)) {
      listaTurmas = a.turmas.map((t: any) =>
        typeof t === 'string' ? t : (t?.nome ?? String(t))
      )
    } else if (Array.isArray(a.nomesTurmas)) {
      listaTurmas = a.nomesTurmas
    } else if (typeof a.turmas === 'string' && a.turmas.trim()) {
      listaTurmas = a.turmas.split(',').map((t: string) => t.trim())
    } else if (typeof a.nomesTurmas === 'string' && a.nomesTurmas.trim()) {
      listaTurmas = a.nomesTurmas.split(',').map((t: string) => t.trim())
    }

    const nivelAtualNome =
      typeof a.nivelAtual === 'string'
        ? a.nivelAtual
        : (a.nivelAtual?.nome ?? null)

    const nivelUuid =
      a.nivelUuid ??
      (typeof a.nivelAtual === 'object' ? a.nivelAtual?.uuid : null) ??
      ''

    return {
      id: a.uuid ?? a.id ?? '',
      name: a.nome ?? a.name ?? '',
      dataNascimento: a.dataNascimento ?? null,
      nivelId: nivelUuid,
      level: a.nivelNome ?? nivelAtualNome ?? 'Sem nível',
      turmas: listaTurmas,
      status: a.ativo !== false ? 'active' : 'inactive',
      contact: a.telefoneResponsavel ?? a.telefone ?? a.contact ?? '',
    }
  }

  async function fetchStudents(params: { page?: number; size?: number; nome?: string; nivelUuid?: string; semTurma?: boolean } = {}) {
    loading.value = true
    error.value = null
    const page = params.page ?? pagination.value.currentPage
    const size = params.size ?? pagination.value.size

    try {
      const query = new URLSearchParams()
      query.append('page', String(page))
      query.append('size', String(size))
      if (params.nome) query.append('nome', params.nome)
      if (params.nivelUuid) query.append('nivelUuid', params.nivelUuid)
      if (params.semTurma) query.append('semTurma', 'true')

      const response = await api.get(`/api/alunos?${query.toString()}`)
      const data = response.data?.content ?? response.data ?? []
      students.value = Array.isArray(data) ? data.map(mapAluno) : []
      
      if (response.data && response.data.totalPages !== undefined) {
        pagination.value = {
          currentPage: response.data.number,
          totalPages: response.data.totalPages,
          totalElements: response.data.totalElements,
          size: response.data.size
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar alunos:', err)
      error.value = err.response?.data?.message ?? 'Falha ao carregar alunos.'
      students.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchMeusAlunos() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/api/alunos/meus-alunos')
      const data = response.data?.content ?? response.data ?? []
      students.value = Array.isArray(data) ? data.map(mapAluno) : []
    } catch (err: any) {
      console.error('Erro ao buscar meus alunos:', err)
      error.value = err.response?.data?.message ?? 'Falha ao carregar alunos.'
      students.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchHistoricoAluno(uuid: string) {
    try {
      const response = await api.get(`/api/alunos/${uuid}/historico`)
      return response.data?.content ?? response.data ?? []
    } catch (err) {
      console.error('Erro ao buscar histórico:', err)
      return []
    }
  }

  async function addStudent(payload: any) {
    await api.post('/api/alunos', payload)
    await fetchStudents()
  }

  async function updateStudent(id: string, payload: any) {
    const { novasTurmasIds, ...dadosAluno } = payload
    await api.put(`/api/alunos/${id}`, dadosAluno)
    if (novasTurmasIds !== undefined) {
      await api.put(`/api/alunos/${id}/turmas`, { turmasIds: novasTurmasIds })
    }
    await fetchStudents()
  }

  async function deleteStudent(id: string) {
    await api.delete(`/api/alunos/${id}`)
    students.value = students.value.filter((s) => s.id !== id)
  }

  return {
    students,
    loading,
    error,
    pagination,
    fetchStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    fetchMeusAlunos,
    fetchHistoricoAluno,
  }
})
