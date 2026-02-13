-- Step 1: Transfer all configs to real user (while fake user still exists)
UPDATE configs
SET user_id = 'google_102596069106824335469'
WHERE user_id = 'openboot-official';

-- Step 2: Delete the fake user (releases username constraint)
DELETE FROM users WHERE id = 'openboot-official';

-- Step 3: Update real user's username to 'openboot' (now safe - no conflict)
UPDATE users 
SET username = 'openboot'
WHERE id = 'google_102596069106824335469';
