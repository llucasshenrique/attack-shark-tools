# Attack Shark X11 GNOME Integration CLI

This CLI wraps the `attack-shark-driver` so it can be invoked by the GNOME Shell Extension to read battery and set DPI/Polling rates.

## Setup and Permissions

Since the driver communicates using WebUSB/node-usb, you must add a `udev` rule to allow your user to access the device without `sudo`.

1. Create a file `/etc/udev/rules.d/99-attackshark.rules` with the following content (safer default: MODE=0660 and group plugdev):
```udev
SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa60", MODE="0660", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="1d57", ATTR{idProduct}=="fa55", MODE="0660", GROUP="plugdev"
```
*(Ensure your user is in the `plugdev` group and prefer MODE="0660" for less permissive access.)*

2. Reload the udev rules and trigger events:
```bash
sudo cp cli/udev/99-attack-shark.rules /etc/udev/rules.d/99-attack-shark.rules
sudo udevadm control --reload-rules && sudo udevadm trigger
```

3. Add your user to plugdev if needed:
```bash
sudo usermod -aG plugdev $USER
# then log out and log in, or run `newgrp plugdev` to activate immediately
```

4. Verify the device node permissions (replace BUS/DEV with values from lsusb):
```bash
ls -l /dev/bus/usb/BUS/DEV
# Example: ls -l /dev/bus/usb/001/015
```

5. Test the CLI (reconnect the dongle first):
```bash
bun run index.ts battery
```

## Usage

```bash
bun run index.ts battery
bun run index.ts dpi <0-5>
bun run index.ts polling <125|250|500|1000>
```

All commands output strict JSON.

## Dependência do driver comunitário

Este projeto usa o driver comunitário `attack-shark-x11-driver` hospedado no GitHub. A dependência foi adicionada no campo `dependencies` apontando para o repositório Git.

Instalação automática (recomendado, usando Bun):

```bash
bun add github:HarukaYamamoto0/attack-shark-x11-driver
```

Isto atualizará automaticamente `package.json` e `bun.lock`.

Instalação manual alternativa (npm/yarn):

- Usando npm:

```bash
npm install github:HarukaYamamoto0/attack-shark-x11-driver
```

Link local para desenvolvimento

- Com Bun (no diretório do pacote local):

```bash
# no diretório do attack-shark-x11-driver local
bun link
# no diretório deste projeto
bun link attack-shark-x11-driver
```

- Com npm/yarn:

```bash
# no diretório do attack-shark-x11-driver local
npm link
# no diretório deste projeto
npm link attack-shark-x11-driver
```

Import no código

Certifique-se de usar a importação padrão no código da CLI:

```ts
import * as Driver from "attack-shark-x11-driver"
```

Isto funcionará com a entrada especificada em `package.json`.

## Observações

- Se não houver Bun no ambiente, use os comandos npm acima.
- Commit foi realizado com a mensagem: `chore: add attack-shark-x11-driver dependency via git`.
