<script lang="ts">
	let {
		show = $bindable(false),
		shareUrl,
		configName
	}: {
		show: boolean;
		shareUrl: string;
		configName: string;
	} = $props();

	let shareCopied = $state(false);

	function closeShareModal() {
		show = false;
	}

	function shareCopyLink() {
		navigator.clipboard.writeText(shareUrl);
		shareCopied = true;
		setTimeout(() => (shareCopied = false), 2000);
	}

	function shareOnTwitter() {
		const text = `My dev stack: ${configName} — set up in minutes with @openbootdotdev`;
		const hashtags = 'OpenBoot,macOS,DevTools';
		const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=${encodeURIComponent(hashtags)}`;
		window.open(tweetUrl, '_blank', 'width=550,height=420');
	}
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && show) closeShareModal(); }} />

{#if show}
	<div class="share-overlay" onclick={closeShareModal} onkeydown={(e) => e.key === 'Escape' && closeShareModal()} role="dialog" tabindex="0">
		<div class="share-modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="presentation">
			<div class="share-modal-header">
				<h3 class="share-modal-title">Share Configuration</h3>
				<button class="share-close-btn" onclick={closeShareModal} aria-label="Close share modal">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				</button>
			</div>
			<div class="share-modal-body">
				<div class="share-url-display">
					<code>{shareUrl}</code>
				</div>

				<div class="share-options">
					<button class="share-option" onclick={shareCopyLink}>
						<span class="share-option-icon">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
						</span>
						<span class="share-option-label">{shareCopied ? 'Copied!' : 'Copy Link'}</span>
					</button>

					<button class="share-option" onclick={shareOnTwitter}>
						<span class="share-option-icon">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
						</span>
						<span class="share-option-label">Share on X</span>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.share-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 20px;
		animation: fadeIn 0.2s;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.share-modal {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		width: 100%;
		max-width: 480px;
		overflow: hidden;
		animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.share-modal-header {
		padding: 24px;
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.share-modal-title {
		font-size: 1.3rem;
		font-weight: 700;
		margin: 0;
		color: var(--text-primary);
	}

	.share-close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		padding: 4px;
		border-radius: 6px;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.share-close-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.share-modal-body {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.share-url-display {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 14px 18px;
	}

	.share-url-display code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--accent);
		word-break: break-all;
	}

	.share-options {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.share-option {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 18px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text-primary);
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.share-option:hover {
		border-color: var(--accent);
		background: var(--bg-secondary);
		transform: translateX(4px);
	}

	.share-option-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: var(--bg-secondary);
		border-radius: 8px;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.share-option:hover .share-option-icon {
		color: var(--accent);
	}

	.share-option-label {
		flex: 1;
	}
</style>
