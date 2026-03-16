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

-- Add OpenClaw AI assistant workstation config
INSERT INTO configs (id, user_id, slug, name, description, base_preset, packages, custom_script, visibility, alias, dotfiles_repo, install_count, featured)
VALUES (
  'ob-seed-openclaw',
  'google_102596069106824335469',
  'openclaw',
  'OpenClaw — AI Assistant',
  'Complete AI assistant workstation — OpenClaw gateway with local model serving via Ollama, secure remote access via Tailscale, and 20+ messaging channel support (Telegram, Discord, WhatsApp, Slack, WeChat, iMessage).',
  'minimal',
  '[{"name":"openclaw","type":"cask","desc":"AI assistant gateway desktop app"},{"name":"openclaw-cli","type":"formula","desc":"OpenClaw CLI and daemon"},{"name":"ollama","type":"formula","desc":"Local AI model server (llama3, mistral, codellama)"},{"name":"node","type":"formula","desc":"JavaScript runtime (v22+)"},{"name":"git","type":"formula","desc":"Version control"},{"name":"curl","type":"formula","desc":"HTTP transfer tool"},{"name":"wget","type":"formula","desc":"File downloader"},{"name":"jq","type":"formula","desc":"JSON processor"},{"name":"tailscale","type":"cask","desc":"Secure remote access to gateway"},{"name":"warp","type":"cask","desc":"Modern terminal for log monitoring"}]',
  '',
  'public',
  'openclaw',
  '',
  0,
  1
);
