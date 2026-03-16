const fs = require('fs');
let file = fs.readFileSync('shared/index.ts', 'utf8');

const regex = /export interface RestricaoInfo \{[\s\S]*?OUTROS: \{[\s\S]*?\},[\s\n\r]*\};/;

const replacement = `export interface RestricaoInfo {
  label: string;
  descricao: string;
  exemplos?: string;
  icon: string;
}

export const RESTRICAO_INFO: Record<Restricao, RestricaoInfo> = {
  VEGETARIANO: {
    label: 'Contém carne',
    descricao: 'Este produto contém carne vermelha, frango, porco ou outros tipos de carne animal.',
    exemplos: 'Ex: Carnes vermelhas, peixes, frango, porco, bacon...',
    icon: 'warning',
  },
  VEGANO: {
    label: 'Contém produtos animais',
    descricao: 'Este produto contém ingredientes de origem animal ou derivados.',
    exemplos: 'Ex: Leite, ovos, mel, manteiga, queijo, gelatina...',
    icon: 'warning',
  },
  SEM_ACUCAR: {
    label: 'Contém açúcar',
    descricao: 'Este produto contém açúcar ou adoçantes em sua formulação.',
    exemplos: 'Ex: Açúcar de cana, mel, melaço, adoçantes doces...',
    icon: 'warning',
  },
  SEM_SODIO: {
    label: 'Contém sódio',
    descricao: 'Este produto contém sal ou sódio em sua composição.',
    exemplos: 'Ex: Sal de cozinha, molho shoyu, caldos prontos, conservas...',
    icon: 'warning',
  },
  CETOGENICO: {
    label: 'Não é cetogênico',
    descricao: 'Este produto não é adequado para dietas cetogênicas, contendo carboidratos.',
    exemplos: 'Ex: Pães, massas, arroz, doces, batata, frutas...',
    icon: 'warning',
  },
  SEM_GLUTEN: {
    label: 'Contém glúten',
    descricao: 'Este produto foi processado ou contém cereais com glúten.',
    exemplos: 'Ex: Trigo, centeio, cevada, pães convencionais, massas, bolos...',
    icon: 'warning',
  },
  SEM_LACTOSE: {
    label: 'Contém lactose',
    descricao: 'Este produto contém leite de vaca ou muitos de seus derivados.',
    exemplos: 'Ex: Leite de vaca, queijos, manteiga, creme de leite, iogurte...',
    icon: 'warning',
  },
  APLV: {
    label: 'Contém APLV',
    descricao: 'Este produto contém Alergia a Proteína do Leite de Vaca (APLV).',
    exemplos: 'Ex: Proteína do soro (whey), caseína, traços de leite de vaca...',
    icon: 'warning',
  },
  SEM_OLEAGINOSAS: {
    label: 'Contém oleaginosas',
    descricao: 'Este produto contém castanhas e outras oleaginosas.',
    exemplos: 'Ex: Amendoim, nozes, avelãs, pistache, castanhas, amêndoas...',
    icon: 'warning',
  },
  SEM_FRUTOS_DO_MAR: {
    label: 'Contém frutos do mar',
    descricao: 'Este produto contém peixes, mariscos, frutos do mar ou derivados.',
    exemplos: 'Ex: Camarão, ostra, lula, polvo, lagosta, caranguejo...',
    icon: 'warning',
  },
  OUTROS: {
    label: 'Outras restrições',
    descricao: 'Este produto possui restrições específicas em seus ingredientes.',
    exemplos: 'Ex: Corantes específicos, conservantes artificiais, soja, milho...',
    icon: 'warning',
  },
};`;

file = file.replace(regex, replacement);
fs.writeFileSync('shared/index.ts', file);
