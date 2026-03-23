import { defineStore } from 'pinia'
import api from '@/core/services/api'

export const useAcademiesStore = defineStore('academies', () => {
  async function fetchAcademias() {
    const response = await api.get('/api/academias')
    return response.data
  }

  async function createAcademia(payload: any) {
    await api.post('/api/academias', payload)
  }

  async function updateAcademia(uuid: string, payload: any) {
    await api.put(`/api/academias/${uuid}`, payload)
  }

  async function deleteAcademia(uuid: string) {
    await api.delete(`/api/academias/${uuid}`)
  }

  async function uploadLogo(uuid: string, file: File) {
    const formData = new FormData()
    formData.append('logo', file)
    await api.post(`/api/academias/${uuid}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
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
