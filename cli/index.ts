import { AttackSharkX11, ConnectionMode, Button, Rate, DpiBuilder } from 'attack-shark-driver';
import type { Logger } from 'attack-shark-driver';

// Silent logger so we only output our JSON
const silentLogger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {}
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(JSON.stringify({ error: 'No command specified. Usage: battery | dpi <stage> | polling <rate>' }));
    process.exit(1);
  }

  let driver: AttackSharkX11;
  try {
    // Try Adapter first, then Wired if Adapter is not found
    try {
      driver = new AttackSharkX11({ connectionMode: ConnectionMode.Adapter, logger: silentLogger });
    } catch (adapterErr) {
      driver = new AttackSharkX11({ connectionMode: ConnectionMode.Wired, logger: silentLogger });
    }
  } catch (err: any) {
    console.log(JSON.stringify({ error: `Device not found or not connected: ${err.message}` }));
    process.exit(1);
  }

  try {
    await driver.open();
  } catch (err: any) {
    if (err.message?.includes('claim') || err.message?.includes('LIBUSB_ERROR_ACCESS')) {
      console.log(JSON.stringify({ error: `Permission denied. Ensure udev rules are set. Details: ${err.message}` }));
    } else {
      console.log(JSON.stringify({ error: `Failed to open device: ${err.message}` }));
    }
    process.exit(1);
  }

  try {
    switch (command) {
      case 'battery': {
        const battery = await driver.getBatteryLevel(3000);
        console.log(JSON.stringify({ level: battery }));
        break;
      }

      case 'dpi': {
        const stageStr = args[1];
        if (!stageStr) {
          console.log(JSON.stringify({ error: 'DPI stage undefined. Usage: dpi <stage>' }));
          break;
        }
        
        const stage = parseInt(stageStr, 10);
        // Ensure stage is between 0 and 5
        if (stage < 0 || stage > 5 || isNaN(stage)) {
          console.log(JSON.stringify({ error: 'DPI stage must be between 0 and 5' }));
          break;
        }

        const dpiBuilder = new DpiBuilder({ activeStage: stage });
        await driver.setDpi(dpiBuilder);
        console.log(JSON.stringify({ success: true, stage }));
        break;
      }

      case 'polling': {
        const rateStr = args[1];
        if (!rateStr) {
          console.log(JSON.stringify({ error: 'Polling rate undefined. Usage: polling <125|250|500|1000>' }));
          break;
        }

        const rateNum = parseInt(rateStr, 10);
        let rateEnum: Rate;
        
        if (rateNum === 125) rateEnum = Rate.powerSaving;
        else if (rateNum === 250) rateEnum = Rate.office;
        else if (rateNum === 500) rateEnum = Rate.gaming;
        else if (rateNum === 1000) rateEnum = Rate.eSports;
        else {
          console.log(JSON.stringify({ error: 'Invalid rate. Must be 125, 250, 500, or 1000.' }));
          break;
        }

        await driver.setPollingRate(rateEnum);
        console.log(JSON.stringify({ success: true, rate: rateNum }));
        break;
      }

      default:
        console.log(JSON.stringify({ error: `Unknown command: ${command}` }));
        break;
    }
  } catch (err: any) {
    if (err.name === 'TimeoutError') {
      console.log(JSON.stringify({ error: 'Timeout waiting for device response. Is the mouse sleeping or wired?' }));
    } else {
      console.log(JSON.stringify({ error: `Command execution failed: ${err.message}` }));
    }
  } finally {
    await driver.close();
  }
}

main().catch(err => {
  console.log(JSON.stringify({ error: `Unhandled exception: ${err.message}` }));
  process.exit(1);
});