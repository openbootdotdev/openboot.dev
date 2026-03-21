function sanitizeShellArg(value: string): string {
	return value.replace(/[^a-zA-Z0-9_\-]/g, '');
}

export function generatePrivateInstallScript(
	appUrl: string,
	username: string,
	slug: string
): string {
	const safeUsername = sanitizeShellArg(username);
	const safeSlug = sanitizeShellArg(slug);

	return `#!/bin/bash
set -e

main() {
# When run via "curl | bash", stdin is the script content, not the terminal.
# Reopen stdin from /dev/tty so interactive prompts (sudo, Homebrew) work.
# IMPORTANT: This redirects stdin for the ENTIRE process. After main() returns,
# bash would try to read the next command from /dev/tty (not the pipe) and hang.
# Therefore main() MUST exit explicitly — never let it return to the caller.
if [ ! -t 0 ] && [ -e /dev/tty ]; then
  exec < /dev/tty || true
fi

echo "========================================"
echo "  OpenBoot - Private Config Install"
echo "  Config: @${safeUsername}/${safeSlug}"
echo "========================================"
echo ""
echo "This config is private. Browser authorization required."
echo ""

APP_URL="${appUrl}"

auth_response=$(curl -fsSL -X POST "\$APP_URL/api/auth/cli/start" \\
  -H "Content-Type: application/json" \\
  -d '{}')

CODE_ID=$(echo "\$auth_response" | grep -o '"code_id":"[^"]*"' | cut -d'"' -f4)
CODE=$(echo "\$auth_response" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)

if [ -z "\$CODE_ID" ] || [ -z "\$CODE" ]; then
  echo "Error: Failed to start authentication"
  exit 1
fi

AUTH_URL="\$APP_URL/cli-auth?code=\$CODE"
echo "Opening browser for authorization..."
echo "  Code: \$CODE"
echo "  URL:  \$AUTH_URL"
echo ""

if command -v open &>/dev/null; then
  open "\$AUTH_URL"
elif command -v xdg-open &>/dev/null; then
  xdg-open "\$AUTH_URL"
else
  echo "Please open this URL in your browser:"
  echo "  \$AUTH_URL"
fi

echo "Waiting for authorization..."
TOKEN=""
for i in $(seq 1 60); do
  sleep 2
  poll_response=$(curl -fsSL "\$APP_URL/api/auth/cli/poll?code_id=\$CODE_ID" 2>/dev/null || echo '{}')
  poll_status=$(echo "\$poll_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

  if [ "\$poll_status" = "approved" ]; then
    TOKEN=$(echo "\$poll_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    break
  elif [ "\$poll_status" = "expired" ]; then
    echo "Error: Authorization expired. Please try again."
    exit 1
  fi
  printf "."
done
echo ""

if [ -z "\$TOKEN" ]; then
  echo "Error: Authorization timed out. Please try again."
  exit 1
fi

echo "Authorized! Fetching install script..."
echo ""

exec bash <(curl -fsSL -H "Authorization: Bearer \$TOKEN" "\$APP_URL/${safeUsername}/${safeSlug}/install")
echo "Error: Failed to launch install script" >&2
exit 1
}

main "\$@"
`;
}

export function generateInstallScript(
	username: string,
	slug: string
): string {
	const safeUsername = sanitizeShellArg(username);
	const safeSlug = sanitizeShellArg(slug);

	return `#!/bin/bash
set -euo pipefail

TAP_NAME="openbootdotdev/tap"

main() {
# When run via "curl | bash", stdin is the script content, not the terminal.
# Reopen stdin from /dev/tty so interactive prompts (read, sudo, Homebrew) work.
# IMPORTANT: This redirects stdin for the ENTIRE process. After main() returns,
# bash would try to read the next command from /dev/tty (not the pipe) and hang.
# Therefore main() MUST exit explicitly — never let it return to the caller.
if [[ ! -t 0 ]] && [[ -e /dev/tty ]]; then
  exec < /dev/tty || true
fi

echo ""
echo "OpenBoot Installer"
echo "=================="
echo "  Config: @${safeUsername}/${safeSlug}"
echo ""

detect_os() {
  local os
  os=\$(uname -s | tr '[:upper:]' '[:lower:]')
  case "\$os" in
    darwin) echo "darwin" ;;
    *)      echo "Error: OpenBoot only supports macOS" >&2; exit 1 ;;
  esac
}

detect_arch() {
  local arch
  arch=\$(uname -m)
  case "\$arch" in
    x86_64)  echo "amd64" ;;
    arm64)   echo "arm64" ;;
    aarch64) echo "arm64" ;;
    *)       echo "unsupported: \$arch" >&2; exit 1 ;;
  esac
}

install_xcode_clt() {
  if xcode-select -p &>/dev/null; then
    return 0
  fi

  echo ""
  echo "Xcode Command Line Tools need to be installed."
  echo "A dialog will appear - please click 'Install' and enter your password."
  echo ""
  read -p "Press Enter to launch installer..." -r
  echo ""

  xcode-select --install 2>/dev/null || true

  echo "Waiting for installation to complete..."
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

  /bin/bash -c "\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  local arch
  arch=\$(uname -m)
  case "\$arch" in
    arm64)
      if [[ -x "/opt/homebrew/bin/brew" ]]; then
        export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:\$PATH"
        export HOMEBREW_PREFIX="/opt/homebrew"
        export HOMEBREW_CELLAR="/opt/homebrew/Cellar"
        export HOMEBREW_REPOSITORY="/opt/homebrew"
      fi
      ;;
    x86_64)
      if [[ -x "/usr/local/bin/brew" ]]; then
        export PATH="/usr/local/bin:/usr/local/sbin:\$PATH"
        export HOMEBREW_PREFIX="/usr/local"
        export HOMEBREW_CELLAR="/usr/local/Cellar"
        export HOMEBREW_REPOSITORY="/usr/local/Homebrew"
      fi
      ;;
    *)
      echo "Error: Unsupported architecture: \$arch" >&2
      exit 1
      ;;
  esac

  echo ""
  echo "Homebrew installed!"
  echo ""
}

local os arch
os=\$(detect_os)
arch=\$(detect_arch)

echo "Detected: \${os}/\${arch}"
echo ""

install_xcode_clt
install_homebrew

if brew list openboot &>/dev/null 2>&1; then
  echo "OpenBoot is already installed via Homebrew."
  echo ""
  read -p "Reinstall? (y/N) " -n 1 -r
  echo

  if [[ \$REPLY =~ ^[Yy]\$ ]]; then
    echo "Reinstalling OpenBoot..."
    brew reinstall \${TAP_NAME}/openboot
    echo ""
    echo "OpenBoot reinstalled!"
  else
    echo "Using existing installation."
  fi
else
  echo "Installing OpenBoot via Homebrew..."
  echo ""

  brew install \${TAP_NAME}/openboot

  echo ""
  echo "OpenBoot installed!"
fi

echo ""
echo "Starting OpenBoot setup with config: @${safeUsername}/${safeSlug}"
echo ""
openboot --user "${safeUsername}/${safeSlug}" "\$@"

echo ""
echo "Installation complete!"
exit 0
}

main "\$@"
`;
}
