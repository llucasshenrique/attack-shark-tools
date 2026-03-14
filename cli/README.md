# Attack Shark X11 GNOME Integration CLI

This CLI wraps the `attack-shark-driver` so it can be invoked by the GNOME Shell Extension to read battery and set DPI/Polling rates.

## Setup and Permissions

Since the driver communicates using WebUSB/node-usb, you must add a `udev` rule to allow your user to access the device without `sudo`.

1. Create a file `/etc/udev/rules.d/99-attackshark.rules` with the following content:
```udev
SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa60", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa55", MODE="0666", GROUP="plugdev"
```
*(Ensure your user is in the `plugdev` group, or simply rely on `MODE="0666"`)*

2. Reload the udev rules:
```bash
sudo udevadm control --reload-rules && sudo udevadm trigger
```

## Usage

```bash
bun run index.ts battery
bun run index.ts dpi <0-5>
bun run index.ts polling <125|250|500|1000>
```

All commands output strict JSON.
