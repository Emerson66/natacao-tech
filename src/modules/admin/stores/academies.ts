import { defineStore } from 'pinia'
import api from '@/core/services/api'

export const useAcademiesStore = defineStore('academies', () => {
  async function fetchAcademias() {
    const response = await api.get('/api/academias')
    return response.data
  }

  async function createAcademia(payload: any, logoFile?: File) {
    // Passo 1: Criar a academia com os dados de texto
    const response = await api.post('/api/academias', payload)
    const { uuid } = response.data

    // Passo 2: Se houver logo, fazer o upload
    if (logoFile) {
      try {
        await uploadLogo(uuid, logoFile)
      } catch (error) {
        console.error('Erro ao fazer upload da logo:', error)
        throw new Error('Academia criada com sucesso, mas houve um erro ao enviar a logo.')
      }
    }
    return response.data
  }

  async function updateAcademia(uuid: string, payload: any, logoFile?: File) {
    // Passo 1: Atualizar dados de texto
    const response = await api.put(`/api/academias/${uuid}`, payload)

    // Passo 2: Se houver uma nova logo, fazer o upload
    if (logoFile) {
      try {
        await uploadLogo(uuid, logoFile)
      } catch (error) {
        console.error('Erro ao atualizar a logo:', error)
        throw new Error('Dados da academia atualizados, mas houve um erro ao enviar a nova logo.')
      }
    }
    return response.data
  }

  async function deleteAcademia(uuid: string) {
    await api.delete(`/api/academias/${uuid}`)
  }

  async function uploadLogo(uuid: string, file: File) {
    const formData = new FormData()
    formData.append('logo', file) // Chave exata "logo" como pedido

    await api.post(`/api/academias/${uuid}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  return {
    fetchAcademias,
    createAcademia,
    updateAcademia,
    deleteAcademia,
    uploadLogo,
  }
})
