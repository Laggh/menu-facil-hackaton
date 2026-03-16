export type RestricaoKey = 
  | 'VEGETARIANO'
  | 'VEGANO'
  | 'SEM_ACUCAR'
  | 'SEM_SODIO'
  | 'CETOGENICO'
  | 'SEM_GLUTEN'
  | 'SEM_LACTOSE'
  | 'APLV'
  | 'SEM_OLEAGINOSAS'
  | 'SEM_FRUTOS_DO_MAR'
  | 'OUTROS';

export interface RestricaoInfo {
  label: string;
  descricao: string;
  icon: string;
}

export const RESTRICAO_INFO: Record<RestricaoKey, RestricaoInfo> = {
  VEGETARIANO: {
    label: 'Contém carne',
    descricao: 'Este produto contém carne vermelha, frango, porco ou outros tipos de carne animal. Não recomendado para vegetarianos.',
    icon: 'warning',
  },
  VEGANO: {
    label: 'Contém produtos animais',
    descricao: 'Este produto contém ingredientes de origem animal como leite, ovos, mel ou derivados. Não recomendado para veganos.',
    icon: 'warning',
  },
  SEM_ACUCAR: {
    label: 'Contém açúcar',
    descricao: 'Este produto contém açúcar ou adoçantes. Não recomendado para pessoas que seguem dietas sem açúcar ou com restrição de carboidratos.',
    icon: 'warning',
  },
  SEM_SODIO: {
    label: 'Contém sódio',
    descricao: 'Este produto contém sal ou sódio em sua composição. Não recomendado para pessoas com restrição de sódio ou hipertensão.',
    icon: 'warning',
  },
  CETOGENICO: {
    label: 'Não é cetogênico',
    descricao: 'Este produto não é adequado para dietas cetogênicas, pois contém carboidratos demais. Evite se está em dieta keto.',
    icon: 'warning',
  },
  SEM_GLUTEN: {
    label: 'Contém glúten',
    descricao: 'Este produto foi processado ou contém trigo, cevada, centeio ou outros cereais com glúten. Não recomendado para celíacos ou com sensibilidade ao glúten.',
    icon: 'warning',
  },
  SEM_LACTOSE: {
    label: 'Contém lactose',
    descricao: 'Este produto contém leite ou derivados. Não recomendado para pessoas intolerantes a lactose ou alérgicas a leite de vaca.',
    icon: 'warning',
  },
  APLV: {
    label: 'Contém APLV',
    descricao: 'Este produto contém Alergia a Proteína do Leite de Vaca (APLV). Prejudicial para pessoas com alergia a leite de vaca.',
    icon: 'warning',
  },
  SEM_OLEAGINOSAS: {
    label: 'Contém oleaginosas',
    descricao: 'Este produto contém castanhas, amendoim, noz ou outras oleaginosas. Não recomendado para pessoas com alergia a frutos secos.',
    icon: 'warning',
  },
  SEM_FRUTOS_DO_MAR: {
    label: 'Contém frutos do mar',
    descricao: 'Este produto contém peixes, mariscos, frutos do mar ou seus derivados. Não recomendado para alérgicos a frutos do mar.',
    icon: 'warning',
  },
  OUTROS: {
    label: 'Outras restrições',
    descricao: 'Este produto possui restrições específicas. Consulte os ingredientes para mais informações.',
    icon: 'warning',
  },
};