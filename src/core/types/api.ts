export interface NivelDTO {
  uuid: string
  nome: string
  corTouca?: string | null
}

export interface ProfessorResumoDTO {
  uuid: string
  usuarioUuid: string
  nome: string
  email: string
  nomeAcademia: string
  cargo?: string | null
}

export interface TurmaDTO {
  uuid: string
  nome: string
  horarioInicio: string
  horarioFim: string
  diasSemana: string[]
  professor?: ProfessorResumoDTO | null
  nivelAlvo?: { uuid: string; nome: string; corTouca?: string | null } | null
  quantidadeAlunos?: number
}

export interface CadastroTurmaDTO {
  nome: string
  horarioInicio: string
  horarioFim: string
  diasSemana: string[]
  nivelAlvoId: string
  professorId: string
}

export interface HabilidadeDTO {
  uuid: string
  descricao: string
  categoria: string
  ativo: boolean
}

export interface AlunoDTO {
  uuid: string
  nome: string
  nivelAtual?: string | null
  corTouca?: string | null
  nomeTurma?: string | null
  nomeAcademia?: string | null
  ativo?: boolean
  nomeResponsavel?: string | null
  telefoneResponsavel?: string | null
}

export interface DashboardDTO {
  totalTurmas: number
  totalAlunos: number
  totalProfessores: number
  turmasDeHoje: TurmaDTO[]
  todasMinhasTurmas: TurmaDTO[]
}

export interface HistoricoAvaliacaoDTO {
  uuid: string
  dataAvaliacao: string
  nivel: string
  pontuacaoTotal?: number
  promovido: boolean
  observacoes?: string | null
  habilidadesAprovadas?: string[] | null
}

export interface AcademiaDTO {
  uuid: string
  nome: string
  logoUrl?: string
}

export interface UsuarioDTO {
  uuid: string
  nome: string
  email: string
  role: string
}

export interface EstatisticasDTO {
  totalAlunos: number
  totalTurmas: number
  totalProfessores: number
  alunosPorNivel: Record<string, number>
}
