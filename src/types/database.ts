/**
 * PLACEHOLDER — this file will be replaced in Phase 4 with types generated
 * directly from the real Postgres schema via:
 *
 *   supabase gen types typescript --project-id <your-project-ref> > src/types/database.ts
 *
 * Keeping a minimal shape here for now so the app compiles before migrations exist.
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
