#!/usr/bin/env bash
# CloudArena One-Line Automated Installer for Linux and macOS
set -e

BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

echo -e "${CYAN}${BOLD}"
cat << "EOF"
   ___ _                 _   _                         
  / __\ | ___  _   _  __| | /_\  _ __ ___ _ __   __ _  
 / /  | |/ _ \| | | |/ _` |//_\\| '__/ _ \ '_ \ / _` | 
/ /___| | (_) | |_| | (_| /  _  \ | |  __/ | | | (_| | 
\____/|_|\___/ \__,_|\__,_\_/ \_/_|  \___|_| |_|\__,_| 
EOF
echo -e "${RESET}"
echo -e "${BOLD}AI-Powered Cloud Infrastructure Survival Arena • Installer${RESET}"
echo "--------------------------------------------------------"

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ python3 is required but not installed.${RESET}"
    echo "Please install Python 3.10+ and re-run this script."
    exit 1
fi

PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo -e "✓ Found Python ${CYAN}${PY_VER}${RESET}"

# 2. Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git is required but not installed.${RESET}"
    echo "Please install git (e.g. sudo apt install git / brew install git) and re-run."
    exit 1
fi
echo -e "✓ Found git"

# 3. Check Docker
if command -v docker &> /dev/null; then
    echo -e "✓ Found Docker ($(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',' || echo 'installed'))"
else
    echo -e "${YELLOW}⚠️ Docker was not found on your system.${RESET}"
    echo "You will need Docker Desktop or Docker Engine installed to spin up Kubernetes clusters."
fi

# 4. Install CloudArena CLI via pip
echo -e "\n${CYAN}📦 Installing CloudArena CLI...${RESET}"
python3 -m pip install --upgrade --user git+https://github.com/AdityaPatra-dev/CloudArena.git > /dev/null 2>&1 || {
    echo -e "${YELLOW}pip --user install encountered managed environment. Using pipx / virtualenv fallback...${RESET}"
    if command -v pipx &> /dev/null; then
        pipx install git+https://github.com/AdityaPatra-dev/CloudArena.git --force
    else
        python3 -m pip install --upgrade --user --break-system-packages git+https://github.com/AdityaPatra-dev/CloudArena.git || {
            echo -e "${RED}❌ Could not install package via pip. Please clone https://github.com/AdityaPatra-dev/CloudArena and run pip install .${RESET}"
            exit 1
        }
    fi
}

# 5. Ensure ~/.local/bin is in PATH
USER_BIN="$HOME/.local/bin"
if [[ ":$PATH:" != *":$USER_BIN:"* ]]; then
    export PATH="$USER_BIN:$PATH"
    SHELL_RC="$HOME/.bashrc"
    if [ -f "$HOME/.zshrc" ]; then
        SHELL_RC="$HOME/.zshrc"
    fi
    echo "export PATH=\"$USER_BIN:\$PATH\"" >> "$SHELL_RC"
    echo -e "${YELLOW}ℹ️ Added $USER_BIN to your $SHELL_RC${RESET}"
fi

# 6. Verify command
if command -v cloudarena &> /dev/null; then
    echo -e "${GREEN}${BOLD}✓ CloudArena CLI successfully installed!${RESET}"
else
    echo -e "${YELLOW}Installed to $USER_BIN/cloudarena. Please restart your terminal or run:${RESET}"
    echo "export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

echo -e "\n${BOLD}Next Steps:${RESET}"
echo -e "  1. Link your laptop:     ${CYAN}cloudarena link <YOUR_ARENA_TOKEN>${RESET}"
echo -e "  2. Start your cluster:   ${CYAN}cloudarena start${RESET}"
echo -e "  3. Enter Wave 1 battle:  ${CYAN}cloudarena wave start 1${RESET}\n"
