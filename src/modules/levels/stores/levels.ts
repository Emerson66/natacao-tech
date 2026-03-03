import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/core/services/api'
import type { NivelDTO } from '@/core/types/api'

export const useLevelsStore = defineStore('levels', () => {
  const levels = ref<NivelDTO[]>([])
  const loading = ref(false)

  async function fetchLevels() {
    loading.value = true
    try {
      const response = await api.get<NivelDTO[]>('/api/niveis')
      levels.value = response.data
    } catch (error: any) {
      const status = error?.response?.status
      if (status === 403) {
        console.error(
          'Acesso negado ao buscar níveis. Verifique as permissões do usuário ou o CORS do backend.'
        )
      } else {
        console.error('Erro ao buscar níveis:', error)
      }
    } finally {
      loading.value = false
    }
  }

  async function createNivel(payload: any) {
    try {
      await api.post('/api/niveis', payload)
      await fetchLevels()
    } catch (error) {
      console.error('Erro ao criar nível:', error)
      throw error
    }
  }

  async function updateNivel(uuid: string, payload: any) {
    try {
      await api.put(`/api/niveis/${uuid}`, payload)
    } catch (error) {
      console.error('Erro ao atualizar nível:', error)
      throw error
    }
  }

  return {
    levels,
    loading,
    fetchLevels,
    updateNivel,
    createNivel,
  }
})
