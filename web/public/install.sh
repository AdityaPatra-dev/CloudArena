#!/usr/bin/env bash
set -e

# CloudArena Automated Linux & macOS Zero-Friction Installer
# Installs all required dependencies (Python, Docker, k3d, kubectl, CloudArena)
# Automatically skips components that are already installed.

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
RESET='\033[0m'

echo -e "${CYAN}================================================================${RESET}"
echo -e "${CYAN}   CloudArena Zero-Friction Installer for Linux & macOS         ${RESET}"
echo -e "${CYAN}   AI-Powered Sandboxed Kubernetes Survival Game                ${RESET}"
echo -e "${CYAN}================================================================${RESET}"

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$ARCH" in
    x86_64|amd64)
        K8S_ARCH="amd64"
        ;;
    arm64|aarch64)
        K8S_ARCH="arm64"
        ;;
    *)
        K8S_ARCH="$ARCH"
        ;;
esac

ARENA_HOME="$HOME/.cloudarena"
BIN_DIR="$ARENA_HOME/bin"
mkdir -p "$BIN_DIR" "$HOME/.local/bin"

# 1. Check / Install Python
echo -e "\n${WHITE}[1/5] Checking Python Runtime...${RESET}"
if command -v python3 &> /dev/null; then
    echo -e "  ${GREEN}✓ Python is already installed ($(python3 --version)). Skipping.${RESET}"
else
    echo -e "  ${YELLOW}⚙️ Python 3 not found. Installing Python automatically...${RESET}"
    if [ "$OS" = "Linux" ]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update -y && sudo apt-get install -y python3 python3-pip curl
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y python3 python3-pip curl
        elif command -v pacman &> /dev/null; then
            sudo pacman -S --noconfirm python python-pip curl
        fi
    elif [ "$OS" = "Darwin" ]; then
        if command -v brew &> /dev/null; then
            brew install python3
        fi
    fi
fi

# 2. Check / Install Docker
echo -e "\n${WHITE}[2/5] Checking Docker Engine & Daemon...${RESET}"
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo -e "  ${GREEN}✓ Docker is already installed and responsive. Skipping.${RESET}"
elif command -v docker &> /dev/null; then
    echo -e "  ${YELLOW}⚡ Docker CLI found, but daemon is stopped. Starting Docker service...${RESET}"
    if [ "$OS" = "Linux" ]; then
        sudo systemctl enable --now docker || sudo service docker start || true
        sudo usermod -aG docker "$USER" 2>/dev/null || true
    elif [ "$OS" = "Darwin" ]; then
        open -a Docker || true
    fi
    echo -e "  ${GREEN}✓ Docker service activated.${RESET}"
else
    echo -e "  ${YELLOW}⚙️ Docker not detected. Automatically installing Docker...${RESET}"
    if [ "$OS" = "Linux" ]; then
        curl -fsSL https://get.docker.com | sh
        sudo usermod -aG docker "$USER" 2>/dev/null || true
        sudo systemctl enable --now docker || true
        echo -e "  ${GREEN}✓ Docker Engine successfully installed!${RESET}"
    elif [ "$OS" = "Darwin" ]; then
        if command -v brew &> /dev/null; then
            brew install --cask docker
            open -a Docker || true
            echo -e "  ${GREEN}✓ Docker Desktop installed!${RESET}"
        else
            echo -e "  ${YELLOW}Please install Docker Desktop from https://www.docker.com/products/docker-desktop/${RESET}"
        fi
    fi
fi

# 3. Check / Download k3d
echo -e "\n${WHITE}[3/5] Checking Kubernetes Cluster Provisioner (k3d)...${RESET}"
K3D_BIN="$BIN_DIR/k3d"
if [ -f "$K3D_BIN" ] && [ -x "$K3D_BIN" ]; then
    echo -e "  ${GREEN}✓ k3d is already installed at $K3D_BIN. Skipping.${RESET}"
else
    echo -e "  ${CYAN}📦 Downloading k3d for $OS ($K8S_ARCH)...${RESET}"
    OS_LOWER=$(echo "$OS" | tr '[:upper:]' '[:lower:]')
    K3D_URL="https://github.com/k3d-io/k3d/releases/download/v5.7.4/k3d-${OS_LOWER}-${K8S_ARCH}"
    curl -sSL "$K3D_URL" -o "$K3D_BIN"
    chmod +x "$K3D_BIN"
    echo -e "  ${GREEN}✓ k3d installed successfully!${RESET}"
fi

# 4. Check / Download kubectl
echo -e "\n${WHITE}[4/5] Checking Kubernetes CLI (kubectl)...${RESET}"
KUBECTL_BIN="$BIN_DIR/kubectl"
if [ -f "$KUBECTL_BIN" ] && [ -x "$KUBECTL_BIN" ]; then
    echo -e "  ${GREEN}✓ kubectl is already installed at $KUBECTL_BIN. Skipping.${RESET}"
else
    echo -e "  ${CYAN}📦 Downloading kubectl for $OS ($K8S_ARCH)...${RESET}"
    OS_LOWER=$(echo "$OS" | tr '[:upper:]' '[:lower:]')
    KUBECTL_URL="https://dl.k8s.io/release/v1.30.2/bin/${OS_LOWER}/${K8S_ARCH}/kubectl"
    curl -sSL "$KUBECTL_URL" -o "$KUBECTL_BIN"
    chmod +x "$KUBECTL_BIN"
    echo -e "  ${GREEN}✓ kubectl installed successfully!${RESET}"
fi

# 5. Install CloudArena CLI via pip
echo -e "\n${WHITE}[5/5] Installing CloudArena Platform...${RESET}"
ARCHIVE_URL="https://github.com/AdityaPatra-dev/CloudArena/archive/refs/heads/main.zip"
python3 -m pip install --upgrade --user "$ARCHIVE_URL" > /dev/null 2>&1 || {
    if command -v pipx &> /dev/null; then
        pipx install "$ARCHIVE_URL" --force
    else
        python3 -m pip install --upgrade --user --break-system-packages "$ARCHIVE_URL"
    fi
}

# Symlink CLI
CLI_SOURCE="$(python3 -m site --user-base 2>/dev/null)/bin/cloudarena"
if [ -f "$CLI_SOURCE" ]; then
    ln -sf "$CLI_SOURCE" "$HOME/.local/bin/cloudarena"
fi

# Ensure ~/.cloudarena/bin and ~/.local/bin are in PATH
SHELL_RC=""
if [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
elif [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
fi

if [ -f "$SHELL_RC" ]; then
    if ! grep -q "$BIN_DIR" "$SHELL_RC"; then
        echo -e "\n# CloudArena Binaries" >> "$SHELL_RC"
        echo "export PATH=\"$BIN_DIR:\$HOME/.local/bin:\$PATH\"" >> "$SHELL_RC"
    fi
fi

echo -e "\n${GREEN}================================================================${RESET}"
echo -e "${GREEN}  🎉 All CloudArena dependencies are ready!                     ${RESET}"
echo -e "${GREEN}================================================================${RESET}"
echo -e "\n${WHITE}Next Steps:${RESET}"
echo -e "  1. Link your arena token:  ${CYAN}cloudarena link <YOUR_ARENA_TOKEN>${RESET}"
echo -e "  2. Run environment doctor: ${CYAN}cloudarena doctor${RESET}"
echo -e "  3. Spin up local cluster:  ${CYAN}cloudarena start${RESET}"
echo -e "  4. Enter Wave 1 battle:    ${CYAN}cloudarena wave start 1${RESET}\n"
