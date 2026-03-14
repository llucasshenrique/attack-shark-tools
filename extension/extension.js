import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class AttackSharkExtension extends Extension {
    enable() {
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

        // Battery Label
        this._batteryLabel = new St.Label({
            text: '🔋 Mouse...',
            y_align: Clutter.ActorAlign.CENTER,
        });
        
        // Add to panel
        this._indicator.add_child(this._batteryLabel);

        // DPI Menu
        const dpiItem = new PopupMenu.PopupSubMenuMenuItem('DPI Settings');
        const dpis = [
            { label: 'Stage 1 (Red)', value: 0 },
            { label: 'Stage 2 (Blue)', value: 1 },
            { label: 'Stage 3 (Green)', value: 2 },
            { label: 'Stage 4 (Purple)', value: 3 },
            { label: 'Stage 5 (Yellow)', value: 4 },
            { label: 'Stage 6 (Cyan)', value: 5 }
        ];

        dpis.forEach(dpi => {
            const item = new PopupMenu.PopupMenuItem(dpi.label);
            item.connect('activate', () => {
                this._runCliCommand(['dpi', dpi.value.toString()]);
            });
            dpiItem.menu.addMenuItem(item);
        });
        this._indicator.menu.addMenuItem(dpiItem);

        // Polling Rate Menu
        const pollingItem = new PopupMenu.PopupSubMenuMenuItem('Polling Rate');
        const rates = [125, 250, 500, 1000];

        rates.forEach(rate => {
            const item = new PopupMenu.PopupMenuItem(`\${rate} Hz`);
            item.connect('activate', () => {
                this._runCliCommand(['polling', rate.toString()]);
            });
            pollingItem.menu.addMenuItem(item);
        });
        this._indicator.menu.addMenuItem(pollingItem);

        Main.panel.addToStatusArea(this.uuid, this._indicator);

        // Initial Battery Check
        this._checkBattery();
        
        // Background loop for battery (every 5 minutes / 300 seconds)
        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 300, () => {
            this._checkBattery();
            return GLib.SOURCE_CONTINUE;
        });
    }

    disable() {
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }

    _checkBattery() {
        this._runCliCommand(['battery'], (output) => {
            try {
                const data = JSON.parse(output);
                if (data.level !== undefined) {
                    if (data.level === -1) {
                         this._batteryLabel.set_text(`🖱️ Wired`);
                    } else {
                         this._batteryLabel.set_text(`🔋 \${data.level}%`);
                    }
                } else if (data.error) {
                    this._batteryLabel.set_text(`⚠️ N/A`);
                }
            } catch (e) {
                console.error(`[AttackSharkX11] Error parsing battery JSON: \${e}`);
                this._batteryLabel.set_text(`⚠️ Error`);
            }
        });
    }

    _runCliCommand(args, callback = null) {
        try {
            // The extension path
            const cliPath = this.path + '/cli/index.ts';
            
            // Note: bun must be in the PATH of the GNOME session
            const proc = Gio.Subprocess.new(
                ['bun', 'run', cliPath, ...args],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );

            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    const [, stdout, stderr] = proc.communicate_utf8_finish(res);
                    
                    if (!proc.get_successful()) {
                        console.error(`[AttackSharkX11] CLI failed: \${stderr}`);
                    }
                    
                    if (callback && stdout) {
                         callback(stdout.trim());
                    }
                } catch (e) {
                    console.error(`[AttackSharkX11] Async exec error: \${e}`);
                }
            });
        } catch (e) {
            console.error(`[AttackSharkX11] Failed to start subprocess: \${e}`);
        }
    }
}
