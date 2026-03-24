<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '@/core/services/api'
import { useAuthStore } from '@/core/stores/auth'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Textarea from 'primevue/textarea'
import Tooltip from 'primevue/tooltip'

const vTooltip = Tooltip
const toast = useToast()
const confirm = useConfirm()
const auth = useAuthStore()

const podeEditar = computed(() =>
  ['ADMIN', 'DIRETOR'].includes(auth.role ?? '')
)

interface Nivel {
  uuid: string
  nome: string
  corTouca: string | null
  descricao: string | null
}

const niveis = ref<Nivel[]>([])
const loading = ref(false)
const busca = ref('')

const modalVisible = ref(false)
const submitting = ref(false)
const editando = ref(false)
const uuidEditando = ref<string | null>(null)

const form = ref({ nome: '', corTouca: '#0ea5e9', descricao: '' })
const erros = ref({ nome: '' })

const nivelFiltrados = computed(() => {
  const q = busca.value.toLowerCase().trim()
  if (!q) return niveis.value
  return niveis.value.filter((n) => n.nome.toLowerCase().includes(q))
})

onMounted(carregarNiveis)

async function carregarNiveis() {
  loading.value = true
  try {
    const { data } = await api.get<Nivel[]>('/api/niveis')
    niveis.value = Array.isArray(data) ? data : []
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao carregar níveis.',
    })
  } finally {
    loading.value = false
  }
}

function abrirCriar() {
  editando.value = false
  uuidEditando.value = null
  form.value = { nome: '', corTouca: '#0ea5e9', descricao: '' }
  erros.value = { nome: '' }
  modalVisible.value = true
}

function abrirEditar(nivel: Nivel) {
  editando.value = true
  uuidEditando.value = nivel.uuid
  form.value = {
    nome: nivel.nome,
    corTouca: nivel.corTouca || '#0ea5e9',
    descricao: nivel.descricao || '',
  }
  erros.value = { nome: '' }
  modalVisible.value = true
}

function validar(): boolean {
  erros.value = { nome: '' }
  if (!form.value.nome.trim()) {
    erros.value.nome = 'Nome é obrigatório.'
    return false
  }
  return true
}

async function salvar() {
  if (!validar()) return
  submitting.value = true
  try {
    const payload = {
      nome: form.value.nome.trim(),
      corTouca: form.value.corTouca || null,
      descricao: form.value.descricao?.trim() || null,
    }

    if (editando.value && uuidEditando.value) {
      const { data } = await api.put<Nivel>(
        `/api/niveis/${uuidEditando.value}`,
        payload
      )
      const idx = niveis.value.findIndex((n) => n.uuid === uuidEditando.value)
      if (idx !== -1) niveis.value[idx] = data
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Nível atualizado!',
      })
    } else {
      const { data } = await api.post<Nivel>('/api/niveis', payload)
      niveis.value.unshift(data)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Nível criado!',
      })
    }
    modalVisible.value = false
  } catch (e: any) {
    const msg =
      e.response?.data?.mensagem ||
      e.response?.data?.message ||
      'Falha ao salvar.'
    toast.add({ severity: 'error', summary: 'Erro', detail: msg })
  } finally {
    submitting.value = false
  }
}

function confirmarExclusao(nivel: Nivel) {
  confirm.require({
    message: `Remover o nível "${nivel.nome}"? Esta ação não pode ser desfeita.`,
    header: 'Remover Nível',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Remover',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.delete(`/api/niveis/${nivel.uuid}`)
        niveis.value = niveis.value.filter((n) => n.uuid !== nivel.uuid)
        toast.add({
          severity: 'success',
          summary: 'Removido',
          detail: `${nivel.nome} removido.`,
        })
      } catch (e: any) {
        const msg =
          e.response?.data?.mensagem ||
          e.response?.data?.message ||
          'Não foi possível remover.'
        toast.add({ severity: 'error', summary: 'Erro', detail: msg })
      }
    },
  })
}

function corTexto(hex: string | null): string {
  if (!hex) return '#ffffff'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.55 ? '#1e293b' : '#ffffff'
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6 p-4">
    <ConfirmDialog />

    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    >
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span
            class="bg-sky-100 text-sky-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
          >
            Gestão
          </span>
        </div>
        <h1
          class="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight"
        >
          Níveis (Toucas)
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Gerencie os níveis de aprendizado e suas cores de touca.
        </p>
      </div>

      <div class="flex w-full sm:w-auto gap-3">
        <IconField iconPosition="left" class="w-full sm:w-60">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="busca"
            placeholder="Buscar nível..."
            class="w-full"
          />
        </IconField>
        <Button
          v-if="podeEditar"
          label="Novo Nível"
          icon="pi pi-plus"
          @click="abrirCriar"
          class="shrink-0"
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <i class="pi pi-spin pi-spinner text-3xl text-sky-500"></i>
    </div>

    <div
      v-else-if="nivelFiltrados.length === 0"
      class="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200"
    >
      <i class="pi pi-star text-5xl text-slate-200 mb-4 block"></i>
      <p class="text-slate-500 font-semibold">Nenhum nível encontrado</p>
      <Button
        v-if="podeEditar"
        label="Criar primeiro nível"
        size="small"
        text
        class="mt-3"
        @click="abrirCriar"
      />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="nivel in nivelFiltrados"
        :key="nivel.uuid"
        class="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
      >
        <div
          class="h-2 w-full"
          :style="{ backgroundColor: nivel.corTouca || '#0ea5e9' }"
        ></div>

        <div class="p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm"
                :style="{
                  backgroundColor: nivel.corTouca || '#0ea5e9',
                  color: corTexto(nivel.corTouca),
                }"
              >
                {{ nivel.nome.charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <p class="font-bold text-slate-800 text-sm truncate">
                  {{ nivel.nome }}
                </p>
                <div class="flex items-center gap-1.5 mt-1">
                  <div
                    class="w-3 h-3 rounded-full border border-white/30 shadow-sm"
                    :style="{ backgroundColor: nivel.corTouca || '#0ea5e9' }"
                  ></div>
                  <span class="text-xs text-slate-400 font-mono">
                    {{ nivel.corTouca || 'Sem cor' }}
                  </span>
                </div>
              </div>
            </div>

            <div
              v-if="podeEditar"
              class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                severity="secondary"
                v-tooltip.top="'Editar'"
                @click="abrirEditar(nivel)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                v-tooltip.top="'Remover'"
                @click="confirmarExclusao(nivel)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <p
      v-if="!loading && nivelFiltrados.length > 0"
      class="text-xs text-slate-400 text-right"
    >
      {{ nivelFiltrados.length }} nível(eis) encontrado(s)
    </p>

    <Dialog
      v-model:visible="modalVisible"
      modal
      :header="editando ? 'Editar Nível' : 'Novo Nível'"
      :style="{ width: '26rem' }"
      :closable="!submitting"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div
          class="h-14 rounded-xl flex items-center justify-center font-bold text-base transition-all shadow-sm"
          :style="{
            backgroundColor: form.corTouca || '#0ea5e9',
            color: corTexto(form.corTouca),
          }"
        >
          {{ form.nome || 'Pré-visualização' }}
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-slate-700">
            Nome do Nível <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="form.nome"
            placeholder="Ex: Touca Branca"
            :class="{ 'p-invalid': erros.nome }"
            class="w-full"
          />
          <small v-if="erros.nome" class="text-red-500 text-xs">{{
            erros.nome
          }}</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-slate-700"
            >Cor da Touca</label
          >
          <div class="flex items-center gap-3">
            <input
              v-model="form.corTouca"
              type="color"
              class="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
            />
            <InputText
              v-model="form.corTouca"
              placeholder="#0ea5e9"
              class="flex-1 font-mono text-sm"
              maxlength="7"
            />
          </div>
          <small class="text-slate-400 text-xs">
            Selecione no seletor ou insira o código hexadecimal.
          </small>
        </div>
 
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-slate-700">Descrição</label>
          <Textarea
            v-model="form.descricao"
            placeholder="Objetivos motores, psicossociais e detalhes do nível..."
            rows="5"
            autoResize
            class="w-full text-sm"
          />
          <small class="text-slate-400 text-xs">
            Descreva os objetivos e critérios deste nível.
          </small>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            :disabled="submitting"
            @click="modalVisible = false"
          />
          <Button
            :label="editando ? 'Salvar' : 'Criar Nível'"
            icon="pi pi-check"
            :loading="submitting"
            @click="salvar"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>
