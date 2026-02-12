import { describe, it, expect } from 'vitest';
import { generatePrivateInstallScript, generateInstallScript } from './install-script';

describe('generatePrivateInstallScript', () => {
	it('should generate private install script with sanitized username and slug', () => {
		const script = generatePrivateInstallScript(
			'https://openboot.dev',
			'testuser',
			'my-config'
		);

		expect(script).toContain('#!/bin/bash');
		expect(script).toContain('Private Config Install');
		expect(script).toContain('Config: @testuser/my-config');
		expect(script).toContain('APP_URL="https://openboot.dev"');
		expect(script).toContain('/api/auth/cli/start');
		expect(script).toContain('/api/auth/cli/poll');
		expect(script).toContain('/cli-auth?code=');
		expect(script).toContain('testuser/my-config/install');
	});

	it('should sanitize special characters from username', () => {
		const script = generatePrivateInstallScript(
			'https://openboot.dev',
			'user@evil.com',
			'config'
		);

		expect(script).toContain('@userevilcom/config');
		expect(script).not.toContain('@user@evil.com');
	});

	it('should sanitize special characters from slug', () => {
		const script = generatePrivateInstallScript(
			'https://openboot.dev',
			'testuser',
			'config; rm -rf /'
		);

		expect(script).toContain('testuser/configrm-rf');
		expect(script).not.toContain('config; rm -rf /');
	});

	it('should include browser opening commands', () => {
		const script = generatePrivateInstallScript(
			'https://openboot.dev',
			'testuser',
			'my-config'
		);

		expect(script).toContain('open "$AUTH_URL"');
		expect(script).toContain('xdg-open "$AUTH_URL"');
	});

	it('should include polling loop with timeout', () => {
		const script = generatePrivateInstallScript(
			'https://openboot.dev',
			'testuser',
			'my-config'
		);

		expect(script).toContain('for i in $(seq 1 60)');
		expect(script).toContain('sleep 2');
		expect(script).toContain('poll_status');
		expect(script).toContain('if [ "$poll_status" = "approved" ]');
	});

	it('should handle authorization timeout', () => {
		const script = generatePrivateInstallScript(
			'https://openboot.dev',
			'testuser',
			'my-config'
		);

		expect(script).toContain('Authorization timed out');
		expect(script).toContain('if [ -z "$TOKEN" ]');
	});

	it('should handle expired authorization', () => {
		const script = generatePrivateInstallScript(
			'https://openboot.dev',
			'testuser',
			'my-config'
		);

		expect(script).toContain('elif [ "$poll_status" = "expired" ]');
		expect(script).toContain('Authorization expired');
	});

	it('should execute final install with Bearer token', () => {
		const script = generatePrivateInstallScript(
			'https://openboot.dev',
			'testuser',
			'my-config'
		);

		expect(script).toContain('exec bash <(curl -fsSL -H "Authorization: Bearer $TOKEN"');
		expect(script).toContain('testuser/my-config/install');
	});
});

describe('generateInstallScript', () => {
	it('should generate basic install script without custom content', () => {
		const script = generateInstallScript('testuser', 'my-config', '', '');

		expect(script).toContain('#!/bin/bash');
		expect(script).toContain('OpenBoot - Custom Install');
		expect(script).toContain('Config: @testuser/my-config');
		expect(script).toContain('openboot-darwin-${ARCH}');
		expect(script).toContain('--user "testuser/my-config"');
	});

	it('should include Xcode CLT installation', () => {
		const script = generateInstallScript('testuser', 'my-config', '', '');

		expect(script).toContain('install_xcode_clt()');
		expect(script).toContain('xcode-select -p');
		expect(script).toContain('xcode-select --install');
	});

	it('should include Homebrew installation', () => {
		const script = generateInstallScript('testuser', 'my-config', '', '');

		expect(script).toContain('install_homebrew()');
		expect(script).toContain('command -v brew');
		expect(script).toContain('Homebrew/install/HEAD/install.sh');
	});

	it('should handle ARM64 architecture', () => {
		const script = generateInstallScript('testuser', 'my-config', '', '');

		expect(script).toContain('if [ "$ARCH" = "arm64" ]');
		expect(script).toContain('/opt/homebrew/bin/brew');
		expect(script).toContain('openboot-darwin-${ARCH}');
	});

	it('should include custom script when provided', () => {
		const customScript = 'mkdir -p ~/projects\necho "Setup complete"';
		const script = generateInstallScript('testuser', 'my-config', customScript, '');

		expect(script).toContain('Running Custom Post-Install Script');
		expect(script).toContain('base64 -d | bash');
		expect(script).toContain('CUSTOM_SCRIPT_EXIT=$?');
	});

	it('should handle custom script errors gracefully', () => {
		const customScript = 'exit 1';
		const script = generateInstallScript('testuser', 'my-config', customScript, '');

		expect(script).toContain('set +e');
		expect(script).toContain('if [ $CUSTOM_SCRIPT_EXIT -ne 0 ]');
		expect(script).toContain('Custom script exited with code');
		expect(script).toContain('Installation will continue');
	});

	it('should not include custom script section when empty', () => {
		const script = generateInstallScript('testuser', 'my-config', '', '');

		expect(script).not.toContain('Running Custom Post-Install Script');
		expect(script).not.toContain('base64 -d');
	});

	it('should include dotfiles setup when repo provided', () => {
		const dotfilesRepo = 'https://github.com/testuser/dotfiles.git';
		const script = generateInstallScript('testuser', 'my-config', '', dotfilesRepo);

		expect(script).toContain('Setting up Dotfiles');
		expect(script).toContain('DOTFILES_REPO="https://github.com/testuser/dotfiles.git"');
		expect(script).toContain('DOTFILES_DIR="$HOME/.dotfiles"');
		expect(script).toContain('git clone "$DOTFILES_REPO"');
		expect(script).toContain('stow -v --target="$HOME"');
	});

	it('should validate dotfiles repo URL is HTTPS', () => {
		const dotfilesRepo = 'https://github.com/testuser/dotfiles.git';
		const script = generateInstallScript('testuser', 'my-config', '', dotfilesRepo);

		expect(script).toContain('if [[ ! "$DOTFILES_REPO" =~ ^https:// ]]');
		expect(script).toContain('Invalid dotfiles repo URL (must use HTTPS)');
	});

	it('should handle existing dotfiles directory with git pull', () => {
		const dotfilesRepo = 'https://github.com/testuser/dotfiles.git';
		const script = generateInstallScript('testuser', 'my-config', '', dotfilesRepo);

		expect(script).toContain('if [ -d "$DOTFILES_DIR" ]');
		expect(script).toContain('Pulling latest changes...');
		expect(script).toContain('git pull');
	});

	it('should remove existing zshrc files before stow', () => {
		const dotfilesRepo = 'https://github.com/testuser/dotfiles.git';
		const script = generateInstallScript('testuser', 'my-config', '', dotfilesRepo);

		expect(script).toContain('rm -f "$HOME/.zshrc" "$HOME/.zshrc.pre-oh-my-zsh"');
	});

	it('should not include dotfiles section when repo not provided', () => {
		const script = generateInstallScript('testuser', 'my-config', '', '');

		expect(script).not.toContain('Setting up Dotfiles');
		expect(script).not.toContain('DOTFILES_REPO');
		expect(script).not.toContain('stow');
	});

	it('should sanitize username and slug in all references', () => {
		const script = generateInstallScript('user@test', 'my config!', '', '');

		expect(script).toContain('usertest/myconfig');
		expect(script).not.toContain('user@test');
		expect(script).not.toContain('my config!');
	});

	it('should include both custom script and dotfiles when both provided', () => {
		const customScript = 'echo "Custom setup"';
		const dotfilesRepo = 'https://github.com/testuser/dotfiles.git';
		const script = generateInstallScript('testuser', 'my-config', customScript, dotfilesRepo);

		expect(script).toContain('Running Custom Post-Install Script');
		expect(script).toContain('Setting up Dotfiles');
	});

	it('should include cleanup trap for temporary binary', () => {
		const script = generateInstallScript('testuser', 'my-config', '', '');

		expect(script).toContain('OPENBOOT_BIN="$TMPDIR/openboot-$$"');
		expect(script).toContain('trap \'rm -f "$OPENBOOT_BIN"\' EXIT');
	});

	it('should pass through additional arguments to openboot binary', () => {
		const script = generateInstallScript('testuser', 'my-config', '', '');

		expect(script).toContain('"$OPENBOOT_BIN" --user "testuser/my-config" "$@"');
	});
});
