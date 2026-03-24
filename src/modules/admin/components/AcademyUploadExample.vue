<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Gerenciar Academia</h1>

    <form @submit.prevent="handleSubmit" class="space-y-4 max-w-md">
      <!-- Nome da Academia -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Nome da Academia</label>
        <input 
          v-model="form.nome" 
          type="text" 
          class="mt-1 block w-full border rounded px-3 py-2"
          required
        >
      </div>

      <!-- Upload de Logo -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Logo (Imagem)</label>
        
        <!-- Preview opcional -->
        <div v-if="previewUrl" class="mb-2">
          <img :src="previewUrl" class="h-20 w-20 object-contain border rounded" />
        </div>

        <!-- 
          REGRA DE OURO NO COMPONENTE: 
          Capturar o evento @change para pegar o arquivo FÍSICO (File object).
        -->
        <input 
          type="file" 
          accept="image/*"
          @change="onFileChange"
          class="mt-1 block w-full text-sm text-gray-500"
        >
      </div>

      <button 
        type="submit" 
        :disabled="isSubmitting"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {{ isSubmitting ? 'Salvando...' : 'Salvar Academia' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAcademiesStore } from '@/modules/admin/stores/academies'

const academiesStore = useAcademiesStore()

// 1. Dados de texto (JSON)
const form = reactive({
  nome: '',
  // ... outros campos
})

// 2. Ref para armazenar o arquivo real (NÃO é uma string)
const selectedFile = ref<File | null>(null)

// 3. Ref apenas para exibição visual (opcional)
const previewUrl = ref<string | null>(null)

const isSubmitting = ref(false)

/**
 * Captura o arquivo real do input
 */
function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Armazena o objeto File real para enviar à store
    selectedFile.value = file

    // Gera preview apenas visual (não enviado ao backend)
    previewUrl.value = URL.createObjectURL(file)
  }
}

async function handleSubmit() {
  try {
    isSubmitting.value = true

    // REGRA DE OURO: Passar o objeto File real como segundo argumento
    await academiesStore.createAcademia(form, selectedFile.value)

    alert('Academia e Logo salvas com sucesso!')
    
    // Reset form
    form.nome = ''
    selectedFile.value = null
    previewUrl.value = null

  } catch (error: any) {
    alert(error.message || 'Erro ao salvar academia')
  } finally {
    isSubmitting.value = false
  }
}
</script>
