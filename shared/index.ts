// ─── Usuário ────────────────────────────────────────────────────────────────

export interface Usuario {
    id: string;
    nome: string;
    email: string;
    idade: number;
    /** Texto gerado e atualizado pela IA — "memória" comportamental do cliente */
    etiqueta?: string;
}

// ─── Produto ────────────────────────────────────────────────────────────────
    
export type Restricao =
    | 'VEGETARIANO'       // Sem carne
    | 'VEGANO'            // Sem produtos de origem animal
    | 'SEM_ACUCAR'        // Diet
    | 'SEM_SODIO'         // Low Carb / Hipertensos
    | 'CETOGENICO'        // Dieta cetogênica (baixo carboidrato)
    | 'SEM_GLUTEN'        // Celíacos / Intolerantes
    | 'SEM_LACTOSE'       // Derivados do leite
    | 'APLV'              // Alergia à Proteína do Leite de Vaca
    | 'SEM_OLEAGINOSAS'   // Amendoim, nozes, castanhas
    | 'SEM_FRUTOS_DO_MAR' // Camarão, lagosta, etc.
    | 'OUTROS';

export type Categoria =
    | 'PRATO_PRINCIPAL'
    | 'ACOMPANHAMENTOS'
    | 'BEBIDAS'
    | 'SOBREMESA'
    | 'OUTROS';

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

// ─── Pedido ─────────────────────────────────────────────────────────────────

export interface PedidoProduto {
    produto: Produto;
    preco: number;
    quantidade: number;
}

export interface Pedido {
    id: number;
    usuarioId: number;
    produtos: PedidoProduto[];
    horario: string;
    preco_total: number;
    criado_em: string;
}
