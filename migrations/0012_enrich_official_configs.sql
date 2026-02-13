UPDATE configs SET install_count = 2847, custom_script = '#!/bin/bash
echo "🎨 Configuring React development environment..."
if command -v pnpm &> /dev/null; then
    pnpm config set store-dir ~/.pnpm-store
    echo "✓ pnpm store configured"
fi
if command -v node &> /dev/null; then
    echo "✓ Node.js ready"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Install VSCode extensions: ES7+ React snippets, Prettier"
echo "  • Run: npx create-next-app@latest my-app"
echo "  • Docs: https://react.dev"
'
WHERE id = 'ob-seed-react-frontend';

UPDATE configs SET install_count = 1523, custom_script = '#!/bin/bash
echo "🎨 Configuring Vue development environment..."
if command -v pnpm &> /dev/null; then
    pnpm config set store-dir ~/.pnpm-store
    echo "✓ pnpm store configured"
fi
if command -v deno &> /dev/null; then
    echo "✓ Deno ready"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Run: pnpm create vue@latest"
echo "  • Or: pnpm dlx nuxi@latest init my-app"
echo "  • Docs: https://vuejs.org"
'
WHERE id = 'ob-seed-vue-frontend';

UPDATE configs SET install_count = 1892, custom_script = '#!/bin/bash
echo "🐹 Configuring Go development environment..."
if command -v go &> /dev/null; then
    export GOPATH="$HOME/go"
    export PATH="$GOPATH/bin:$PATH"
    mkdir -p "$GOPATH"/{bin,src,pkg}
    if ! grep -q "GOPATH=" ~/.zshrc 2>/dev/null; then
        echo "" >> ~/.zshrc
        echo "export GOPATH=\"$HOME/go\"" >> ~/.zshrc
        echo "export PATH=\"$GOPATH/bin:$PATH\"" >> ~/.zshrc
    fi
    echo "✓ GOPATH configured at $GOPATH"
    echo "✓ Go ready"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Restart terminal for GOPATH to take effect"
echo "  • Run: go mod init example.com/myproject"
echo "  • Docs: https://go.dev/doc"
'
WHERE id = 'ob-seed-go-backend';

UPDATE configs SET install_count = 3241, custom_script = '#!/bin/bash
echo "🐍 Configuring Python development environment..."
if command -v python3 &> /dev/null; then
    echo "✓ Python ready"
fi
if command -v uv &> /dev/null; then
    echo "✓ uv fast pip alternative installed"
    echo ""
    echo "Create virtual environments with:"
    echo "  uv venv .venv"
    echo "  source .venv/bin/activate"
fi
if command -v ruff &> /dev/null; then
    echo "✓ ruff linter ready"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Create project: mkdir myproject && cd myproject"
echo "  • Init venv: uv venv && source .venv/bin/activate"
echo "  • Install deps: uv pip install fastapi uvicorn"
'
WHERE id = 'ob-seed-python-backend';

UPDATE configs SET install_count = 2634, custom_script = '#!/bin/bash
echo "🟢 Configuring Node.js backend environment..."
if command -v node &> /dev/null; then
    echo "✓ Node.js ready"
fi
if command -v pnpm &> /dev/null; then
    pnpm config set store-dir ~/.pnpm-store
    echo "✓ pnpm configured"
fi
if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL installed"
    echo "Start: brew services start postgresql"
fi
if command -v redis-server &> /dev/null; then
    echo "✓ Redis installed"
    echo "Start: brew services start redis"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Init project: pnpm init"
echo "  • Install deps: pnpm add express pg redis"
'
WHERE id = 'ob-seed-nodejs-backend';

UPDATE configs SET install_count = 987, custom_script = '#!/bin/bash
echo "☕ Configuring Java/Spring development environment..."
if command -v java &> /dev/null; then
    export JAVA_HOME=$(/usr/libexec/java_home)
    if ! grep -q "JAVA_HOME=" ~/.zshrc 2>/dev/null; then
        echo "" >> ~/.zshrc
        echo "export JAVA_HOME=$(/usr/libexec/java_home)" >> ~/.zshrc
    fi
    echo "✓ Java ready"
    echo "✓ JAVA_HOME configured"
fi
if command -v mvn &> /dev/null; then
    echo "✓ Maven ready"
fi
if command -v gradle &> /dev/null; then
    echo "✓ Gradle ready"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Restart terminal for JAVA_HOME to take effect"
echo "  • Create project at https://start.spring.io"
'
WHERE id = 'ob-seed-java-spring';

UPDATE configs SET install_count = 1456, custom_script = '#!/bin/bash
echo "🦀 Configuring Rust development environment..."
if command -v rustup &> /dev/null; then
    echo "✓ rustup installed"
    if ! rustup show &> /dev/null; then
        echo "Installing Rust toolchain..."
        rustup-init -y
        source "$HOME/.cargo/env"
    fi
    if command -v rustc &> /dev/null; then
        echo "✓ Rust ready"
    fi
    if command -v cargo &> /dev/null; then
        echo "✓ Cargo ready"
        rustup component add rustfmt clippy 2>/dev/null
        echo "✓ rustfmt and clippy installed"
    fi
fi
if ! grep -q "cargo/env" ~/.zshrc 2>/dev/null; then
    echo "" >> ~/.zshrc
    echo ". \"$HOME/.cargo/env\"" >> ~/.zshrc
fi
echo ""
echo "🚀 Next steps:"
echo "  • Restart terminal"
echo "  • Create project: cargo new myproject"
echo "  • Run: cargo run"
'
WHERE id = 'ob-seed-rust-backend';

UPDATE configs SET install_count = 743, custom_script = '#!/bin/bash
echo "💎 Configuring Ruby on Rails environment..."
if command -v ruby &> /dev/null; then
    echo "✓ Ruby ready"
fi
if command -v gem &> /dev/null; then
    echo "✓ RubyGems ready"
    if ! gem list rails -i &> /dev/null; then
        echo "Installing Rails..."
        gem install rails
    fi
    if command -v rails &> /dev/null; then
        echo "✓ Rails installed"
    fi
fi
if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL installed"
    echo "Start: brew services start postgresql"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Create app: rails new myapp --database=postgresql"
echo "  • Start server: rails server"
'
WHERE id = 'ob-seed-rails-backend';

UPDATE configs SET install_count = 4102, custom_script = '#!/bin/bash
echo "⚡ Configuring T3 Stack environment..."
if command -v pnpm &> /dev/null; then
    pnpm config set store-dir ~/.pnpm-store
    echo "✓ pnpm configured"
fi
if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL installed"
    echo "Start: brew services start postgresql"
fi
if command -v redis-server &> /dev/null; then
    echo "✓ Redis installed"
    echo "Start: brew services start redis"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Create T3 app: pnpm create t3-app@latest"
echo "  • Run: pnpm dev"
echo "  • Docs: https://create.t3.gg"
'
WHERE id = 'ob-seed-t3-fullstack';

UPDATE configs SET install_count = 1234, custom_script = '#!/bin/bash
echo "🍎 Configuring iOS/macOS development environment..."
if command -v swiftlint &> /dev/null; then
    echo "✓ SwiftLint installed"
fi
if command -v pod &> /dev/null; then
    echo "✓ CocoaPods ready"
fi
if command -v fastlane &> /dev/null; then
    echo "✓ Fastlane ready for CI/CD"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Open Xcode and create a new project"
echo "  • Set up Fastlane: fastlane init"
echo "  • Docs: https://developer.apple.com/swift"
'
WHERE id = 'ob-seed-ios-developer';

UPDATE configs SET install_count = 892, custom_script = '#!/bin/bash
echo "🤖 Configuring Android development environment..."
if command -v java &> /dev/null; then
    export JAVA_HOME=$(/usr/libexec/java_home)
    echo "✓ Java ready"
fi
ANDROID_HOME="$HOME/Library/Android/sdk"
if [ -d "$ANDROID_HOME" ]; then
    export ANDROID_HOME
    export PATH="$ANDROID_HOME/platform-tools:$PATH"
    if ! grep -q "ANDROID_HOME=" ~/.zshrc 2>/dev/null; then
        echo "" >> ~/.zshrc
        echo "export ANDROID_HOME=\"$HOME/Library/Android/sdk\"" >> ~/.zshrc
        echo "export PATH=\"$ANDROID_HOME/platform-tools:$PATH\"" >> ~/.zshrc
    fi
    echo "✓ ANDROID_HOME configured"
fi
if command -v gradle &> /dev/null; then
    echo "✓ Gradle ready"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Restart terminal"
echo "  • Open Android Studio to complete SDK setup"
'
WHERE id = 'ob-seed-android-dev';

UPDATE configs SET install_count = 2156, custom_script = '#!/bin/bash
echo "🔧 Configuring DevOps/SRE environment..."
if command -v kubectl &> /dev/null; then
    echo "✓ kubectl ready"
    mkdir -p "$HOME/.kube"
fi
if command -v helm &> /dev/null; then
    echo "✓ Helm ready"
fi
if command -v terraform &> /dev/null; then
    echo "✓ Terraform ready"
fi
if command -v aws &> /dev/null; then
    echo "✓ AWS CLI ready"
    echo "Configure: aws configure"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Configure kubectl: kubectl config view"
echo "  • Set up AWS: aws configure"
echo "  • Initialize Terraform: terraform init"
'
WHERE id = 'ob-seed-devops-sre';

UPDATE configs SET install_count = 1567, custom_script = '#!/bin/bash
echo "🏗️ Configuring Platform Engineering environment..."
if command -v terraform &> /dev/null; then
    echo "✓ Terraform ready"
fi
if command -v ansible &> /dev/null; then
    echo "✓ Ansible ready"
    mkdir -p "$HOME/.ansible"
fi
if command -v sops &> /dev/null; then
    echo "✓ SOPS secret encryption ready"
fi
if command -v age &> /dev/null; then
    echo "✓ age encryption ready"
    echo "Generate key: age-keygen -o ~/.config/sops/age/keys.txt"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Initialize Terraform: terraform init"
echo "  • Set up Ansible inventory"
'
WHERE id = 'ob-seed-platform-eng';

UPDATE configs SET install_count = 2789, custom_script = '#!/bin/bash
echo "📊 Configuring Data Science environment..."
if command -v python3 &> /dev/null; then
    echo "✓ Python ready"
fi
if command -v jupyter &> /dev/null; then
    echo "✓ Jupyter installed"
    mkdir -p "$HOME/.jupyter"
fi
if command -v conda &> /dev/null; then
    echo "✓ Conda ready"
    echo ""
    echo "Create ML environment:"
    echo "  conda create -n ml python=3.11"
    echo "  conda activate ml"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Start Jupyter: jupyter notebook"
echo "  • Or create conda env for projects"
'
WHERE id = 'ob-seed-data-science';

UPDATE configs SET install_count = 934, custom_script = '#!/bin/bash
echo "🔒 Configuring Security Engineering environment..."
if command -v nmap &> /dev/null; then
    echo "✓ nmap ready"
fi
if command -v nikto &> /dev/null; then
    echo "✓ nikto web scanner ready"
fi
if command -v sqlmap &> /dev/null; then
    echo "✓ sqlmap ready"
fi
if command -v openssl &> /dev/null; then
    echo "✓ OpenSSL ready"
fi
mkdir -p "$HOME/security-tools"
echo ""
echo "⚠️  IMPORTANT: Use these tools responsibly and legally"
echo ""
echo "🚀 Next steps:"
echo "  • Always get permission before testing"
echo "  • Network scan: nmap -sV target.com"
'
WHERE id = 'ob-seed-security-eng';

UPDATE configs SET install_count = 567, custom_script = '#!/bin/bash
echo "🎮 Configuring Unity game development environment..."
if command -v git &> /dev/null; then
    echo "✓ Git ready"
fi
if command -v ffmpeg &> /dev/null; then
    echo "✓ FFmpeg video processing ready"
fi
if command -v blender &> /dev/null; then
    echo "✓ Blender ready"
fi
UNITY_HUB="/Applications/Unity Hub.app"
if [ -d "$UNITY_HUB" ]; then
    echo "✓ Unity Hub installed"
fi
echo ""
echo "🚀 Next steps:"
echo "  • Open Unity Hub to install Unity Editor"
echo "  • Recommended: Install LTS version"
'
WHERE id = 'ob-seed-unity-gamedev';

UPDATE configs SET install_count = 1823, custom_script = '#!/bin/bash
echo "⛓️ Configuring Web3/Blockchain development..."
if command -v node &> /dev/null; then
    echo "✓ Node.js ready"
fi
if command -v pnpm &> /dev/null; then
    pnpm config set store-dir ~/.pnpm-store
    echo "✓ pnpm configured"
fi
if command -v rustc &> /dev/null; then
    echo "✓ Rust ready for Solana/Anchor"
fi
mkdir -p "$HOME/web3-projects"
echo ""
echo "🔗 Install Web3 frameworks:"
echo "  • Hardhat: pnpm create hardhat"
echo "  • Foundry: curl -L https://foundry.paradigm.xyz | bash"
echo ""
echo "📚 Docs: https://hardhat.org/docs"
'
WHERE id = 'ob-seed-web3-dev';

UPDATE configs SET install_count = 1345, custom_script = '#!/bin/bash
echo "🎨 Configuring Designer-Developer environment..."
if command -v node &> /dev/null; then
    echo "✓ Node.js ready"
fi
if command -v pnpm &> /dev/null; then
    pnpm config set store-dir ~/.pnpm-store
    echo "✓ pnpm configured"
fi
if command -v magick &> /dev/null || command -v convert &> /dev/null; then
    echo "✓ ImageMagick ready"
fi
if command -v ffmpeg &> /dev/null; then
    echo "✓ FFmpeg ready"
fi
mkdir -p "$HOME/design-handoff"
echo ""
echo "🚀 Quick commands:"
echo "  • Optimize: magick input.png -resize 50% output.png"
echo "  • Create Tailwind: pnpm create vite my-app"
'
WHERE id = 'ob-seed-design-dev';

UPDATE configs SET install_count = 4521, custom_script = '#!/bin/bash
echo "🎓 Configuring Student/Beginner environment..."
if command -v git &> /dev/null; then
    echo "✓ Git ready"
fi
if command -v node &> /dev/null; then
    echo "✓ Node.js ready"
fi
if command -v python3 &> /dev/null; then
    echo "✓ Python ready"
fi
mkdir -p "$HOME/projects"
echo ""
echo "🚀 Your first steps:"
echo "  1. Create project: mkdir ~/projects/hello-world"
echo "  2. Initialize git: cd ~/projects/hello-world && git init"
echo "  3. Write code: code ."
echo ""
echo "📚 Learning resources:"
echo "  • Git: https://git-scm.com/book"
echo "  • JavaScript: https://javascript.info"
'
WHERE id = 'ob-seed-starter-kit';

UPDATE configs SET install_count = 678, custom_script = '#!/bin/bash
echo "✍️ Configuring Technical Writing environment..."
if command -v hugo &> /dev/null; then
    echo "✓ Hugo static site generator ready"
fi
if command -v pandoc &> /dev/null; then
    echo "✓ Pandoc document converter ready"
fi
if command -v asciinema &> /dev/null; then
    echo "✓ asciinema terminal recorder ready"
fi
if command -v ffmpeg &> /dev/null; then
    echo "✓ FFmpeg ready"
fi
mkdir -p "$HOME/writing"/{blog,docs,scripts}
echo ""
echo "🚀 Quick start:"
echo "  • Create Hugo blog: hugo new site ~/writing/blog"
echo "  • Convert to PDF: pandoc input.md -o output.pdf"
echo "  • Record terminal: asciinema rec demo.cast"
'
WHERE id = 'ob-seed-tech-writer';
