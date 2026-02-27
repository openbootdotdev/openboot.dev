/**
 * Package metadata with descriptions for all preset packages
 * Based on real-world developer configurations and official package descriptions
 */

export interface PackageMetadata {
	name: string;
	description: string;
	category: 'essential' | 'development' | 'productivity' | 'optional';
	type: 'cli' | 'gui' | 'language' | 'devops' | 'database';
}

export const PACKAGE_METADATA: Record<string, PackageMetadata> = {
	// Essential CLI Tools
	curl: {
		name: 'curl',
		description: 'Transfer data with URLs - HTTP, FTP, and more',
		category: 'essential',
		type: 'cli'
	},
	wget: {
		name: 'wget',
		description: 'Download files from the web non-interactively',
		category: 'essential',
		type: 'cli'
	},
	jq: {
		name: 'jq',
		description: 'JSON processor for command line - query and transform JSON',
		category: 'essential',
		type: 'cli'
	},
	yq: {
		name: 'yq',
		description: 'YAML processor - jq for YAML files',
		category: 'essential',
		type: 'cli'
	},
	ripgrep: {
		name: 'ripgrep',
		description: 'Lightning-fast code search (modern grep replacement)',
		category: 'essential',
		type: 'cli'
	},
	fd: {
		name: 'fd',
		description: 'Fast and user-friendly alternative to find',
		category: 'essential',
		type: 'cli'
	},
	bat: {
		name: 'bat',
		description: 'Cat with syntax highlighting and Git integration',
		category: 'essential',
		type: 'cli'
	},
	eza: {
		name: 'eza',
		description: 'Modern replacement for ls with colors and Git status',
		category: 'essential',
		type: 'cli'
	},
	fzf: {
		name: 'fzf',
		description: 'Fuzzy finder for command-line - search anything',
		category: 'essential',
		type: 'cli'
	},
	zoxide: {
		name: 'zoxide',
		description: 'Smarter cd command that learns your habits',
		category: 'productivity',
		type: 'cli'
	},
	htop: {
		name: 'htop',
		description: 'Interactive process viewer - better than top',
		category: 'essential',
		type: 'cli'
	},
	btop: {
		name: 'btop',
		description: 'Resource monitor with beautiful UI and graphs',
		category: 'essential',
		type: 'cli'
	},
	tree: {
		name: 'tree',
		description: 'Display directory structure as a tree',
		category: 'essential',
		type: 'cli'
	},
	tealdeer: {
		name: 'tealdeer',
		description: 'Fast tldr client - simplified man pages',
		category: 'productivity',
		type: 'cli'
	},

	// Git Tools
	gh: {
		name: 'gh',
		description: 'GitHub CLI - manage PRs, issues, repos from terminal',
		category: 'essential',
		type: 'cli'
	},
	'git-delta': {
		name: 'git-delta',
		description: 'Syntax-highlighting pager for git diff output',
		category: 'development',
		type: 'cli'
	},
	'git-lfs': {
		name: 'git-lfs',
		description: 'Git extension for versioning large files',
		category: 'development',
		type: 'cli'
	},
	lazygit: {
		name: 'lazygit',
		description: 'Terminal UI for git - manage repos visually',
		category: 'productivity',
		type: 'cli'
	},
	tig: {
		name: 'tig',
		description: 'Text-mode interface for git - explore history',
		category: 'development',
		type: 'cli'
	},
	'pre-commit': {
		name: 'pre-commit',
		description: 'Framework for managing git pre-commit hooks',
		category: 'development',
		type: 'cli'
	},
	stow: {
		name: 'stow',
		description: 'Symlink manager for dotfiles deployment',
		category: 'essential',
		type: 'cli'
	},

	// Languages & Runtimes
	node: {
		name: 'node',
		description: 'JavaScript runtime built on V8 engine',
		category: 'essential',
		type: 'language'
	},
	go: {
		name: 'go',
		description: 'Fast, compiled language for building reliable software',
		category: 'essential',
		type: 'language'
	},
	python: {
		name: 'python',
		description: 'Interpreted, high-level programming language',
		category: 'essential',
		type: 'language'
	},
	rustup: {
		name: 'rustup',
		description: 'Rust toolchain installer and version manager',
		category: 'essential',
		type: 'language'
	},
	deno: {
		name: 'deno',
		description: 'Secure TypeScript/JavaScript runtime by Node creator',
		category: 'optional',
		type: 'language'
	},
	bun: {
		name: 'bun',
		description: 'Fast all-in-one JavaScript runtime and toolkit',
		category: 'optional',
		type: 'language'
	},

	// Package Managers
	pnpm: {
		name: 'pnpm',
		description: 'Fast, disk space efficient package manager',
		category: 'development',
		type: 'cli'
	},
	uv: {
		name: 'uv',
		description: 'Extremely fast Python package installer (Rust-based)',
		category: 'development',
		type: 'cli'
	},

	// DevOps & Containers
	docker: {
		name: 'docker',
		description: 'Platform for building and running containers',
		category: 'essential',
		type: 'devops'
	},
	'docker-compose': {
		name: 'docker-compose',
		description: 'Define and run multi-container applications',
		category: 'development',
		type: 'devops'
	},
	lazydocker: {
		name: 'lazydocker',
		description: 'Terminal UI for Docker and Docker Compose',
		category: 'productivity',
		type: 'devops'
	},
	dive: {
		name: 'dive',
		description: 'Tool for exploring Docker image layers',
		category: 'development',
		type: 'devops'
	},
	kubectl: {
		name: 'kubectl',
		description: 'Kubernetes command-line tool',
		category: 'essential',
		type: 'devops'
	},
	helm: {
		name: 'helm',
		description: 'Kubernetes package manager',
		category: 'development',
		type: 'devops'
	},
	k9s: {
		name: 'k9s',
		description: 'Terminal UI to manage Kubernetes clusters',
		category: 'productivity',
		type: 'devops'
	},
	terraform: {
		name: 'terraform',
		description: 'Infrastructure as Code tool for cloud provisioning',
		category: 'essential',
		type: 'devops'
	},
	awscli: {
		name: 'awscli',
		description: 'Universal command line interface for AWS',
		category: 'development',
		type: 'devops'
	},

	// Databases
	sqlite: {
		name: 'sqlite',
		description: 'Lightweight embedded SQL database',
		category: 'development',
		type: 'database'
	},
	postgresql: {
		name: 'postgresql',
		description: 'Advanced open-source relational database',
		category: 'essential',
		type: 'database'
	},
	redis: {
		name: 'redis',
		description: 'In-memory data structure store (cache, queue, pub/sub)',
		category: 'development',
		type: 'database'
	},
	duckdb: {
		name: 'duckdb',
		description: 'Fast in-process analytical SQL database',
		category: 'optional',
		type: 'database'
	},

	// AI & ML
	ollama: {
		name: 'ollama',
		description: 'Run large language models locally',
		category: 'optional',
		type: 'cli'
	},
	llm: {
		name: 'llm',
		description: 'CLI for interacting with LLMs (OpenAI, Claude, etc)',
		category: 'optional',
		type: 'cli'
	},

	// Development Tools
	tmux: {
		name: 'tmux',
		description: 'Terminal multiplexer - multiple sessions in one window',
		category: 'productivity',
		type: 'cli'
	},
	neovim: {
		name: 'neovim',
		description: 'Hyperextensible Vim-based text editor',
		category: 'optional',
		type: 'cli'
	},
	httpie: {
		name: 'httpie',
		description: 'User-friendly HTTP client for testing APIs',
		category: 'development',
		type: 'cli'
	},
	cmake: {
		name: 'cmake',
		description: 'Cross-platform build system generator',
		category: 'development',
		type: 'cli'
	},

	// GUI Applications
	warp: {
		name: 'warp',
		description: 'Modern terminal with AI and collaborative features',
		category: 'productivity',
		type: 'gui'
	},
	raycast: {
		name: 'raycast',
		description: 'Blazingly fast launcher with extensions',
		category: 'productivity',
		type: 'gui'
	},
	maccy: {
		name: 'maccy',
		description: 'Lightweight clipboard manager',
		category: 'productivity',
		type: 'gui'
	},
	stats: {
		name: 'stats',
		description: 'macOS system monitor in menu bar',
		category: 'productivity',
		type: 'gui'
	},
	'scroll-reverser': {
		name: 'scroll-reverser',
		description: 'Reverse scroll direction for mouse or trackpad',
		category: 'productivity',
		type: 'gui'
	},
	rectangle: {
		name: 'rectangle',
		description: 'Window manager using keyboard shortcuts',
		category: 'productivity',
		type: 'gui'
	},
	'visual-studio-code': {
		name: 'visual-studio-code',
		description: 'Code editor with extensions and debugging',
		category: 'essential',
		type: 'gui'
	},
	cursor: {
		name: 'cursor',
		description: 'AI-powered code editor built on VS Code',
		category: 'optional',
		type: 'gui'
	},
	orbstack: {
		name: 'orbstack',
		description: 'Fast, light alternative to Docker Desktop',
		category: 'essential',
		type: 'gui'
	},
	ngrok: {
		name: 'ngrok',
		description: 'Expose local servers to the internet securely',
		category: 'development',
		type: 'gui'
	},
	'google-chrome': {
		name: 'google-chrome',
		description: 'Fast, secure web browser by Google',
		category: 'essential',
		type: 'gui'
	},
	arc: {
		name: 'arc',
		description: 'Browser with spaces, tabs, and productivity features',
		category: 'productivity',
		type: 'gui'
	},
	firefox: {
		name: 'firefox',
		description: 'Privacy-focused web browser',
		category: 'optional',
		type: 'gui'
	},
	postman: {
		name: 'postman',
		description: 'API platform for testing and documentation',
		category: 'development',
		type: 'gui'
	},
	proxyman: {
		name: 'proxyman',
		description: 'Web debugging proxy for macOS',
		category: 'development',
		type: 'gui'
	},
	tableplus: {
		name: 'tableplus',
		description: 'Modern database GUI for multiple engines',
		category: 'development',
		type: 'gui'
	},
	notion: {
		name: 'notion',
		description: 'All-in-one workspace for notes and docs',
		category: 'productivity',
		type: 'gui'
	},
	obsidian: {
		name: 'obsidian',
		description: 'Markdown-based knowledge base and note-taking',
		category: 'optional',
		type: 'gui'
	},
	figma: {
		name: 'figma',
		description: 'Collaborative design and prototyping tool',
		category: 'optional',
		type: 'gui'
	},
	iina: {
		name: 'iina',
		description: 'Modern media player for macOS',
		category: 'optional',
		type: 'gui'
	},
	keka: {
		name: 'keka',
		description: 'File archiver for macOS',
		category: 'productivity',
		type: 'gui'
	},
	aldente: {
		name: 'aldente',
		description: 'Battery charge limiter to extend lifespan',
		category: 'optional',
		type: 'gui'
	},
	appcleaner: {
		name: 'appcleaner',
		description: 'Uninstaller that removes all app files',
		category: 'productivity',
		type: 'gui'
	},
	shottr: {
		name: 'shottr',
		description: 'Screenshot tool with annotation',
		category: 'productivity',
		type: 'gui'
	},
	miniconda: {
		name: 'miniconda',
		description: 'Minimal conda installer for Python environments',
		category: 'optional',
		type: 'gui'
	},

	// Additional Languages
	zig: {
		name: 'zig',
		description: 'Systems programming language with manual memory management',
		category: 'optional',
		type: 'language'
	},
	elixir: {
		name: 'elixir',
		description: 'Functional programming language for scalable applications',
		category: 'optional',
		type: 'language'
	},

	// Additional DevOps
	argocd: {
		name: 'argocd',
		description: 'GitOps continuous delivery tool for Kubernetes',
		category: 'optional',
		type: 'devops'
	},

	// Additional Database Tools
	mysql: {
		name: 'mysql',
		description: 'Popular open-source relational database client',
		category: 'development',
		type: 'database'
	},
	datagrip: {
		name: 'datagrip',
		description: 'JetBrains database IDE for multiple engines',
		category: 'optional',
		type: 'gui'
	},
	pgadmin4: {
		name: 'pgadmin4',
		description: 'PostgreSQL administration and management GUI',
		category: 'optional',
		type: 'gui'
	},

	// Additional Editors & Terminals
	zed: {
		name: 'zed',
		description: 'High-performance code editor built in Rust',
		category: 'optional',
		type: 'gui'
	},
	'sublime-text': {
		name: 'sublime-text',
		description: 'Lightweight and fast text editor',
		category: 'optional',
		type: 'gui'
	},
	webstorm: {
		name: 'webstorm',
		description: 'JetBrains IDE for JavaScript and TypeScript',
		category: 'optional',
		type: 'gui'
	},
	iterm2: {
		name: 'iterm2',
		description: 'Feature-rich terminal emulator for macOS',
		category: 'optional',
		type: 'gui'
	},
	alacritty: {
		name: 'alacritty',
		description: 'GPU-accelerated cross-platform terminal emulator',
		category: 'optional',
		type: 'gui'
	},
	kitty: {
		name: 'kitty',
		description: 'GPU-based terminal emulator with advanced features',
		category: 'optional',
		type: 'gui'
	},
	ghostty: {
		name: 'ghostty',
		description: 'Fast native terminal emulator',
		category: 'optional',
		type: 'gui'
	},

	// Additional Browsers
	'microsoft-edge': {
		name: 'microsoft-edge',
		description: 'Chromium-based web browser by Microsoft',
		category: 'optional',
		type: 'gui'
	},
	'brave-browser': {
		name: 'brave-browser',
		description: 'Privacy-focused web browser with ad blocking',
		category: 'optional',
		type: 'gui'
	},

	// Additional Productivity & Communication
	slack: {
		name: 'slack',
		description: 'Team communication and collaboration platform',
		category: 'productivity',
		type: 'gui'
	},
	discord: {
		name: 'discord',
		description: 'Community chat platform for voice and text',
		category: 'optional',
		type: 'gui'
	},
	telegram: {
		name: 'telegram',
		description: 'Fast and secure messaging app',
		category: 'optional',
		type: 'gui'
	},
	sketch: {
		name: 'sketch',
		description: 'Vector design tool for macOS',
		category: 'optional',
		type: 'gui'
	},
	imageoptim: {
		name: 'imageoptim',
		description: 'Image compression and optimization tool',
		category: 'productivity',
		type: 'gui'
	},

	// NPM Packages
	typescript: {
		name: 'typescript',
		description: 'Typed superset of JavaScript',
		category: 'essential',
		type: 'language'
	},
	tsx: {
		name: 'tsx',
		description: 'Execute TypeScript files directly (like ts-node)',
		category: 'development',
		type: 'cli'
	},
	eslint: {
		name: 'eslint',
		description: 'Linter for JavaScript and TypeScript',
		category: 'development',
		type: 'cli'
	},
	prettier: {
		name: 'prettier',
		description: 'Opinionated code formatter',
		category: 'development',
		type: 'cli'
	},
	nodemon: {
		name: 'nodemon',
		description: 'Auto-restart Node apps on file changes',
		category: 'development',
		type: 'cli'
	},
	pm2: {
		name: 'pm2',
		description: 'Production process manager for Node.js',
		category: 'development',
		type: 'cli'
	},
	serve: {
		name: 'serve',
		description: 'Static file serving and directory listing',
		category: 'development',
		type: 'cli'
	},
	vercel: {
		name: 'vercel',
		description: 'Deploy to Vercel from the command line',
		category: 'development',
		type: 'cli'
	},
	wrangler: {
		name: 'wrangler',
		description: 'CLI for Cloudflare Workers development',
		category: 'development',
		type: 'cli'
	},
	'firebase-tools': {
		name: 'firebase-tools',
		description: 'Firebase CLI for managing and deploying projects',
		category: 'development',
		type: 'cli'
	},
	'@angular/cli': {
		name: '@angular/cli',
		description: 'Angular framework command-line interface',
		category: 'development',
		type: 'cli'
	},
	'create-react-app': {
		name: 'create-react-app',
		description: 'Create React applications with zero configuration',
		category: 'development',
		type: 'cli'
	},
	degit: {
		name: 'degit',
		description: 'Scaffold projects from git repositories',
		category: 'development',
		type: 'cli'
	},
	np: {
		name: 'np',
		description: 'Better npm publish with version management',
		category: 'development',
		type: 'cli'
	},
	'npm-check-updates': {
		name: 'npm-check-updates',
		description: 'Update package.json dependency versions',
		category: 'development',
		type: 'cli'
	}
};

/**
 * Get metadata for a package, with fallback to basic info
 */
export function getPackageMetadata(packageName: string): PackageMetadata {
	return (
		PACKAGE_METADATA[packageName] || {
			name: packageName,
			description: packageName,
			category: 'optional',
			type: 'cli'
		}
	);
}

/**
 * Get description for a package
 */
export function getPackageDescription(packageName: string): string {
	return getPackageMetadata(packageName).description;
}
