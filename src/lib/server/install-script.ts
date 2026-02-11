function sanitizeShellArg(value: string): string {
	return value.replace(/[^a-zA-Z0-9_\-]/g, '');
}

export function generateInstallScript(
	username: string,
	slug: string,
	customScript: string,
	dotfilesRepo: string
): string {
	const safeUsername = sanitizeShellArg(username);
	const safeSlug = sanitizeShellArg(slug);

	return `#!/bin/bash
set -e

echo "========================================"
echo "  OpenBoot - Custom Install"
echo "  Config: @${safeUsername}/${safeSlug}"
echo "========================================"
echo ""

TMPDIR="\${TMPDIR:-/tmp}"
OPENBOOT_BIN="\$TMPDIR/openboot-\$\$"

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

echo "Using remote config: @${safeUsername}/${safeSlug}"
"\$OPENBOOT_BIN" --user "${safeUsername}/${safeSlug}" "\$@"

${
		customScript
			? `
echo ""
echo "=== Running Custom Post-Install Script ==="
set +e
CUSTOM_SCRIPT_B64="${btoa(unescape(encodeURIComponent(customScript)))}"
echo "\$CUSTOM_SCRIPT_B64" | base64 -d | bash
CUSTOM_SCRIPT_EXIT=$?
set -e
if [ $CUSTOM_SCRIPT_EXIT -ne 0 ]; then
  echo ""
  echo "⚠ Custom script exited with code $CUSTOM_SCRIPT_EXIT"
  echo "  Installation will continue, but check script output above."
fi
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

if [[ ! "\$DOTFILES_REPO" =~ ^https:// ]]; then
  echo "Error: Invalid dotfiles repo URL (must use HTTPS)"
  exit 1
fi

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
