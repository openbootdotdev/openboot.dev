<script lang="ts">
	import ConfigCard from '$lib/components/ConfigCard.svelte';
	import ConfigEditor from '$lib/components/ConfigEditor.svelte';

	let view = $state<'cards' | 'editor'>('cards');

	const mockConfigs = [
		{
			id: '1',
			slug: 'frontend-team',
			name: 'Frontend Team',
			description: 'Our standard frontend development stack with React, TypeScript and all the tooling',
			base_preset: 'developer',
			visibility: 'public',
			alias: 'fe',
			install_count: 142,
			updated_at: '2026-03-18 10:30:00',
			packages: [
				{ name: 'visual-studio-code', type: 'cask' },
				{ name: 'arc', type: 'cask' },
				{ name: 'figma', type: 'cask' },
				{ name: 'docker', type: 'cask' },
				{ name: 'slack', type: 'cask' },
				{ name: 'iterm2', type: 'cask' },
				{ name: 'raycast', type: 'cask' },
				{ name: 'notion', type: 'cask' },
				{ name: 'warp', type: 'cask' },
				{ name: 'linear-linear', type: 'cask' },
				{ name: 'git', type: 'formula' },
				{ name: 'node', type: 'formula' },
				{ name: 'pnpm', type: 'formula' },
				{ name: 'gh', type: 'formula' },
				{ name: 'fzf', type: 'formula' },
				{ name: 'ripgrep', type: 'formula' },
				{ name: 'jq', type: 'formula' },
				{ name: 'bat', type: 'formula' },
				{ name: 'eza', type: 'formula' },
				{ name: 'starship', type: 'formula' },
				{ name: 'zoxide', type: 'formula' },
				{ name: 'fd', type: 'formula' },
				{ name: 'httpie', type: 'formula' },
				{ name: 'typescript', type: 'npm' },
				{ name: 'eslint', type: 'npm' },
				{ name: 'prettier', type: 'npm' },
			],
		},
		{
			id: '2',
			slug: 'devops-infra',
			name: 'DevOps & Infrastructure',
			description: 'Kubernetes, Terraform, AWS tooling and monitoring',
			base_preset: 'full',
			visibility: 'unlisted',
			alias: null,
			install_count: 95,
			updated_at: '2026-03-15 14:00:00',
			packages: [
				{ name: 'docker', type: 'cask' },
				{ name: 'lens', type: 'cask' },
				{ name: 'visual-studio-code', type: 'cask' },
				{ name: 'terraform', type: 'formula' },
				{ name: 'kubectl', type: 'formula' },
				{ name: 'helm', type: 'formula' },
				{ name: 'awscli', type: 'formula' },
				{ name: 'k9s', type: 'formula' },
				{ name: 'kubectx', type: 'formula' },
				{ name: 'stern', type: 'formula' },
				{ name: 'jq', type: 'formula' },
				{ name: 'yq', type: 'formula' },
				{ name: 'git', type: 'formula' },
				{ name: 'gh', type: 'formula' },
				{ name: 'ansible', type: 'formula' },
				{ name: 'vault', type: 'formula' },
				{ name: 'prometheus', type: 'formula' },
				{ name: 'grafana', type: 'formula' },
			],
		},
		{
			id: '3',
			slug: 'minimal-writer',
			name: 'Writer Setup',
			description: 'Minimal writing and note-taking environment',
			base_preset: 'minimal',
			visibility: 'private',
			alias: null,
			install_count: 12,
			updated_at: '2026-03-10 09:00:00',
			packages: [
				{ name: 'obsidian', type: 'cask' },
				{ name: 'ia-writer', type: 'cask' },
				{ name: 'git', type: 'formula' },
				{ name: 'pandoc', type: 'formula' },
				{ name: 'vale', type: 'formula' },
			],
		},
		{
			id: '4',
			slug: 'mobile-ios',
			name: 'iOS Development',
			description: 'Swift, Xcode tooling, simulators and CI helpers',
			base_preset: 'developer',
			visibility: 'public',
			alias: 'ios',
			install_count: 67,
			updated_at: '2026-03-17 16:45:00',
			packages: [
				{ name: 'xcode', type: 'cask' },
				{ name: 'sf-symbols', type: 'cask' },
				{ name: 'proxyman', type: 'cask' },
				{ name: 'reveal', type: 'cask' },
				{ name: 'swiftformat', type: 'formula' },
				{ name: 'swiftlint', type: 'formula' },
				{ name: 'xcbeautify', type: 'formula' },
				{ name: 'fastlane', type: 'formula' },
				{ name: 'cocoapods', type: 'formula' },
				{ name: 'git', type: 'formula' },
				{ name: 'gh', type: 'formula' },
				{ name: 'mint', type: 'formula' },
				{ name: 'xcodegen', type: 'formula' },
				{ name: 'tuist', type: 'formula' },
			],
		},
	];

	function handleAction(action: string, slug: string) {
		if (action === 'edit') {
			view = 'editor';
		} else {
			alert(`Action: ${action} on ${slug}`);
		}
	}
</script>

<svelte:head>
	<title>UI Preview - OpenBoot</title>
</svelte:head>

{#if view === 'cards'}
	<main class="dashboard">
		<div class="page-header">
			<div>
				<h1 class="page-title">My Configurations</h1>
				<p class="page-stats">
					{mockConfigs.length} configs <span class="sep">&middot;</span> 316 installs
				</p>
			</div>
			<div class="header-actions">
				<button class="btn secondary" onclick={() => alert('Import Brewfile')}>Import Brewfile</button>
				<button class="btn primary" onclick={() => (view = 'editor')}>+ New Config</button>
			</div>
		</div>

		<div class="grid">
			{#each mockConfigs as config, i}
				<div class="card-wrap" style="animation-delay: {i * 50}ms">
					<ConfigCard {config} username="fullstackjam" onaction={handleAction} />
				</div>
			{/each}
		</div>

		<div class="mode-switcher">
			<button class="switch-btn" onclick={() => (view = 'editor')}>
				View Editor Page →
			</button>
		</div>
	</main>
{:else}
	<div class="editor-wrapper">
		<div class="mode-switcher top">
			<button class="switch-btn" onclick={() => (view = 'cards')}>
				← Back to Card Grid
			</button>
			<span class="preview-note">Editor preview (no login needed here)</span>
		</div>
		<ConfigEditor slug={undefined} skipAuth={true} />
	</div>
{/if}

<style>
	.dashboard {
		max-width: 1000px;
		margin: 0 auto;
		padding: 80px 24px 60px;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 36px;
	}

	.page-title {
		font-size: 1.6rem;
		font-weight: 700;
	}

	.page-stats {
		color: var(--text-muted);
		font-size: 0.88rem;
		margin-top: 4px;
		font-variant-numeric: tabular-nums;
	}

	.sep {
		margin: 0 4px;
	}

	.header-actions {
		display: flex;
		gap: 10px;
	}

	.btn {
		padding: 10px 18px;
		border-radius: 10px;
		font-size: 0.88rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn.secondary {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		color: var(--text-secondary);
	}

	.btn.secondary:hover {
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.btn.primary {
		background: var(--accent);
		border: none;
		color: #000;
	}

	.btn.primary:hover {
		background: var(--accent-hover);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}

	.card-wrap {
		animation: fadeUp 0.4s ease-out both;
	}

	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(12px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.mode-switcher {
		text-align: center;
		margin-top: 48px;
	}

	.mode-switcher.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 820px;
		margin: 0 auto;
		padding: 80px 24px 0;
	}

	.preview-note {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.switch-btn {
		padding: 12px 24px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--accent);
		font-size: 0.9rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s;
	}

	.switch-btn:hover {
		border-color: var(--accent);
		transform: translateY(-1px);
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 16px;
		}

		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
