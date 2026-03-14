#!/bin/sh
# install.sh - Instala o CLI e a extensão GNOME para Attack Shark X11
# Pré-requisitos: bun (obrigatório), acesso ao diretório ~/.local/share,
# (opcional) gnome-extensions para habilitar a extensão automaticamente.
# Este script é idempotente: pode ser executado várias vezes sem efeitos colaterais indesejados.

set -eu

info() { printf "[INFO] %s\n" "$*"; }
warn() { printf "[WARN] %s\n" "$*"; }
err() { printf "[ERROR] %s\n" "$*" 1>&2; }

# Detectar runner: bun preferido, fallback para npm (requer node)
# Bun é obrigatório
if command -v bun >/dev/null 2>&1; then
  INSTALL_CMD="bun install --frozen-lockfile"
else
  err "'bun' não encontrado. Instale bun e rode este script novamente: https://bun.sh"
  exit 2
fi

info "Usando runner: bun"

# Instalar dependências (idempotente)
info "Instalando dependências com: $INSTALL_CMD"
if ! bun install --frozen-lockfile; then
  err "Falha ao executar 'bun install'. Verifique sua instalação do bun."
  exit 3
fi

# Criar shim executável em ./bin/asx11-cli
BIN_DIR="./bin"
SHIM="$BIN_DIR/asx11-cli"
info "Criando shim do CLI em $SHIM"
mkdir -p "$BIN_DIR"
cat > "$SHIM" <<'SHIMEOF'
#!/bin/sh
# Shim gerado por install.sh. Requer bun em tempo de execução.
if command -v bun >/dev/null 2>&1; then
  exec bun run -- ./cli/index.ts "$@"
else
  echo "'bun' não encontrado em PATH. Instale bun: https://bun.sh" 1>&2
  exit 127
fi
SHIMEOF

chmod +x "$SHIM"
info "Shim criado e marcado como executável. Use './bin/asx11-cli' ou adicione ./bin ao seu PATH."

# Instalar a extensão GNOME
XDG_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
EXT_BASE="$XDG_DATA_HOME/gnome-shell/extensions"
EXT_UUID="attack-shark-x11@llucasshenrique"
EXT_TARGET="$EXT_BASE/$EXT_UUID"

info "Copiando extensão para: $EXT_TARGET"
mkdir -p "$EXT_BASE"
# Copiar de forma idempotente: copiar para um diretório temporário e mover
TMP_TARGET="$EXT_TARGET.tmp"
rm -rf "$TMP_TARGET"
mkdir -p "$TMP_TARGET"
if ! cp -a extension/. "$TMP_TARGET/" 2>/dev/null; then
  # fallback para cp -r se cp -a não disponível
  cp -r extension/. "$TMP_TARGET/"
fi
# Substituir atomically
rm -rf "$EXT_TARGET"
mv "$TMP_TARGET" "$EXT_TARGET"

# Ajustar permissões: garantir leitura para todos e execução para diretórios/scripts quando aplicável
info "Ajustando permissões na extensão instalada"
# Permitir leitura e execução de diretórios; leitura de arquivos
chmod -R u+rwX,go+rX "$EXT_TARGET" || warn "chmod falhou; verifique permissões manualmente"
# Tornar scripts .sh executáveis (se existirem)
find "$EXT_TARGET" -type f -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

# Tentar habilitar a extensão com gnome-extensions, se disponível
if command -v gnome-extensions >/dev/null 2>&1; then
  info "Tentando habilitar a extensão via 'gnome-extensions'"
  if gnome-extensions enable "$EXT_UUID"; then
    info "Extensão habilitada: $EXT_UUID"
  else
    warn "Falha ao habilitar extensão com 'gnome-extensions'. Você pode habilitar manualmente com: gnome-extensions enable $EXT_UUID"
  fi
else
  warn "Comando 'gnome-extensions' não encontrado. Instale-o (ex.: package gnome-shell-extensions) ou habilite manualmente: gnome-extensions enable $EXT_UUID"
fi

# Mensagem final de instruções
cat <<EOF
Instalação concluída com status de saída 0.
Para recarregar o GNOME Shell:
 - Wayland: saia e entre na sessão
 - X11: pressione Alt+F2, digite 'r' e pressione Enter

Testes rápidos (exemplos):
 - ./bin/asx11-cli battery
 - bun run ./cli/index.ts battery

Observações:
 - Este script não usa sudo. Se alguma etapa requer permissões elevadas, execute os comandos indicados manualmente com sudo.
 - Para tornar o comando global, adicione './bin' ao seu PATH ou mova './bin/asx11-cli' para um diretório em seu PATH.
EOF

exit 0
