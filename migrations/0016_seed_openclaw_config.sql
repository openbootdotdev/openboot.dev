-- Remove all seed configs with fake install counts (real downloads = 0)
DELETE FROM configs WHERE id IN (
  'ob-seed-react-frontend',
  'ob-seed-vue-frontend',
  'ob-seed-go-backend',
  'ob-seed-python-backend',
  'ob-seed-nodejs-backend',
  'ob-seed-java-spring',
  'ob-seed-rust-backend',
  'ob-seed-rails-backend',
  'ob-seed-t3-fullstack',
  'ob-seed-ios-developer',
  'ob-seed-android-dev',
  'ob-seed-devops-sre',
  'ob-seed-platform-eng',
  'ob-seed-data-science',
  'ob-seed-security-eng',
  'ob-seed-unity-gamedev',
  'ob-seed-web3-dev',
  'ob-seed-design-dev',
  'ob-seed-starter-kit',
  'ob-seed-tech-writer'
);

-- Add OpenClaw one-click install config
INSERT INTO configs (id, user_id, slug, name, description, base_preset, packages, custom_script, visibility, alias, dotfiles_repo, install_count, featured)
VALUES (
  'ob-seed-openclaw',
  'google_102596069106824335469',
  'openclaw',
  'OpenClaw — AI Assistant',
  'One-click setup for OpenClaw (ClawdBot) — a personal AI assistant gateway that connects Claude, GPT, Gemini and more to Telegram, Discord, WhatsApp, Slack, WeChat, and iMessage.',
  'minimal',
  '[{"name":"node","type":"formula","desc":"JavaScript runtime (v22 recommended)"},{"name":"git","type":"formula","desc":"Version control"},{"name":"curl","type":"formula","desc":"HTTP transfer tool"},{"name":"wget","type":"formula","desc":"File downloader"},{"name":"jq","type":"formula","desc":"JSON processor"},{"name":"openclaw","type":"npm","desc":"Personal AI assistant gateway"}]',
  '',
  'public',
  'openclaw',
  '',
  0,
  1
);
