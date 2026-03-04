

# Semantic Vector Search with pgvector

## Summary

Add pgvector-based semantic search to the Knowledge Base, replacing keyword ILIKE matching with embedding-based retrieval. Includes database schema changes, embedding generation during ingestion, updated RAG retrieval in both agent-dispatch and alex-chat, and a backfill function for existing chunks.

## Part A — Database Migration

Run a single migration that:
1. Enables the `vector` extension
2. Adds an `embedding vector(768)` column to `knowledge_chunks`
3. Creates an IVFFlat index on the embedding column
4. Creates the `match_knowledge_chunks` function (returns content, document_id, chunk_id, similarity filtered by tenant_id and threshold)

## Part B — Embedding Generation in knowledge-ingest

Update `supabase/functions/knowledge-ingest/index.ts`:

- Add a helper function `generateEmbedding(text: string): Promise<number[] | null>` that calls `https://ai.gateway.lovable.dev/v1/embeddings` with model `google/text-embedding-004`
- After inserting chunks (line ~227-233), iterate over the inserted chunk IDs and:
  1. Call `generateEmbedding(chunk.content)`
  2. If successful, `UPDATE knowledge_chunks SET embedding = $vector WHERE id = chunkId`
  3. If it fails, log the error and continue (chunk remains searchable via keyword fallback)
- To get chunk IDs, change the chunk insert to `.insert(chunks).select('id, content')` so we get the IDs back

## Part C — Update RAG Retrieval

### agent-dispatch (lines 216-236)

Replace the current ILIKE search block with:
1. Call `generateEmbedding(inputValues)` to get a query vector
2. If embedding succeeds, call `supabase.rpc('match_knowledge_chunks', { query_embedding: vector, match_tenant_id: tenantId, match_count: 5, similarity_threshold: 0.65 })`
3. If semantic search returns 3+ results, use those as grounding context
4. If fewer than 3 results (or embedding call failed), fall back to the existing ILIKE keyword search
5. Deduplicate by chunk content if both sources run

### alex-chat (lines 219-243)

Same pattern as agent-dispatch:
1. Generate embedding of the last user message content
2. Try semantic search via `match_knowledge_chunks` RPC
3. Fall back to ILIKE if insufficient results
4. Note: alex-chat doesn't have tenantId readily available — need to extract it from the knowledge_chunks query (the RLS handles it, but for the RPC we need to pass it). Will extract tenant from the auth header similar to agent-dispatch's pattern.

### Shared embedding helper

Both functions and knowledge-ingest need the same `generateEmbedding` function. Since Deno edge functions don't share code easily, the helper will be duplicated in each function (small, ~15 lines).

## Part D — Backfill Function

Create `supabase/functions/backfill-embeddings/index.ts`:
- Validates caller JWT, checks `user_profiles.role` is `super_admin`
- Accepts optional `{ tenant_id }` in body (super_admin can backfill any tenant)
- Queries up to 50 `knowledge_chunks` where `embedding IS NULL`
- For each, generates embedding and updates the row
- Returns `{ processed: number, remaining: number }`

Update `supabase/config.toml` to add:
```toml
[functions.backfill-embeddings]
verify_jwt = false
```

## Files Affected

| File | Action |
|---|---|
| Database migration | Create: enable vector, add column, index, RPC function |
| `supabase/functions/knowledge-ingest/index.ts` | Edit: add embedding generation after chunk insert |
| `supabase/functions/agent-dispatch/index.ts` | Edit: replace ILIKE with semantic search + fallback |
| `supabase/functions/alex-chat/index.ts` | Edit: replace ILIKE with semantic search + fallback |
| `supabase/functions/backfill-embeddings/index.ts` | Create: new edge function |
| `supabase/config.toml` | Edit: add backfill-embeddings config |

## Technical Notes

- The Lovable AI gateway supports embeddings at `https://ai.gateway.lovable.dev/v1/embeddings` with model `google/text-embedding-004` (768 dimensions)
- IVFFlat index with `lists = 100` is appropriate for the expected dataset size
- The `match_knowledge_chunks` function uses `SECURITY DEFINER` to bypass RLS while still filtering by tenant_id explicitly
- Backward compatibility is preserved: chunks without embeddings are still findable via keyword fallback

