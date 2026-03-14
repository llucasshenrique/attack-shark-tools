#!/bin/bash
set -e

# Extension Metadata
UUID="attack-shark-x11@llucasshenrique"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
REPO_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

echo "==> Setting up Attack Shark X11 GNOME Integration..."

# 1. Setup CLI
echo "=> Setting up CLI dependencies..."
cd "$REPO_DIR/cli"
if command -v bun &> /dev/null; then
    bun install
else
    echo "Bun not found. Please install bun (https://bun.sh/) to run this utility."
    exit 1
fi

# 2. Add Udev Rules (requires sudo)
echo "=> Configuring udev rules (sudo may be required)..."
cat <<EOF | sudo tee /etc/udev/rules.d/99-attackshark.rules > /dev/null
SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa60", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa55", MODE="0666", GROUP="plugdev"
EOF
sudo udevadm control --reload-rules && sudo udevadm trigger

# 3. Install Extension
echo "=> Installing GNOME extension to $EXT_DIR..."
mkdir -p "$EXT_DIR"
cp -r "$REPO_DIR/extension/"* "$EXT_DIR/"

# 4. Copy CLI bundle into the extension (so extension.js can find it at this.path + '/cli/index.ts')
echo "=> Copying CLI locally into extension directory..."
mkdir -p "$EXT_DIR/cli"
cp -r "$REPO_DIR/cli/"* "$EXT_DIR/cli/"

# 5. Enable Extension
echo "=> Enabling extension..."
gnome-extensions enable "$UUID"

echo ""
echo "================================================="
echo " Installation Complete!"
echo "================================================="
echo "If this is an X11 session, press Alt+F2, type 'r', and press Enter to restart GNOME Shell."
echo "If this is a Wayland session, please log out and log back in to apply the extension."
echo "================================================="
