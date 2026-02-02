import type { Handle } from '@sveltejs/kit';

export function generateInstallScript(username: string, slug: string, customScript: string, dotfilesRepo: string): string {
	return `#!/bin/bash
set -e

echo "========================================"
echo "  OpenBoot - Custom Install"
echo "  Config: @${username}/${slug}"
echo "========================================"
echo ""

TMPDIR="\${TMPDIR:-/tmp}"
OPENBOOT_BIN="\$TMPDIR/openboot-\$\$"

echo "Some installations require admin privileges."
sudo -v
trap 'rm -f "\$OPENBOOT_BIN"' EXIT

install_xcode_clt() {
  if xcode-select -p &>/dev/null; then
    return 0
  fi
  echo "Installing Xcode Command Line Tools..."
  echo "(A dialog may appear - please click 'Install')"
  echo ""
  xcode-select --install 2>/dev/null || true
  echo "Waiting for Xcode Command Line Tools installation..."
  until xcode-select -p &>/dev/null; do
    sleep 5
  done
  echo "Xcode Command Line Tools installed!"
  echo ""
}

install_homebrew() {
  if command -v brew &>/dev/null; then
    return 0
  fi
  echo "Installing Homebrew..."
  echo ""
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [ "$(uname -m)" = "arm64" ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  else
    eval "$(/usr/local/bin/brew shellenv)"
  fi
  echo "Homebrew installed!"
  echo ""
}

install_xcode_clt
install_homebrew

ARCH="$(uname -m)"
if [ "$ARCH" = "arm64" ]; then
  ARCH="arm64"
else
  ARCH="amd64"
fi

OPENBOOT_URL="https://github.com/openbootdotdev/openboot/releases/latest/download/openboot-darwin-\${ARCH}"

echo "Downloading OpenBoot..."
curl -fsSL "\$OPENBOOT_URL" -o "\$OPENBOOT_BIN"
chmod +x "\$OPENBOOT_BIN"

echo "Using remote config: @${username}/${slug}"
"\$OPENBOOT_BIN" --user ${username}/${slug} "\$@"

${
		customScript
			? `
echo ""
echo "=== Running Custom Post-Install Script ==="
set +e
${customScript}
set -e
`
			: ''
	}
${
		dotfilesRepo
			? `
echo ""
echo "=== Setting up Dotfiles ==="
DOTFILES_REPO="${dotfilesRepo}"
DOTFILES_DIR="\$HOME/.dotfiles"

if [ -d "\$DOTFILES_DIR" ]; then
  echo "Dotfiles directory already exists at \$DOTFILES_DIR"
  echo "Pulling latest changes..."
  cd "\$DOTFILES_DIR" && git pull
else
  echo "Cloning dotfiles from \$DOTFILES_REPO..."
  git clone "\$DOTFILES_REPO" "\$DOTFILES_DIR"
fi

cd "\$DOTFILES_DIR"
echo "Deploying dotfiles with stow..."
rm -f "\$HOME/.zshrc" "\$HOME/.zshrc.pre-oh-my-zsh"
for dir in */; do
  [ -d "\$dir" ] && stow -v --target="\$HOME" "\${dir%/}" 2>/dev/null || true
done
`
			: ''
	}

echo ""
echo "Installation complete!"
`;
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	const shortAliasMatch = path.match(/^\/([a-z0-9-]+)$/);
	if (shortAliasMatch && !['dashboard', 'api', 'install'].includes(shortAliasMatch[1])) {
		const alias = shortAliasMatch[1];
		const env = event.platform?.env;

		if (env) {
			const config = await env.DB.prepare('SELECT c.slug, c.custom_script, c.dotfiles_repo, u.username FROM configs c JOIN users u ON c.user_id = u.id WHERE c.alias = ? AND c.is_public = 1')
				.bind(alias)
				.first<{ slug: string; username: string; custom_script: string; dotfiles_repo: string }>();

			if (config) {
				const script = generateInstallScript(config.username, config.slug, config.custom_script, config.dotfiles_repo || '');

				return new Response(script, {
					headers: {
						'Content-Type': 'text/plain; charset=utf-8',
						'Cache-Control': 'no-cache'
					}
				});
			}
		}
	}

	return resolve(event);
};
