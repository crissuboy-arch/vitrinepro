export interface CatalogCores {
  principal: string
  secundaria: string
  titulos: string
  precos: string
  fundo: string
}

export interface CatalogCapa {
  logo?: string
  nome: string
  categoria: string
  cidade: string
  slogan?: string
  imagem?: string
}

export interface CatalogPagina {
  id: string
  imagem?: string
  titulo: string
  descricao?: string
  preco?: string
  destaque: boolean
}

export type CatalogModelo = 'elegante' | 'moderno' | 'luxo' | 'minimalista'

export interface Catalog {
  id?: string
  business_id: string
  user_id?: string
  nome: string
  modelo: CatalogModelo
  cores: CatalogCores
  capa: CatalogCapa
  paginas: CatalogPagina[]
  slug?: string
  publico: boolean
}
