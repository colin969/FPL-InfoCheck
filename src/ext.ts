import * as flashpoint from 'flashpoint-launcher';
import open from 'open';
import * as fs from 'fs';
import * as path from 'path';

export async function activate(_context: flashpoint.ExtensionContext) {
  flashpoint.services.onServiceNew(s => {
    if (process.platform === 'win32' && s.id.startsWith('game.')) {
      setTimeout(checkPhpRouter, 3000);
    } else {
      s.on('exit', (code, _signal) => checkServiceExit(s, code));
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
    /** Missing, bad */
    showInfoPopup({
      title: 'Missing Required File',
      message: `A required file is missing:\n- ${phpPath}\n\nPlease check the wiki for guidance.`,
      buttons: ['Open Wiki', 'Close'],
      cancelId: 1
    }, 'https://bluemaxima.org/flashpoint/datahub/Troubleshooting_Antivirus_Interference');
  })
}

async function checkServiceExit(service: flashpoint.ManagedChildProcess, code: number) {
  let message, helpURL, helpSection;
  // On Mac/Linux, a service exits with code 127 if the executable doesn't exist
  if (code === 127) {
    if (process.platform === 'linux') {
      helpURL = 'https://bluemaxima.org/flashpoint/datahub/Linux_Support';
      helpSection = '#Dependencies';
    } else if (process.platform === 'darwin') {
      helpURL = 'https://bluemaxima.org/flashpoint/datahub/Mac_Support';
      helpSection = '#Troubleshooting';
    }
    if (service.id === 'server' || service.id.startsWith('daemon_')) {
      message = {
        title: 'Service Failed to Start',
        message: `The ${service.name} service failed to start.\n\nPlease check the wiki for guidance.`
      };
    } else if (service.id.startsWith('game.')) {
      if (service.info.filename.startsWith('wine')) {
        // The "filename" will be something like 'wine start /wait /unix [path to EXE file]'
        message = {
          title: 'Wine Failed to Start',
          message: 'Wine is required to run this game or animation, but was not found.\n\nPlease check the wiki for guidance.'
        };
      } else {
        helpSection = '#Technologies';
        message = {
          title: 'Unsupported Game or Animation',
          message: 'Flashpoint does not yet support this game or animation on your operating system.\n\nPlease check the wiki for information.'
        };
      }
    }
  }
  if (message && helpURL && helpSection) {
    showInfoPopup({...message, buttons: ['Open Wiki', 'Close'], cancelId: 1}, helpURL + helpSection);
  }
}

async function showInfoPopup(options: flashpoint.ShowMessageBoxOptions, infoURL: string) {
  try {
    const res = await flashpoint.dialogs.showMessageBox(options);
    if (res === 0) {
      await open(infoURL);
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'No suitable client for dialog func.') {
      // Backend hasn't finished initializing yet
      flashpoint.onDidConnect(_e => {showInfoPopup(options, infoURL)})
    }
  }
}