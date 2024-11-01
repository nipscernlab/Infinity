import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import https from 'https';
import http from 'http';
import os from 'os'; // Import the 'os' module

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create custom download directory
const customDownloadPath = path.join(app.getPath('downloads'), 'Infinity Manager');
if (!fs.existsSync(customDownloadPath)) {
  fs.mkdirSync(customDownloadPath, { recursive: true });
}

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: "Infinity Manager",
    icon: path.join(__dirname, 'icons/infinity_77973-3.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  // Remove the default menu
  Menu.setApplicationMenu(null);

  mainWindow.loadFile('index.html');

  // Handle the close-app message
  ipcMain.on('close-app', () => {
    console.log('Received close-app message. Closing application...');
    mainWindow.close(); // Close the main window
  });

  mainWindow.on('closed', () => {
    mainWindow = null; // Dereference the window object
  });
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const downloadUrls = {
  'vscode': 'https://aka.ms/win32-x64-user-stable',
  'brackets': 'https://github.com/brackets-cont/brackets/releases/latest/download/Brackets-2.2.1.exe',
  'drawio': 'https://github.com/jgraph/drawio-desktop/releases/download/v24.7.17/draw.io-24.7.17-windows-installer.exe',
  'sumatra': 'https://www.sumatrapdfreader.org/dl/rel/3.5.2/SumatraPDF-3.5.2-64-install.exe',
  'sapho': '', // Please provide a valid URL if available
  'github-desktop': 'https://github.com/desktop/desktop/releases/download/release-3.4.8/GitHubDesktopSetup-x64.exe',
  'visual-studio': 'https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=Enterprise&channel=Release&version=VS2022&source=VSLandingPage&cid=2030&passive=false',
  'firefox': 'https://www.mozilla.org/en-US/firefox/download/thanks/',
  'quartus': 'https://fpgasoftware.intel.com/21.1.1/installer/QuartusSetup-21.1.1.820-windows.exe',
  'everything': 'https://www.voidtools.com/Everything-1.4.1.1026.x64-Setup.exe',
  'codeblocks': 'https://www.fosshub.com/Code-Blocks.html?dwl=codeblocks-20.03mingw-setup.exe',
  'inno-setup': 'https://jrsoftware.org/download.php/is.exe?site=1'
};


class Download {
  constructor(url, filename, event) {
    this.url = url;
    this.filename = filename;
    this.event = event;
    this.downloaded = 0;
    this.total = 0;
    this.paused = false;
    this.request = null;
    this.fileStream = null;
    this.isPausing = false;
    // Update download path to use custom directory
    this.downloadPath = path.join(customDownloadPath, this.filename);
  }

  async start() {
    try {
      // Check for partially downloaded file
      if (fs.existsSync(this.downloadPath)) {
        this.downloaded = fs.statSync(this.downloadPath).size;
      }

      this.fileStream = fs.createWriteStream(this.downloadPath, { 
        flags: this.downloaded ? 'a' : 'w' 
      });
      
      return new Promise((resolve, reject) => {
        const makeRequest = (url) => {
          const protocol = url.startsWith('https') ? https : http;
          const headers = this.downloaded ? { Range: `bytes=${this.downloaded}-` } : {};
          
          this.request = protocol.get(url, { headers }, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
              this.url = response.headers.location;
              this.request.destroy();
              makeRequest(this.url);
              return;
            }

            if (response.statusCode === 200 || response.statusCode === 206) {
              this.total = parseInt(response.headers['content-length']) + (this.downloaded || 0);
              
              response.on('data', (chunk) => {
                if (this.isPausing) {
                  response.destroy();
                  return;
                }
                
                this.downloaded += chunk.length;
                this.fileStream.write(chunk);
                
                this.event.sender.send('download-progress', {
                  software: this.filename.split('-')[0],
                  progress: {
                    percent: this.downloaded / this.total,
                    transferred: this.downloaded,
                    total: this.total
                  }
                });
              });

              response.on('end', () => {
                if (!this.isPausing) {
                  this.fileStream.end();
                  resolve(this.downloadPath);
                }
              });
            } else {
              reject(new Error(`HTTP Error: ${response.statusCode}`));
            }
          });

          this.request.on('error', (error) => {
            this.fileStream.end();
            reject(error);
          });
        };

        makeRequest(this.url);
      });
    } catch (error) {
      throw error;
    }
  }

  pause() {
    this.isPausing = true;
    if (this.request) {
      this.request.destroy();
    }
    if (this.fileStream) {
      this.fileStream.end();
    }
    this.paused = true;
  }

  resume() {
    this.isPausing = false;
    this.paused = false;
    return this.start();
  }
}

const downloads = new Map();

ipcMain.on('start-download', async (event, software) => {
  const url = downloadUrls[software];
  const filename = `${software}-setup.exe`;
  
  try {
    const download = new Download(url, filename, event);
    downloads.set(software, download);
    
    const downloadPath = await download.start();
    if (!download.isPausing) {
      event.sender.send('download-complete', { software, path: downloadPath });
    }
  } catch (error) {
    console.error('Download error:', error);
    event.sender.send('download-error', { software, error: error.message });
  }
});

ipcMain.on('pause-download', (event, software) => {
  const download = downloads.get(software);
  if (download) {
    download.pause();
    event.sender.send('download-paused', { software });
  }
});

ipcMain.on('resume-download', async (event, software) => {
  const download = downloads.get(software);
  if (download) {
    try {
      const downloadPath = await download.resume();
      if (download.downloaded === download.total) {
        event.sender.send('download-complete', { software, path: downloadPath });
      }
    } catch (error) {
      console.error('Resume error:', error);
      event.sender.send('download-error', { software, error: error.message });
    }
  }
});

ipcMain.on('open-installer', (event, software) => {
  // Update installer path to use custom directory
  const downloadPath = path.join(customDownloadPath, `${software}-setup.exe`);
  if (fs.existsSync(downloadPath)) {
    exec(`"${downloadPath}"`, (error) => {
      if (error) {
        console.error('Error opening installer:', error);
        event.sender.send('download-error', { 
          software, 
          error: 'Failed to open installer: ' + error.message 
        });
      }
    });
  }
});

// Function to open the folder
function openInfinityManagerFolder() {
  // Construct the path to the Downloads/Infinity Manager folder
  const downloadsPath = path.join(os.homedir(), 'Downloads'); // Use 'os' to get the home directory
  const folderPath = path.join(downloadsPath, 'Infinity Manager');

  // Check if the folder exists
  if (!fs.existsSync(folderPath)) {
      // Create the folder if it does not exist
      fs.mkdirSync(folderPath, { recursive: true });
      console.log('Infinity Manager folder created at:', folderPath);
  } else {
      console.log('Infinity Manager folder already exists at:', folderPath);
  }

  // Open the folder
  shell.openPath(folderPath).catch(err => {
      console.error(`Failed to open folder: ${err}`);
  });
}

// IPC listener for opening the folder
ipcMain.on('open-infinity-folder', () => {
    openInfinityManagerFolder();
});