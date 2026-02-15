-- Migration: Update openboot user avatar to GitHub organization avatar

UPDATE users 
SET avatar_url = 'https://avatars.githubusercontent.com/u/258731499?v=4'
WHERE username = 'openboot';
