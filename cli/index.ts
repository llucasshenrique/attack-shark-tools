import { type StageIndex, AttackSharkX11, ConnectionMode, Rate, DpiBuilder } from 'attack-shark-x11-driver/src';
import { silentLogger } from './logger';
import {fileURLToPath} from 'bun'

const isBun = (globalThis as any).Bun !== 'undefined' || !!process.env.BUN_ENV;

const writeJson = (obj: any) => {
  try {
    process.stdout.write(JSON.stringify(obj) + '\n');
  } catch (e) {
    process.stdout.write(JSON.stringify({ error: 'Internal serialization error', details: String(e) }) + '\n');
  }
};

const parseDpiInputToStage = (input: string): StageIndex | null => {
  const value = Number.parseInt(input, 10);
  if (Number.isNaN(value)) return null;

  // Preferred stage input format from driver: 1..6.
  if (value >= 1 && value <= 6) return value as StageIndex;

  // Backward compatibility for old callers that sent 0..5.
  if (value >= 0 && value <= 5) return (value + 1) as StageIndex;

  // UI compatibility: extension sends user-friendly DPI values.
  if (value === 800) return 1 as StageIndex;
  if (value === 1600) return 2 as StageIndex;
  if (value === 2400) return 3 as StageIndex;
  if (value === 3200) return 4 as StageIndex;
  if (value === 5000) return 5 as StageIndex;
  if (value === 22000) return 6 as StageIndex;

  return null;
};

export async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    writeJson({ error: 'No command specified. Usage: battery | dpi <1..6|800|1600|2400|3200|5000|22000> | polling <125|250|500|1000>' });
    process.exit(1);
  }

  let driver: any;

  try {
    try {
      driver = new AttackSharkX11({ connectionMode: ConnectionMode.Adapter, logger: silentLogger });
    } catch (_e) {
      driver = new AttackSharkX11({ connectionMode: ConnectionMode.Wired, logger: silentLogger });
    }
  } catch (err: any) {
    // Device not found
    writeJson({ error: 'Device not connected' });
    process.exit(2);
  }

  try {
    await driver.open();
  } catch (err: any) {
    const msg = String(err?.message ?? err).toLowerCase();
    if (msg.includes('claim') || msg.includes('libusb_error_access') || msg.includes('permission')) {
      writeJson({ error: 'Permission denied' });
    } else {
      writeJson({ error: String(err?.message ?? 'Failed to open device') });
    }
    process.exit(3);
  }

  try {
    switch (command) {
      case 'battery': {
        const level = await driver.getBatteryLevel?.(3000);
        writeJson({ level });
        break;
      }

      case 'dpi': {
        const dpiOrStage = args[1];
        if (!dpiOrStage) {
          writeJson({ error: 'DPI value/stage undefined. Usage: dpi <1..6|800|1600|2400|3200|5000|22000>' });
          process.exit(4);
        }

        const stage = parseDpiInputToStage(dpiOrStage);
        if (stage === null) {
          writeJson({ error: 'Invalid DPI input. Use stage 1..6 or DPI 800/1600/2400/3200/5000/22000' });
          process.exit(4);
        }

        const dpiBuilder = new DpiBuilder({ activeStage: stage });
        await driver.setDpi(dpiBuilder);
        writeJson({ ok: true });
        break;
      }

      case 'polling': {
        const rateStr = args[1];
        if (!rateStr) {
          writeJson({ error: 'Polling rate undefined. Usage: polling <125|250|500|1000>' });
          process.exit(4);
        }
        const rateNum = Number.parseInt(rateStr, 10);
        let rateEnum: any = null;
        if (rateNum === 125) rateEnum = Rate?.powerSaving;
        else if (rateNum === 250) rateEnum = Rate?.office;
        else if (rateNum === 500) rateEnum = Rate?.gaming;
        else if (rateNum === 1000) rateEnum = Rate?.eSports;
        if (!rateEnum) {
          writeJson({ error: 'Invalid rate. Must be 125, 250, 500, or 1000.' });
          process.exit(4);
        }
        await driver.setPollingRate(rateEnum);
        writeJson({ ok: true });
        break;
      }

      default:
        writeJson({ error: `Unknown command: ${command}` });
        process.exit(1);
    }
  } catch (err: any) {
    const name = err?.name;
    if (name === 'TimeoutError') {
      writeJson({ error: 'Timeout waiting for device response' });
      process.exit(5);
    }
    writeJson({ error: String(err?.message ?? 'Command execution failed') });
    process.exit(6);
  } finally {
    try {
      if (driver && driver.close) await driver.close();
    } catch (_e) {
      // ignore
    }
  }
}

// Execute when run directly
try {
  const entry = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] || '';
  if (invoked === entry || invoked.endsWith('/index.ts') || invoked.endsWith('/index.js')) {
    main().catch(err => {
      writeJson({ error: String(err?.message ?? 'Unhandled exception') });
      process.exit(1);
    });
  }
} catch (e) {
  // ignore
}
