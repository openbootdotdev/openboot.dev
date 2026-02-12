-- Add visibility column (public, unlisted, private) to replace is_public
ALTER TABLE configs ADD COLUMN visibility TEXT DEFAULT 'unlisted';

-- Migrate existing data: is_public=1 -> 'public', is_public=0 -> 'private'
UPDATE configs SET visibility = 'public' WHERE is_public = 1;
UPDATE configs SET visibility = 'private' WHERE is_public = 0;
UPDATE configs SET visibility = 'unlisted' WHERE is_public IS NULL;
