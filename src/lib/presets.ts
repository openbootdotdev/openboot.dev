export interface PresetPackages {
	cli: string[];
	cask: string[];
	npm?: string[];
}

export const PRESET_PACKAGES: Record<string, PresetPackages> = {
	minimal: {
		cli: [
			'curl',
			'wget',
			'jq',
			'yq',
			'ripgrep',
			'fd',
			'bat',
			'eza',
			'fzf',
			'zoxide',
			'htop',
			'btop',
			'tree',
			'tldr',
			'gh',
			'git-delta',
			'lazygit',
			'stow'
		],
		cask: ['warp', 'raycast', 'maccy', 'stats']
	},
	developer: {
		cli: [
			'curl',
			'wget',
			'jq',
			'yq',
			'ripgrep',
			'fd',
			'bat',
			'eza',
			'fzf',
			'zoxide',
			'htop',
			'btop',
			'tree',
			'tldr',
			'gh',
			'git-delta',
			'lazygit',
			'stow',
			'node',
			'go',
			'pnpm',
			'docker',
			'docker-compose',
			'tmux',
			'neovim',
			'httpie'
		],
		cask: [
			'warp',
			'raycast',
			'maccy',
			'stats',
			'scroll-reverser',
			'visual-studio-code',
			'orbstack',
			'google-chrome',
			'arc',
			'postman',
			'notion'
		],
		npm: ['typescript', 'tsx', 'eslint', 'prettier', 'nodemon']
	},
	full: {
		cli: [
			'curl',
			'wget',
			'jq',
			'yq',
			'ripgrep',
			'fd',
			'bat',
			'eza',
			'fzf',
			'zoxide',
			'htop',
			'btop',
			'tree',
			'tldr',
			'gh',
			'git-delta',
			'lazygit',
			'stow',
			'node',
			'go',
			'pnpm',
			'docker',
			'docker-compose',
			'tmux',
			'neovim',
			'httpie',
			'python',
			'uv',
			'rustup',
			'deno',
			'bun',
			'kubectl',
			'helm',
			'k9s',
			'terraform',
			'awscli',
			'sqlite',
			'postgresql',
			'redis',
			'duckdb',
			'ollama',
			'llm'
		],
		cask: [
			'warp',
			'raycast',
			'maccy',
			'stats',
			'scroll-reverser',
			'visual-studio-code',
			'cursor',
			'orbstack',
			'google-chrome',
			'arc',
			'firefox',
			'postman',
			'proxyman',
			'notion',
			'obsidian',
			'figma',
			'iina',
			'keka',
			'aldente',
			'rectangle'
		],
		npm: ['typescript', 'tsx', 'eslint', 'prettier', 'nodemon', 'pm2', 'serve', 'vercel', 'wrangler']
	}
};

export function getPresetPackages(preset: string): string[] {
	const p = PRESET_PACKAGES[preset];
	return p ? [...p.cli, ...p.cask, ...(p.npm || [])] : [];
}

export const PRESET_NAMES = ['minimal', 'developer', 'full'] as const;
export type PresetName = (typeof PRESET_NAMES)[number];
