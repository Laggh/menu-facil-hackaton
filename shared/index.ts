import {z} from "zod";

// ─── Usuário ────────────────────────────────────────────────────────────────

export interface Usuario {
    id: string;
    nome: string;
    email: string;
    idade: number;
    /** Texto gerado e atualizado pela IA — "memória" comportamental do cliente */
    etiqueta?: string;
}
export const UsuarioSchema = z.object({
    id: z.string(),
    nome: z.string(),
    email: z.string().email(),
    idade: z.number().int().positive(),
    etiqueta: z.string().optional(),
});

// ─── Produto ────────────────────────────────────────────────────────────────

export const RestricaoArray = [
    'VEGETARIANO',
    'VEGANO',
    'SEM_ACUCAR',
    'SEM_SODIO',
    'CETOGENICO',
    'SEM_GLUTEN',
    'SEM_LACTOSE',
    'APLV',
    'SEM_OLEAGINOSAS',
    'SEM_FRUTOS_DO_MAR',
    'OUTROS',
] as const;

export const RestricaoSchema = z.enum(RestricaoArray);
export type Restricao = typeof RestricaoArray[number];

export interface RestricaoInfo {
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
};

export type Categoria =
    | 'PRATO_PRINCIPAL'
    | 'ACOMPANHAMENTOS'
    | 'BEBIDAS'
    | 'SOBREMESA'
    | 'OUTROS';

export const CategoriaSchema = z.enum([
    'PRATO_PRINCIPAL',
    'ACOMPANHAMENTOS',
    'BEBIDAS',
    'SOBREMESA',
    'OUTROS',
]);

export interface Produto {
    id: number;
    nome: string;
    definicao: string; //Definição do produto, usada para gerar a descrição
    descricao: string;
    preco: number;
    categoria: Categoria;
    imagem_url: string;
    ingredientes: string[];
    restricoes: Restricao[];
}

export const ProdutoSchema = z.object({
    id: z.number().int().positive(),
    nome: z.string(),
    definicao: z.string(),
    descricao: z.string(),
    preco: z.number().positive(),
    categoria: CategoriaSchema,
    imagem_url: z.string().url(),
    ingredientes: z.array(z.string()),
    restricoes: z.array(RestricaoSchema),
});

// ─── Pedido ─────────────────────────────────────────────────────────────────

export type StatusPedido = 'PENDENTE' | 'COMPLETO' | 'CANCELADO';

export interface PedidoProduto {
    produto: Produto;
    preco: number;
    quantidade: number;
    observacao?: string; // Campo opcional para observações específicas sobre o item no pedido
}

export const PedidoProdutoSchema = z.object({
    produto: ProdutoSchema,
    preco: z.number().positive(),
    quantidade: z.number().int().positive(),
    observacao: z.string().optional(),
});

export interface Pedido {
    id: string;
    usuarioId: string;
    produtos: PedidoProduto[];
    status: StatusPedido;
    horario: string;
    preco_total: number;
    criado_em: string;
    completado_em?: string;
}

export const PedidoSchema = z.object({
    id: z.string(),
    usuarioId: z.string(),
    produtos: z.array(PedidoProdutoSchema),
    status: z.enum(['PENDENTE', 'COMPLETO', 'CANCELADO']),
    horario: z.string(),
    preco_total: z.number().positive(),
    criado_em: z.string(),
    completado_em: z.string().optional(),
});

// ─── Logs ───────────────────────────────────────────────────────────────
export interface GeminiLog {
    prompt: string;
    timeMs: number;
    response: string;
    model: string;
}

export const GeminiLogSchema = z.object({
    prompt: z.string(),
    timeMs: z.number(),
    response: z.string(),
    model: z.string(),
});

