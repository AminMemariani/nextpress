-- ============================================================================
-- Full-text search: tsvector column + GIN index + auto-update trigger
-- ============================================================================
-- Run this AFTER prisma migrate deploys the searchVector column.
--
-- Why a trigger instead of application-level updates?
--   - Guaranteed consistency: every INSERT/UPDATE updates the vector
--   - No Prisma involvement: tsvector operations are pure SQL
--   - Handles edge cases: direct DB edits, bulk imports, migrations
--
-- The search vector combines title (weight A, highest) and excerpt (weight B).
-- Block content is NOT indexed here — it's JSONB and would need extraction.
-- For block content search, use the scalable approach (external index).
-- ============================================================================

-- 1. Add column if not exists (Prisma may have created it as NULL)
ALTER TABLE content_entries
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Populate existing rows
UPDATE content_entries SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(excerpt, '')), 'B');

-- 3. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_content_entries_search
  ON content_entries USING GIN (search_vector);

-- 4. Create trigger function to auto-update on INSERT/UPDATE
CREATE OR REPLACE FUNCTION content_entries_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.excerpt, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach trigger
DROP TRIGGER IF EXISTS trg_content_entries_search_vector ON content_entries;
CREATE TRIGGER trg_content_entries_search_vector
  BEFORE INSERT OR UPDATE OF title, excerpt
  ON content_entries
  FOR EACH ROW
  EXECUTE FUNCTION content_entries_search_vector_update();
