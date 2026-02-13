-- Step 1: Update real user's username to 'openboot'
UPDATE users 
SET username = 'openboot'
WHERE id = 'google_102596069106824335469';

-- Step 2: Transfer all configs to real user
UPDATE configs
SET user_id = 'google_102596069106824335469'
WHERE user_id = 'openboot-official';

-- Step 3: Delete the fake user
DELETE FROM users WHERE id = 'openboot-official';
