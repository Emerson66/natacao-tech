import { defineStore } from 'pinia'
import api from '@/core/services/api'

export const useAcademiesStore = defineStore('academies', () => {
  async function fetchAcademias() {
    const response = await api.get('/api/academias')
    return response.data
  }

  /**
   * Passo 1: Criar a academia (JSON)
   * Passo 2: Upload da logo (Multipart) se houver arquivo
   */
  async function createAcademia(payload: any, logoFile?: File | null) {
    // 1. Criar dados de texto (envio como JSON padrão)
    const response = await api.post('/api/academias', payload)
    const academiaCriada = response.data
    const uuid = academiaCriada.uuid

    // 2. Se o componente passou um arquivo físico, faz o upload na sequência
    if (logoFile instanceof File) {
      try {
        await uploadLogo(uuid, logoFile)
      } catch (error) {
        console.error('Erro no upload da logo após criação:', error)
        // Opcional: Notificar que os dados foram salvos mas a logo falhou
        throw new Error('Academia criada, mas houve um erro ao enviar a logo.')
      }
    }

    return academiaCriada
  }

  /**
   * Passo 1: Atualizar dados (JSON)
   * Passo 2: Upload de nova logo se fornecida
   */
  async function updateAcademia(uuid: string, payload: any, logoFile?: File | null) {
    // 1. Atualizar dados de texto
    const response = await api.put(`/api/academias/${uuid}`, payload)

    // 2. Se houver um novo arquivo de logo físico
    if (logoFile instanceof File) {
      try {
        await uploadLogo(uuid, logoFile)
      } catch (error) {
        console.error('Erro no upload da logo na atualização:', error)
        throw new Error('Dados atualizados, mas houve um erro ao enviar a nova logo.')
      }
    }

    return response.data
  }

  async function deleteAcademia(uuid: string) {
    await api.delete(`/api/academias/${uuid}`)
  }

  /**
   * REGRA DE OURO: Para Multipart/FormData, NÃO definimos o Content-Type.
   * Ao passar 'undefined', o Axios remove o default 'application/json' 
   * e o navegador gera o boundary correto automaticamente.
   */
  async function uploadLogo(uuid: string, file: File) {
    const formData = new FormData()
    formData.append('logo', file) // A chave deve ser exatamente 'logo'

    await api.post(`/api/academias/${uuid}/logo`, formData, {
      headers: {
        'Content-Type': undefined,
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

