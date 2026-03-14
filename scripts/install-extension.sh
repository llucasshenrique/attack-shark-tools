#!/bin/sh
# scripts/install-extension.sh - Instala a extensão GNOME empacotada em ./dist/extension
# Executado pelo hook postpackage em package.json.

set -eu

info() { printf "[INFO] %s\n" "$*"; }
warn() { printf "[WARN] %s\n" "$*"; }
err() { printf "[ERROR] %s\n" "$*" 1>&2; }

EXT_UUID="attack-shark-x11@llucasshenrique"
EXT_SOURCE="./dist/extension"
XDG_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
EXT_BASE="$XDG_DATA_HOME/gnome-shell/extensions"
EXT_TARGET="$EXT_BASE/$EXT_UUID"

if [ ! -d "$EXT_SOURCE" ]; then
	err "Pacote da extensão não encontrado em '$EXT_SOURCE'."
	err "Execute 'bun run package' para gerar os artefatos antes de instalar."
	exit 2
fi

info "Garantindo diretório de extensões em $EXT_BASE"
mkdir -p "$EXT_BASE"

if [ -d "$EXT_TARGET" ]; then
	BACKUP_DIR="${EXT_TARGET}.backup.$(date +%s)"
	info "Criando backup da versão atual em: $BACKUP_DIR"
	if ! cp -a "$EXT_TARGET" "$BACKUP_DIR" 2>/dev/null; then
		warn "Falha ao criar backup via cp -a; tentando cp -r"
		cp -r "$EXT_TARGET" "$BACKUP_DIR" || warn "Backup não pôde ser criado; continuando"
	fi
fi

# Estratégia de cópia segura: staging em diretório temporário e troca no final.
TMP_TARGET="${EXT_TARGET}.install.tmp"
rm -rf "$TMP_TARGET"
mkdir -p "$TMP_TARGET"

info "Copiando extensão empacotada para staging: $TMP_TARGET"
if ! cp -a "$EXT_SOURCE/." "$TMP_TARGET/" 2>/dev/null; then
	cp -r "$EXT_SOURCE/." "$TMP_TARGET/"
fi

info "Substituindo instalação atual em: $EXT_TARGET"
rm -rf "$EXT_TARGET"
mv "$TMP_TARGET" "$EXT_TARGET"

info "Ajustando permissões"
chmod -R u+rwX,go+rX "$EXT_TARGET" || warn "Falha ao ajustar permissões recursivas"
find "$EXT_TARGET" -type f -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

if command -v gnome-extensions >/dev/null 2>&1; then
	info "Tentando habilitar extensão via gnome-extensions"
	if gnome-extensions enable "$EXT_UUID"; then
		info "Extensão habilitada: $EXT_UUID"
	else
		warn "Não foi possível habilitar automaticamente."
		warn "Habilite manualmente com: gnome-extensions enable $EXT_UUID"
	fi
else
	warn "Comando 'gnome-extensions' não encontrado."
	warn "Habilite manualmente com: gnome-extensions enable $EXT_UUID"
fi

SESSION_TYPE="${XDG_SESSION_TYPE:-unknown}"

cat <<EOF
Instalação da extensão empacotada concluída.

UUID: $EXT_UUID
Origem: $EXT_SOURCE
Destino: $EXT_TARGET

Para recarregar o GNOME Shell:
EOF

case "$SESSION_TYPE" in
	x11|X11)
		printf " - [X11] Pressione Alt+F2, digite 'r' e pressione Enter\n"
		;;
	wayland|Wayland)
		printf " - [Wayland] Faça log out e log in da sessão\n"
		;;
	*)
		printf " - [Sessão desconhecida] X11: Alt+F2 -> r; Wayland: log out/log in\n"
		;;
esac

exit 0
