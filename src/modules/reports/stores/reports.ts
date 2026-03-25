import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/core/services/api'

export interface AlunoAvaliacaoStatus {
  uuid: string
  nome: string
  nivel: string
  turmas: string[]
  dataUltimaAvaliacao: string | null
  avaliadoNoPeriodo: boolean
}

export const useReportsStore = defineStore('reports', () => {
  const relatorioPeriodo = ref<AlunoAvaliacaoStatus[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRelatorioPeriodo(dataInicio: string, dataFim: string) {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      params.append('dataInicio', dataInicio)
      params.append('dataFim', dataFim)
      const { data } = await api.get(`/api/alunos/relatorio-periodo?${params.toString()}`)
      relatorioPeriodo.value = Array.isArray(data) ? data : []
    } catch (err: any) {
      console.error('Erro ao buscar relatório de período:', err)
      error.value = err.response?.data?.message ?? 'Falha ao carregar relatório.'
      relatorioPeriodo.value = []
    } finally {
      loading.value = false
    }
  }

  function limpar() {
    relatorioPeriodo.value = []
    error.value = null
  }

  return {
    relatorioPeriodo,
    loading,
    error,
    fetchRelatorioPeriodo,
    limpar,
  }
})
