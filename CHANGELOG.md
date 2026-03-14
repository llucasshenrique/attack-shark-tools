# Changelog

All notable changes to this project will be documented in this file.

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
