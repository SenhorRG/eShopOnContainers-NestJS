/** AI embedding port; embedding dimension matches Postgres `vector(384)`. */
export const ESHOP_EMBEDDING_DIMENSION = 384 as const;

export interface CatalogAiPort {
  readonly isEnabled: boolean;

  /** Returns embeddings truncated or padded to dimension 384. */
  embeddingForCatalogLine(name: string, description?: string | null): Promise<number[] | null>;

  embeddingForSearchText(text: string): Promise<number[] | null>;
}
