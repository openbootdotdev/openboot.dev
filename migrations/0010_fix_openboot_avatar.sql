-- Fix openboot user avatar URL (correcting migration 0009)

UPDATE users
SET avatar_url = 'https://avatars.githubusercontent.com/u/258731499?v=4'
WHERE id = 'openboot-official';
