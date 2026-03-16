const fs = require('fs');

let file = fs.readFileSync('shared/index.ts', 'utf8');

const replacement = "export interface RestricaoInfo {
  label: string;
  descricao: string;
  exemplos?: string;
  icon: string;
}

export const RESTRICAO_INFO: Record<Restricao, RestricaoInfo> = {
  VEGETARIANO: {
    label: 'Contém carne',
    descricao: 'Este produto contém carne vermelha, frango, porco ou outros tipos de carne animal. Não recomendado para vegetarianos.',
    exemplos: 'Ex: Carnes vermelhas, frango, porco, peixe, bacon, etc.',
    icon: 'warning',
  },
  VEGANO: {
    label: 'Contém produtos animais',
    descricao: 'Este produto contém ingredientes de origem animal como leite, ovos, mel ou derivados. Não recomendado para veganos.',
    exemplos: 'Ex: Leite, ovos, mel, manteiga, queijo, banha, gelatina.',
    icon: 'warning',
  },
  SEM_ACUCAR: {
    label: 'Contém açúcar',
    descricao: 'Este produto contém açúcar ou adoçantes. Não recomendado para pessoas que seguem dietas sem açúcar ou com restrição de carboidratos.',
    exemplos: 'Ex: Açúcar branco, mascavo, mel, melaço, adoçantes.',
    icon: 'warning',
  },
  SEM_SODIO: {
    label: 'Contém sódio',
    descricao: 'Este produto contém sal ou sódio em sua composição. Não recomendado para pessoas com restrição de sódio ou hipertensão.',
    exemplos: 'Ex: Sal refinado, shoyu, caldos prontos, conservas, embutidos.',
    icon: 'warning',
  },
  CETOGENICO: {
    label: 'Não é cetogênico',
    descricao: 'Este produto não é adequado para dietas cetogênicas, pois contém carboidratos demais. Evite se está em dieta keto.',
    exemplos: 'Ex: Pães, massas, arroz, batata, doces, refrigerantes.',
    icon: 'warning',
  },
  SEM_GLUTEN: {
    label: 'Contém glúten',
    descricao: 'Este produto foi processado ou contém trigo, cevada, centeio ou outros cereais com glúten. Não recomendado para celíacos ou com sensibilidade ao glúten.',
    exemplos: 'Ex: Trigo, centeio, cevada, aveia, malte, pães, massas.',
    icon: 'warning',
  },
  SEM_LACTOSE: {
    label: 'Contém lactose',
    descricao: 'Este produto contém leite ou derivados. Não recomendado para pessoas intolerantes a lactose ou alérgicas a leite de vaca.',
    exemplos: 'Ex: Leite de vaca, queijos, manteiga, creme, iogurte.',
    icon: 'warning',
  },
  APLV: {
    label: 'Contém APLV',
    descricao: 'Este produto contém Alergia a Proteína do Leite de Vaca (APLV). Prejudicial para pessoas com alergia a leite de vaca.',
    exemplos: 'Ex: Leite de vaca, caseína, soro do leite (whey), traços.',
    icon: 'warning',
  },
  SEM_OLEAGINOSAS: {
    label: 'Contém oleaginosas',
    descricao: 'Este produto contém castanhas, amendoim, noz ou outras oleaginosas. Não recomendado para pessoas com alergia a frutos secos.',
    exemplos: 'Ex: Amendoim, nozes, avelãs, pistache, castanha-de-caju.',
    icon: 'warning',
  },
  SEM_FRUTOS_DO_MAR: {
    label: 'Contém frutos do mar',
    descricao: 'Este produto contém peixes, mariscos, frutos do mar ou seus derivados. Não recomendado para alérgicos a frutos do mar.',
    exemplos: 'Ex: Camarão, ostra, lula, polvo, lagosta, caranguejo.',
    icon: 'warning',
  },
  OUTROS: {
    label: 'Outras restrições',
    descricao: 'Este produto possui restrições específicas. Consulte os ingredientes para mais informações.',
    exemplos: 'Ex: Corantes, conservantes, soja, alho, milho, etc.',
    icon: 'warning',
  },
};\n"

const startIndex = file.indexOf('export interface RestricaoInfo {');
const endIndexStr = 'OUTROS: {';
const midIndex = file.indexOf(endIndexStr);
const endIndex = file.indexOf('},', midIndex) + 3;

if (startIndex !== -1 && endIndex !== -1) {
  const finalFile = file.substring(0, startIndex) + replacement.substring(1, replacement.length - 1) + file.substring(endIndex + 1);
  fs.writeFileSync('shared/index.ts', finalFile);
} else {
  console.log('Not found bounds');
}
