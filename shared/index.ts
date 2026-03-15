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

export interface PedidoProduto {
    produto: Produto;
    preco: number;
    quantidade: number;
}

export const PedidoProdutoSchema = z.object({
    produto: ProdutoSchema,
    preco: z.number().positive(),
    quantidade: z.number().int().positive(),
});

export interface Pedido {
    id: number;
    usuarioId: number;
    produtos: PedidoProduto[];
    horario: string;
    preco_total: number;
    criado_em: string;
}

export const PedidoSchema = z.object({
    id: z.number().int().positive(),
    usuarioId: z.number().int().positive(),
    produtos: z.array(PedidoProdutoSchema),
    horario: z.string(),
    preco_total: z.number().positive(),
    criado_em: z.string(),
});
