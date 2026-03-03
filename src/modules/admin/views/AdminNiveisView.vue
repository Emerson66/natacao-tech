<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useLevelsStore } from '@/modules/levels/stores/levels'

const toast = useToast()
const levelsStore = useLevelsStore()

const formData = ref({ nome: '', descricao: '' })

async function handleCreate() {
  try {
    await levelsStore.createNivel(formData.value)

    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Nível criado com sucesso!',
      life: 3000,
    })

    formData.value = { nome: '', descricao: '' }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao criar o nível.',
      life: 3000,
    })
  }
}
</script>
