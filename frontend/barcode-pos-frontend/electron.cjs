const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const { setupAutoUpdater } = require('./auto-updater.cjs');

const isDev = !app.isPackaged;
const API_PORT = 5050;
const API_URL = `http://localhost:${API_PORT}`;

let backendProcess = null;
let mainWindow = null;
let splashWindow = null;

// ── Backend .exe yolunu bul ──
function getBackendPath() {
  if (isDev) {
    // Geliştirmede: backend klasöründen çalıştır
    return path.join(__dirname, '..', '..', 'backend', 'BarcodePos.API', 'bin', 'Debug', 'net10.0', 'BarcodePos.API.exe');
  }
  // Production: extraResources/backend/ klasöründen
  return path.join(process.resourcesPath, 'backend', 'BarcodePos.API.exe');
}

// ── Backend'i başlat ──
function startBackend() {
  return new Promise((resolve, reject) => {
    const exePath = getBackendPath();
    console.log('[Electron] Backend başlatılıyor:', exePath);

    const env = {
      ...process.env,
      ASPNETCORE_ENVIRONMENT: 'Production',
      ASPNETCORE_URLS: API_URL,
    };

    backendProcess = spawn(exePath, [], {
      cwd: path.dirname(exePath),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`[Backend] ${data.toString().trim()}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend ERR] ${data.toString().trim()}`);
    });

    backendProcess.on('error', (err) => {
      console.error('[Electron] Backend başlatılamadı:', err);
      reject(err);
    });

    backendProcess.on('exit', (code) => {
      console.log(`[Electron] Backend kapandı (code: ${code})`);
      backendProcess = null;
    });

    // Backend'in hazır olmasını bekle
    waitForBackend(resolve, reject, 0);
  });
}

// ── Backend health check ile hazır olmasını bekle ──
function waitForBackend(resolve, reject, attempt) {
  if (attempt > 30) {
    reject(new Error('Backend 30 saniyede başlatılamadı.'));
    return;
  }

  http.get(`${API_URL}/health`, (res) => {
    if (res.statusCode === 200) {
      console.log('[Electron] Backend hazır!');
      resolve();
    } else {
      setTimeout(() => waitForBackend(resolve, reject, attempt + 1), 1000);
    }
  }).on('error', () => {
    setTimeout(() => waitForBackend(resolve, reject, attempt + 1), 1000);
  });
}

// ── Backend'i durdur ──
function stopBackend() {
  if (backendProcess) {
    console.log('[Electron] Backend durduruluyor...');
    backendProcess.kill('SIGTERM');
    // Windows'da SIGTERM çalışmazsa zorla kapat
    setTimeout(() => {
      if (backendProcess) {
        backendProcess.kill('SIGKILL');
      }
    }, 3000);
    backendProcess = null;
  }
}

// ── Splash (yükleniyor) penceresi ──
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  splashWindow.loadURL(`data:text/html;charset=utf-8,
    <html>
    <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;
      background:linear-gradient(135deg,%231e293b,%232563eb);font-family:system-ui;color:white;
      border-radius:16px;user-select:none;">
      <div style="text-align:center">
        <div style="font-size:48px;margin-bottom:16px">💰</div>
        <div style="font-size:22px;font-weight:bold;margin-bottom:8px">KasaPlus</div>
        <div style="font-size:13px;opacity:0.8;margin-bottom:20px">Akıllı Satış Noktası</div>
        <div style="font-size:12px;opacity:0.6">Sistem başlatılıyor...</div>
        <div style="margin-top:16px;width:200px;height:4px;background:rgba(255,255,255,0.2);
          border-radius:2px;overflow:hidden;margin-left:auto;margin-right:auto">
          <div style="width:40%;height:100%;background:white;border-radius:2px;
            animation:loading 1.5s ease infinite">
          </div>
        </div>
      </div>
      <style>
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      </style>
    </body>
    </html>
  `);
}

// ── Ana uygulama penceresi ──
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'KasaPlus — Akıllı Satış Noktası',
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // Production: Backend üzerinden serve edilen frontend'i aç
    mainWindow.loadURL(API_URL);
  }

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── Uygulama başlatma akışı ──
app.whenReady().then(async () => {
  createSplashWindow();

  try {
    if (!isDev) {
      await startBackend();
    }
    createMainWindow();
    setupAutoUpdater();
  } catch (err) {
    if (splashWindow) splashWindow.close();
    dialog.showErrorBox(
      'KasaPlus - Hata',
      `Uygulama başlatılamadı.\n\n${err.message}\n\nSQL Server çalıştığından emin olun.`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopBackend();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
