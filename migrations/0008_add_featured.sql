-- Add featured flag to highlight curated configs on the explore page
ALTER TABLE configs ADD COLUMN featured INTEGER DEFAULT 0;
