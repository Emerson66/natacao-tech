<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ConfirmDialog from 'primevue/confirmdialog'
import Tooltip from 'primevue/tooltip'

import { useAcademiesStore } from '@/modules/admin/stores/academies'

const toast = useToast()
const confirm = useConfirm()
const academiesStore = useAcademiesStore()
const vTooltip = Tooltip

interface Academia {
  uuid: string
  nome: string
  endereco: string
  telefone: string
  email?: string
  cnpj?: string
  logoUrl?: string
}

const academias = ref<Academia[]>([])
const loadingAcad = ref(false)
const buscaAcad = ref('')

const modalAcad = ref(false)
const submittingAcad = ref(false)
const editandoAcad = ref(false)
const uuidAcad = ref<string | null>(null)

const logoAcad = ref<File | null>(null)
const logoPreviewUrl = ref<string>('')
const logoInput = ref<HTMLInputElement | null>(null)

const formAcad = ref({
  nome: '',
  endereco: '',
  telefone: '',
  email: '',
  cnpj: '',
})
const errosAcad = ref({ nome: '', endereco: '', telefone: '' })

const academiasFiltradas = computed(() => {
  const q = buscaAcad.value.toLowerCase()
  if (!q) return academias.value
  return academias.value.filter(
    (a) =>
      a.nome?.toLowerCase().includes(q) ||
      a.endereco?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q)
  )
})

onMounted(carregarAcademias)

async function carregarAcademias() {
  loadingAcad.value = true
  try {
    academias.value = await academiesStore.fetchAcademias()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao carregar academias.',
    })
  } finally {
    loadingAcad.value = false
  }
}

function abrirCriarAcad() {
  editandoAcad.value = false
  uuidAcad.value = null
  formAcad.value = { nome: '', endereco: '', telefone: '', email: '', cnpj: '' }
  errosAcad.value = { nome: '', endereco: '', telefone: '' }
  logoAcad.value = null
  logoPreviewUrl.value = ''
  modalAcad.value = true
}

function abrirEditarAcad(acad: Academia) {
  editandoAcad.value = true
  uuidAcad.value = acad.uuid
  formAcad.value = {
    nome: acad.nome,
    endereco: acad.endereco,
    telefone: acad.telefone,
    email: acad.email || '',
    cnpj: acad.cnpj || '',
  }
  errosAcad.value = { nome: '', endereco: '', telefone: '' }
  logoAcad.value = null
  logoPreviewUrl.value = acad.logoUrl || ''
  modalAcad.value = true
}

function onLogoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
    toast.add({
      severity: 'warn',
      summary: 'Formato inválido',
      detail: 'Envie apenas PNG ou JPG.',
    })
    input.value = ''
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.add({
      severity: 'warn',
      summary: 'Arquivo grande',
      detail: 'A logo não pode ultrapassar 2MB.',
    })
    input.value = ''
    return
  }
  logoAcad.value = file
  logoPreviewUrl.value = URL.createObjectURL(file)
}

function triggerLogoUpload() {
  logoInput.value?.click()
}

function validarAcad(): boolean {
  let ok = true
  errosAcad.value = { nome: '', endereco: '', telefone: '' }
  if (!formAcad.value.nome.trim()) {
    errosAcad.value.nome = 'Nome é obrigatório.'
    ok = false
  }
  if (!formAcad.value.endereco.trim()) {
    errosAcad.value.endereco = 'Endereço é obrigatório.'
    ok = false
  }
  if (!formAcad.value.telefone.trim()) {
    errosAcad.value.telefone = 'Telefone é obrigatório.'
    ok = false
  }
  return ok
}

async function salvarAcad() {
  if (!validarAcad()) return
  submittingAcad.value = true

  try {
    const payload = {
      nome: formAcad.value.nome,
      endereco: formAcad.value.endereco,
      telefone: formAcad.value.telefone,
      email: formAcad.value.email || null,
      cnpj: formAcad.value.cnpj || null,
    }

    if (editandoAcad.value && uuidAcad.value) {
      await academiesStore.updateAcademia(uuidAcad.value, payload, logoAcad.value)
    } else {
      await academiesStore.createAcademia(payload, logoAcad.value)
    }

    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Academia salva com sucesso!',
    })
    modalAcad.value = false
    await carregarAcademias()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao salvar',
      detail:
        e.message ||
        e.response?.data?.mensagem ||
        e.response?.data?.message ||
        'Verifique os dados.',
    })
  } finally {
    submittingAcad.value = false
  }
}

function excluirAcad(acad: Academia) {
  confirm.require({
    message: `Remover a academia "${acad.nome}"? Todos os dados vinculados serão afetados.`,
    header: 'Remover Academia',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Remover',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await academiesStore.deleteAcademia(acad.uuid)
        academias.value = academias.value.filter((a) => a.uuid !== acad.uuid)
        toast.add({
          severity: 'success',
          summary: 'Removida',
          detail: `${acad.nome} removida.`,
        })
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível remover. Verifique vínculos.',
        })
      }
    },
  })
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 p-4">
    <ConfirmDialog />

    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    >
      <div>
        <h1
          class="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight"
        >
          Academias
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Gerencie as unidades e logotipos do sistema.
        </p>
      </div>
      <div class="flex w-full sm:w-auto gap-3">
        <IconField iconPosition="left" class="w-full sm:w-64">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="buscaAcad"
            placeholder="Buscar academia..."
            class="w-full"
          />
        </IconField>
        <Button
          label="Nova Academia"
          icon="pi pi-building"
          @click="abrirCriarAcad"
          class="shrink-0"
        />
      </div>
    </div>

    <div v-if="loadingAcad" class="flex justify-center py-16">
      <i class="pi pi-spin pi-spinner text-3xl text-sky-500"></i>
    </div>

    <div
      v-else-if="academiasFiltradas.length === 0"
      class="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200"
    >
      <i class="pi pi-building text-4xl text-slate-300 mb-3 block"></i>
      <p class="text-slate-500 font-medium">Nenhuma academia encontrada</p>
      <Button
        label="Cadastrar primeira academia"
        size="small"
        text
        class="mt-3"
        @click="abrirCriarAcad"
      />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="acad in academiasFiltradas"
        :key="acad.uuid"
        class="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow group flex flex-col"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0"
            >
              <img
                v-if="acad.logoUrl"
                :src="acad.logoUrl"
                alt="Logo"
                class="w-full h-full object-cover"
              />
              <i v-else class="pi pi-building text-slate-400 text-xl"></i>
            </div>
            <div>
              <p class="font-bold text-slate-800 text-sm leading-tight">
                {{ acad.nome }}
              </p>
              <p v-if="acad.cnpj" class="text-xs text-slate-400 mt-0.5">
                {{ acad.cnpj }}
              </p>
            </div>
          </div>
          <div
            class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Button
              icon="pi pi-pencil"
              text
              rounded
              size="small"
              severity="secondary"
              v-tooltip.top="'Editar'"
              @click="abrirEditarAcad(acad)"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              v-tooltip.top="'Remover'"
              @click="excluirAcad(acad)"
            />
          </div>
        </div>

        <div class="space-y-2 text-xs text-slate-500 mt-auto">
          <p class="flex items-center">
            <i class="pi pi-map-marker w-5 text-slate-400"></i
            ><span class="truncate">{{ acad.endereco }}</span>
          </p>
          <p class="flex items-center">
            <i class="pi pi-phone w-5 text-slate-400"></i>{{ acad.telefone }}
          </p>
          <p v-if="acad.email" class="flex items-center">
            <i class="pi pi-envelope w-5 text-slate-400"></i
            ><span class="truncate">{{ acad.email }}</span>
          </p>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="modalAcad"
      modal
      :header="editandoAcad ? 'Editar Academia' : 'Nova Academia'"
      :style="{ width: '30rem' }"
      :closable="!submittingAcad"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-slate-700"
            >Nome da Academia <span class="text-red-500">*</span></label
          >
          <InputText
            v-model="formAcad.nome"
            placeholder="Ex: Connect Acqua Kids"
            :class="{ 'p-invalid': errosAcad.nome }"
            class="w-full"
          />
          <small v-if="errosAcad.nome" class="text-red-500 text-xs">{{
            errosAcad.nome
          }}</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-slate-700"
            >Endereço <span class="text-red-500">*</span></label
          >
          <InputText
            v-model="formAcad.endereco"
            placeholder="Ex: Rua das Piscinas, 100 - Centro"
            :class="{ 'p-invalid': errosAcad.endereco }"
            class="w-full"
          />
          <small v-if="errosAcad.endereco" class="text-red-500 text-xs">{{
            errosAcad.endereco
          }}</small>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-slate-700"
              >Telefone <span class="text-red-500">*</span></label
            >
            <InputText
              v-model="formAcad.telefone"
              placeholder="(11) 99999-0000"
              :class="{ 'p-invalid': errosAcad.telefone }"
              class="w-full"
            />
            <small v-if="errosAcad.telefone" class="text-red-500 text-xs">{{
              errosAcad.telefone
            }}</small>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-slate-700">CNPJ</label>
            <InputText
              v-model="formAcad.cnpj"
              placeholder="00.000.000/0001-00"
              class="w-full"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-slate-700"
            >E-mail da Academia</label
          >
          <InputText
            v-model="formAcad.email"
            placeholder="contato@academia.com"
            type="email"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-slate-700"
            >Logo da Academia</label
          >
          <div
            class="relative border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-sky-300 transition-colors cursor-pointer text-center"
            @click="triggerLogoUpload"
          >
            <input
              ref="logoInput"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              class="hidden"
              @change="onLogoSelected"
            />
            <div v-if="logoPreviewUrl" class="flex flex-col items-center gap-2">
              <img
                :src="logoPreviewUrl"
                alt="Preview da logo"
                class="max-h-20 max-w-full object-contain rounded-lg"
              />
              <span class="text-xs text-sky-600 font-medium"
                >Clique para trocar</span
              >
            </div>
            <div v-else class="flex flex-col items-center gap-2 text-slate-400">
              <i class="pi pi-image text-3xl"></i>
              <span class="text-xs"
                >Clique para selecionar a logo<br /><span class="text-slate-300"
                  >PNG ou JPG • max 2MB</span
                ></span
              >
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            :disabled="submittingAcad"
            @click="modalAcad = false"
          />
          <Button
            :label="editandoAcad ? 'Salvar' : 'Cadastrar'"
            icon="pi pi-check"
            :loading="submittingAcad"
            @click="salvarAcad"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>
