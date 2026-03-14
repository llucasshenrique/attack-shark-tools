# Changelog

All notable changes to this project will be documented in this file.

## [0.1.2] - 2026-03-14
### Added
- Automatic packaged extension installation via `scripts/install-extension.sh` in `postpackage`.
- Documentation for `bun run package` build+install flow.

### Changed
- Migrated GNOME extension entrypoint to current class-based `Extension` API style.
- Extension now resolves CLI by preferring bundled `attack-shark-cli` and falling back to Bun in development.
- Extension menu now exposes all configured DPI stages (`800`, `1600`, `2400`, `3200`, `5000`, `22000`) and polling rates (`125`, `250`, `500`, `1000`).

### Fixed
- Corrected DPI switching mismatch between extension UI values and CLI accepted parameters.
- CLI `dpi` command now accepts stage input and mapped DPI values used by the extension.

## [0.1.0] - 2026-03-14
### Added
- Initial implementation of CLI commands: `battery`, `dpi`, `polling` with JSON output.
- GNOME Shell extension (GNOME 45+ compatible) providing tray UI for battery, DPI and polling configuration.
- `install.sh` script to install dependencies and copy the extension to the user extensions folder.
- udev rules file `cli/udev/99-attack-shark.rules` and documentation to avoid needing sudo for normal usage.

### Fixed
- Ensure CLI outputs JSON on stdout and logs to stderr to avoid breaking the GNOME extension parser.

### Notes
- Driver dependency is included via Git: `github:HarukaYamamoto0/attack-shark-x11-driver`.
