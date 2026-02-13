UPDATE configs SET install_count = 2847, custom_script = '#!/bin/bash

echo "🎨 Configuring React development environment..."

if command -v pnpm &> /dev/null; then
    pnpm config set store-dir ~/.pnpm-store
    echo "✓ pnpm store configured"
fi

if command -v node &> /dev/null; then
    echo "✓ Node.js $(node --version) ready"
    echo "✓ npm $(npm --version) ready"
fi

if [ ! -d "$HOME/.config/Code/User" ]; then
    mkdir -p "$HOME/.config/Code/User"
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
    echo "✓ Deno $(deno --version | head -1) ready"
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
        echo "export GOPATH=\"\$HOME/go\"" >> ~/.zshrc
        echo "export PATH=\"\$GOPATH/bin:\$PATH\"" >> ~/.zshrc
    fi
    
    echo "✓ GOPATH configured at $GOPATH"
    echo "✓ Go $(go version | awk '\''{print $3}'\'')"
fi

if command -v golangci-lint &> /dev/null; then
    echo "✓ golangci-lint ready"
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
    PYTHON_VERSION=$(python3 --version | awk '\''{print $2}'\'')
    echo "✓ Python $PYTHON_VERSION ready"
fi

if command -v uv &> /dev/null; then
    echo "✓ uv (fast pip alternative) installed"
    echo ""
    echo "Create virtual environments with:"
    echo "  uv venv .venv"
    echo "  source .venv/bin/activate"
fi

if command -v ruff &> /dev/null; then
    echo "✓ ruff linter ready"
fi

if [ ! -d "$HOME/.config/ruff" ]; then
    mkdir -p "$HOME/.config/ruff"
fi

echo ""
echo "🚀 Next steps:"
echo "  • Create project: mkdir myproject && cd myproject"
echo "  • Init venv: uv venv && source .venv/bin/activate"
echo "  • Install deps: uv pip install fastapi uvicorn"
echo "  • Docs: https://docs.python.org"
'
WHERE id = 'ob-seed-python-backend';

UPDATE configs SET install_count = 2634, custom_script = '#!/bin/bash

echo "🟢 Configuring Node.js backend environment..."

if command -v node &> /dev/null; then
    echo "✓ Node.js $(node --version) ready"
fi

if command -v pnpm &> /dev/null; then
    pnpm config set store-dir ~/.pnpm-store
    echo "✓ pnpm configured"
fi

if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL installed"
    echo ""
    echo "Start PostgreSQL:"
    echo "  brew services start postgresql"
    echo ""
    echo "Create database:"
    echo "  createdb mydb"
fi

if command -v redis-server &> /dev/null; then
    echo "✓ Redis installed"
    echo ""
    echo "Start Redis:"
    echo "  brew services start redis"
fi

echo ""
echo "🚀 Next steps:"
echo "  • Init project: pnpm init"
echo "  • Install deps: pnpm add express pg redis"
echo "  • Docs: https://nodejs.org/docs"
'
WHERE id = 'ob-seed-nodejs-backend';

UPDATE configs SET install_count = 987, custom_script = '#!/bin/bash

echo "☕ Configuring Java/Spring development environment..."

if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'\''"'\'' -f2)
    echo "✓ Java $JAVA_VERSION ready"
    
    export JAVA_HOME=$(/usr/libexec/java_home)
    
    if ! grep -q "JAVA_HOME=" ~/.zshrc 2>/dev/null; then
        echo "" >> ~/.zshrc
        echo "export JAVA_HOME=\$(/usr/libexec/java_home)" >> ~/.zshrc
    fi
    
    echo "✓ JAVA_HOME set to $JAVA_HOME"
fi

if command -v mvn &> /dev/null; then
    echo "✓ Maven $(mvn --version | head -1 | awk '\''{print $3}'\'') ready"
fi

if command -v gradle &> /dev/null; then
    echo "✓ Gradle ready"
fi

echo ""
echo "🚀 Next steps:"
echo "  • Restart terminal for JAVA_HOME to take effect"
echo "  • Create project: https://start.spring.io"
echo "  • Or use: spring init --dependencies=web,data-jpa myapp"
echo "  • Docs: https://spring.io/guides"
'
WHERE id = 'ob-seed-java-spring';

UPDATE configs SET install_count = 1456, custom_script = '#!/bin/bash

echo "🦀 Configuring Rust development environment..."

if command -v rustup &> /dev/null; then
    echo "✓ rustup installed"
    
    if ! rustup show &> /dev/null; then
        echo "Installing Rust toolchain..."
        rustup-init -y --default-toolchain stable
        source "$HOME/.cargo/env"
    fi
    
    if command -v rustc &> /dev/null; then
        echo "✓ Rust $(rustc --version | awk '\''{print $2}'\'') ready"
    fi
    
    if command -v cargo &> /dev/null; then
        echo "✓ Cargo ready"
        
        rustup component add rustfmt clippy 2>/dev/null
        echo "✓ rustfmt and clippy installed"
    fi
fi

if ! grep -q "cargo/env" ~/.zshrc 2>/dev/null; then
    echo "" >> ~/.zshrc
    echo ". \"\$HOME/.cargo/env\"" >> ~/.zshrc
fi

echo ""
echo "🚀 Next steps:"
echo "  • Restart terminal for cargo to be available"
echo "  • Create project: cargo new myproject"
echo "  • Run: cargo run"
echo "  • Docs: https://doc.rust-lang.org/book"
'
WHERE id = 'ob-seed-rust-backend';

UPDATE configs SET install_count = 743, custom_script = '#!/bin/bash

echo "💎 Configuring Ruby on Rails environment..."

if command -v ruby &> /dev/null; then
    echo "✓ Ruby $(ruby --version | awk '\''{print $2}'\'') ready"
fi

if command -v gem &> /dev/null; then
    echo "✓ RubyGems ready"
    
    if ! gem list rails -i &> /dev/null; then
        echo "Installing Rails..."
        gem install rails --no-document
    fi
    
    if command -v rails &> /dev/null; then
        echo "✓ Rails $(rails --version | awk '\''{print $2}'\'') installed"
    fi
fi

if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL installed"
    echo ""
    echo "Start PostgreSQL:"
    echo "  brew services start postgresql"
fi

if command -v redis-server &> /dev/null; then
    echo "✓ Redis installed"
    echo ""
    echo "Start Redis:"
    echo "  brew services start redis"
fi

echo ""
echo "🚀 Next steps:"
echo "  • Create app: rails new myapp --database=postgresql"
echo "  • Start server: rails server"
echo "  • Docs: https://guides.rubyonrails.org"
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
    echo ""
    echo "Start PostgreSQL:"
    echo "  brew services start postgresql"
fi

if command -v redis-server &> /dev/null; then
    echo "✓ Redis installed"
    echo ""
    echo "Start Redis:"
    echo "  brew services start redis"
fi

if [ ! -f "$HOME/.env.example" ]; then
    cat > "$HOME/.env.example" << '\''EOF'\''
DATABASE_URL="postgresql://localhost:5432/mydb"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
EOF
    echo "✓ Created .env.example template in home directory"
fi

echo ""
echo "🚀 Next steps:"
echo "  • Create T3 app: pnpm create t3-app@latest"
echo "  • Copy .env.example to your project as .env"
echo "  • Run: pnpm dev"
echo "  • Docs: https://create.t3.gg"
'
WHERE id = 'ob-seed-t3-fullstack';

UPDATE configs SET install_count = 1234, custom_script = '#!/bin/bash

echo "🍎 Configuring iOS/macOS development environment..."

if command -v swiftlint &> /dev/null; then
    echo "✓ SwiftLint installed"
    
    if [ ! -f "$HOME/.swiftlint.yml" ]; then
        cat > "$HOME/.swiftlint.yml" << '\''EOF'\''
disabled_rules:
  - trailing_whitespace
opt_in_rules:
  - empty_count
  - empty_string
included:
  - Sources
excluded:
  - Pods
  - .build
line_length: 120
EOF
        echo "✓ Created default .swiftlint.yml"
    fi
fi

if command -v pod &> /dev/null; then
    echo "✓ CocoaPods $(pod --version) ready"
fi

if command -v fastlane &> /dev/null; then
    echo "✓ Fastlane ready for CI/CD"
fi

echo ""
echo "🚀 Next steps:"
echo "  • Open Xcode and create a new project"
echo "  • Add .swiftlint.yml to your project"
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
    export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"
    
    if ! grep -q "ANDROID_HOME=" ~/.zshrc 2>/dev/null; then
        echo "" >> ~/.zshrc
        echo "export ANDROID_HOME=\"\$HOME/Library/Android/sdk\"" >> ~/.zshrc
        echo "export PATH=\"\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/tools:\$PATH\"" >> ~/.zshrc
    fi
    
    echo "✓ ANDROID_HOME configured"
fi

if command -v gradle &> /dev/null; then
    echo "✓ Gradle ready"
fi

if command -v scrcpy &> /dev/null; then
    echo "✓ scrcpy (screen mirroring) ready"
fi

echo ""
echo "🚀 Next steps:"
echo "  • Restart terminal for ANDROID_HOME to take effect"
echo "  • Open Android Studio to complete SDK setup"
echo "  • Connect device and run: scrcpy"
echo "  • Docs: https://developer.android.com"
'
WHERE id = 'ob-seed-android-dev';

UPDATE configs SET install_count = 2156, custom_script = '#!/bin/bash

echo "🔧 Configuring DevOps/SRE environment..."

if command -v kubectl &> /dev/null; then
    echo "✓ kubectl $(kubectl version --client --short 2>/dev/null | awk '\''{print $3}'\'') ready"
    
    if [ ! -d "$HOME/.kube" ]; then
        mkdir -p "$HOME/.kube"
    fi
fi

if command -v helm &> /dev/null; then
    echo "✓ Helm $(helm version --short | awk '\''{print $1}'\'') ready"
fi

if command -v terraform &> /dev/null; then
    echo "✓ Terraform $(terraform version -json 2>/dev/null | jq -r '\''.terraform_version'\'') ready"
fi

if command -v aws &> /dev/null; then
    echo "✓ AWS CLI ready"
    echo ""
    echo "Configure AWS credentials:"
    echo "  aws configure"
fi

if command -v docker &> /dev/null; then
    echo "✓ Docker ready"
fi

echo ""
echo "🚀 Next steps:"
echo "  • Configure kubectl: kubectl config view"
echo "  • Set up AWS: aws configure"
echo "  • Initialize Terraform: terraform init"
echo "  • Docs: https://kubernetes.io/docs"
'
WHERE id = 'ob-seed-devops-sre';

UPDATE configs SET install_count = 1567, custom_script = '#!/bin/bash

echo "🏗️ Configuring Platform Engineering environment..."

if command -v terraform &> /dev/null; then
    echo "✓ Terraform ready"
fi

if command -v ansible &> /dev/null; then
    echo "✓ Ansible $(ansible --version | head -1 | awk '\''{print $3}'\'') ready"
    
    if [ ! -d "$HOME/.ansible" ]; then
        mkdir -p "$HOME/.ansible"
    fi
fi

if command -v sops &> /dev/null; then
    echo "✓ SOPS (secret encryption) ready"
fi

if command -v age &> /dev/null; then
    echo "✓ age (encryption) ready"
    
    if [ ! -f "$HOME/.config/sops/age/keys.txt" ]; then
        mkdir -p "$HOME/.config/sops/age"
        echo ""
        echo "Generate age key:"
        echo "  age-keygen -o ~/.config/sops/age/keys.txt"
    fi
fi

if command -v kubectl &> /dev/null; then
    echo "✓ kubectl ready"
fi

echo ""
echo "🚀 Next steps:"
echo "  • Generate age key for SOPS"
echo "  • Initialize Terraform: terraform init"
echo "  • Set up Ansible inventory"
echo "  • Docs: https://www.terraform.io/docs"
'
WHERE id = 'ob-seed-platform-eng';

UPDATE configs SET install_count = 2789, custom_script = '#!/bin/bash

echo "📊 Configuring Data Science environment..."

if command -v python3 &> /dev/null; then
    echo "✓ Python $(python3 --version | awk '\''{print $2}'\'') ready"
fi

if command -v jupyter &> /dev/null; then
    echo "✓ Jupyter installed"
    
    if [ ! -d "$HOME/.jupyter" ]; then
        mkdir -p "$HOME/.jupyter"
    fi
    
    jupyter --paths
fi

if command -v conda &> /dev/null; then
    echo "✓ Conda ready"
    echo ""
    echo "Create ML environment:"
    echo "  conda create -n ml python=3.11"
    echo "  conda activate ml"
    echo "  pip install numpy pandas scikit-learn matplotlib jupyter"
fi

if command -v uv &> /dev/null; then
    echo "✓ uv (fast pip) ready"
    echo ""
    echo "Quick virtual env:"
    echo "  uv venv .venv && source .venv/bin/activate"
    echo "  uv pip install pandas numpy scikit-learn"
fi

echo ""
echo "🚀 Next steps:"
echo "  • Start Jupyter: jupyter notebook"
echo "  • Or create conda env for specific projects"
echo "  • Docs: https://jupyter.org/documentation"
'
WHERE id = 'ob-seed-data-science';

UPDATE configs SET install_count = 934, custom_script = '#!/bin/bash

echo "🔒 Configuring Security Engineering environment..."

if command -v nmap &> /dev/null; then
    echo "✓ nmap $(nmap --version | head -1 | awk '\''{print $3}'\'') ready"
fi

if command -v nikto &> /dev/null; then
    echo "✓ nikto (web scanner) ready"
fi

if command -v sqlmap &> /dev/null; then
    echo "✓ sqlmap ready"
fi

if command -v openssl &> /dev/null; then
    echo "✓ OpenSSL $(openssl version | awk '\''{print $2}'\'') ready"
fi

if command -v gpg &> /dev/null; then
    echo "✓ GnuPG ready"
fi

if [ ! -d "$HOME/security-tools" ]; then
    mkdir -p "$HOME/security-tools"
    echo "✓ Created ~/security-tools directory"
fi

echo ""
echo "⚠️  IMPORTANT: Use these tools responsibly and legally"
echo ""
echo "🚀 Next steps:"
echo "  • Network scan: nmap -sV target.com"
echo "  • Web scan: nikto -h https://target.com"
echo "  • Always get permission before testing"
echo "  • Docs: https://nmap.org/docs.html"
'
WHERE id = 'ob-seed-security-eng';

UPDATE configs SET install_count = 567, custom_script = '#!/bin/bash

echo "🎮 Configuring Unity game development environment..."

if command -v git &> /dev/null; then
    echo "✓ Git ready"
    
    if [ ! -f "$HOME/.gitignore_global" ]; then
        cat > "$HOME/.gitignore_global" << '\''EOF'\''
[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
*.meta
.vs/
.vscode/
EOF
        git config --global core.excludesfile "$HOME/.gitignore_global"
        echo "✓ Created Unity .gitignore_global"
    fi
fi

if command -v ffmpeg &> /dev/null; then
    echo "✓ FFmpeg (video processing) ready"
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
echo "  • Create new project or open existing"
echo "  • Docs: https://docs.unity3d.com"
'
WHERE id = 'ob-seed-unity-gamedev';

UPDATE configs SET install_count = 1823, custom_script = '#!/bin/bash

echo "⛓️ Configuring Web3/Blockchain development..."

if command -v node &> /dev/null; then
    echo "✓ Node.js $(node --version) ready"
fi

if command -v pnpm &> /dev/null; then
    pnpm config set store-dir ~/.pnpm-store
    echo "✓ pnpm configured"
fi

if command -v rustc &> /dev/null; then
    echo "✓ Rust ready (for Solana/Anchor)"
fi

if [ ! -d "$HOME/web3-projects" ]; then
    mkdir -p "$HOME/web3-projects"
fi

echo ""
echo "🔗 Install Web3 frameworks:"
echo ""
echo "For Hardhat (Ethereum):"
echo "  pnpm create hardhat"
echo ""
echo "For Foundry (Ethereum):"
echo "  curl -L https://foundry.paradigm.xyz | bash"
echo "  foundryup"
echo ""
echo "For Anchor (Solana):"
echo "  cargo install --git https://github.com/coral-xyz/anchor avm --locked"
echo ""
echo "📚 Docs:"
echo "  • Hardhat: https://hardhat.org/docs"
echo "  • Foundry: https://book.getfoundry.sh"
echo "  • Anchor: https://www.anchor-lang.com"
'
WHERE id = 'ob-seed-web3-dev';

UPDATE configs SET install_count = 1345, custom_script = '#!/bin/bash

echo "🎨 Configuring Designer-Developer environment..."

if command -v node &> /dev/null; then
    echo "✓ Node.js ready for Tailwind/frontend builds"
fi

if command -v pnpm &> /dev/null; then
    pnpm config set store-dir ~/.pnpm-store
    echo "✓ pnpm configured"
fi

if command -v magick &> /dev/null || command -v convert &> /dev/null; then
    echo "✓ ImageMagick ready"
fi

if command -v ffmpeg &> /dev/null; then
    echo "✓ FFmpeg ready for video processing"
fi

if [ -d "/Applications/Figma.app" ]; then
    echo "✓ Figma installed"
fi

if [ ! -d "$HOME/design-handoff" ]; then
    mkdir -p "$HOME/design-handoff"
    echo "✓ Created ~/design-handoff directory"
fi

echo ""
echo "🚀 Quick commands:"
echo ""
echo "Optimize images:"
echo "  magick input.png -resize 50% output.png"
echo ""
echo "Convert video:"
echo "  ffmpeg -i input.mov -c:v libx264 output.mp4"
echo ""
echo "Create Tailwind project:"
echo "  pnpm create vite my-app -- --template react-ts"
echo "  cd my-app && pnpm add -D tailwindcss"
'
WHERE id = 'ob-seed-design-dev';

UPDATE configs SET install_count = 4521, custom_script = '#!/bin/bash

echo "🎓 Configuring Student/Beginner environment..."

if command -v git &> /dev/null; then
    echo "✓ Git ready"
    
    echo ""
    echo "Configure Git:"
    echo -n "  Enter your name: "
    read -r git_name
    echo -n "  Enter your email: "
    read -r git_email
    
    if [ -n "$git_name" ] && [ -n "$git_email" ]; then
        git config --global user.name "$git_name"
        git config --global user.email "$git_email"
        echo "✓ Git configured"
    fi
fi

if command -v node &> /dev/null; then
    echo "✓ Node.js $(node --version) ready"
fi

if command -v python3 &> /dev/null; then
    echo "✓ Python $(python3 --version | awk '\''{print $2}'\'') ready"
fi

if [ ! -d "$HOME/projects" ]; then
    mkdir -p "$HOME/projects"
    echo "✓ Created ~/projects directory"
fi

echo ""
echo "🚀 Your first steps:"
echo ""
echo "1. Test Git:"
echo "   git --version"
echo ""
echo "2. Create a project:"
echo "   mkdir ~/projects/hello-world && cd ~/projects/hello-world"
echo "   git init"
echo ""
echo "3. Write code:"
echo "   code ."
echo ""
echo "📚 Learning resources:"
echo "   • Git: https://git-scm.com/book"
echo "   • JavaScript: https://javascript.info"
echo "   • Python: https://docs.python.org/3/tutorial"
'
WHERE id = 'ob-seed-starter-kit';

UPDATE configs SET install_count = 678, custom_script = '#!/bin/bash

echo "✍️ Configuring Technical Writing environment..."

if command -v hugo &> /dev/null; then
    echo "✓ Hugo $(hugo version | awk '\''{print $2}'\'') ready"
fi

if command -v pandoc &> /dev/null; then
    echo "✓ Pandoc $(pandoc --version | head -1 | awk '\''{print $2}'\'') ready"
fi

if command -v asciinema &> /dev/null; then
    echo "✓ asciinema (terminal recorder) ready"
fi

if command -v ffmpeg &> /dev/null; then
    echo "✓ FFmpeg ready"
fi

if [ ! -d "$HOME/writing" ]; then
    mkdir -p "$HOME/writing"/{blog,docs,scripts}
    echo "✓ Created ~/writing directory structure"
fi

echo ""
echo "🚀 Quick start:"
echo ""
echo "Create Hugo blog:"
echo "  hugo new site ~/writing/blog"
echo "  cd ~/writing/blog"
echo "  hugo server"
echo ""
echo "Convert Markdown to PDF:"
echo "  pandoc input.md -o output.pdf"
echo ""
echo "Record terminal session:"
echo "  asciinema rec demo.cast"
echo ""
echo "📚 Docs:"
echo "  • Hugo: https://gohugo.io/documentation"
echo "  • Pandoc: https://pandoc.org/MANUAL.html"
'
WHERE id = 'ob-seed-tech-writer';
