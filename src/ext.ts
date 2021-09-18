import * as flashpoint from 'flashpoint-launcher';
import open from 'open';
import * as fs from 'fs';
import * as path from 'path';

export async function activate(context: flashpoint.ExtensionContext) {
  flashpoint.services.onServiceNew(s => {
    if (s.id.startsWith('game.')) {
      setTimeout(checkPhpRouter, 3000);
    }
  })
}

async function checkPhpRouter() {
  const phpPath = path.join(flashpoint.config.flashpointPath, 'Legacy', 'router.php');
  fs.promises.access(phpPath)
  .then(() => {
    /** Exists, good */
  })
  .catch(async () => {
    /** Misisng, bad */
    const res = await flashpoint.dialogs.showMessageBox({
      title: 'Missing Required File',
      message: `A required file is missing:\n- ${phpPath}\n\nPlease check the wiki for guidance.`,
      buttons: ['Open Wiki', 'Close'],
      cancelId: 1
    });
    if (res === 0) {
      await open('https://bluemaxima.org/flashpoint/datahub/Troubleshooting_Antivirus_Interference');
    }
  })
}