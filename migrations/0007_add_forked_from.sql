-- Track fork attribution: stores config_id of the original config that was forked
ALTER TABLE configs ADD COLUMN forked_from TEXT;
