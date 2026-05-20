const { app, BrowserWindow, dialog, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');
const net = require('net');
const { setupAutoUpdater } = require('./auto-updater.cjs');

/* ────────────────────────────────────────────
   Sabitler
   ──────────────────────────────────────────── */
const isDev = !app.isPackaged;
const API_PORT = 5050;
const API_URL = `http://localhost:${API_PORT}`;
const MAX_HEALTH_ATTEMPTS = 40;
const APP_NAME = 'Cari Soft';

let backendProcess = null;
let mainWindow = null;
let splashWindow = null;
let tray = null;

/* ────────────────────────────────────────────
   Tek Instance Kilidi
   ──────────────────────────────────────────── */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

/* ────────────────────────────────────────────
   Port Kontrolü
   ──────────────────────────────────────────── */
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

/* ────────────────────────────────────────────
   Backend Yönetimi
   ──────────────────────────────────────────── */
function getBackendPath() {
  if (isDev) {
    return path.join(
      __dirname, '..', '..', 'backend',
      'BarcodePos.API', 'bin', 'Debug', 'net10.0', 'BarcodePos.API.exe'
    );
  }
  return path.join(process.resourcesPath, 'backend', 'BarcodePos.API.exe');
}

async function startBackend() {
  const exePath = getBackendPath();
  console.log(`[Electron] Backend başlatılıyor: ${exePath}`);

  // Port müsait mi?
  const free = await isPortFree(API_PORT);
  if (!free) {
    console.log(`[Electron] Port ${API_PORT} zaten kullanımda — mevcut backend'e bağlanılıyor.`);
    await waitForBackend(0);
    return;
  }

  // Kullanıcı veri klasörü — her kullanıcı için ayrı SQLite konumu
  // (Program Files altına yazamayız, AppData kullanırız)
  const userDataDir = app.getPath('userData');
  const dataDir = path.join(userDataDir, 'data');
  if (!require('fs').existsSync(dataDir)) {
    require('fs').mkdirSync(dataDir, { recursive: true });
  }

  const env = {
    ...process.env,
    // Desktop ortamında "Production" appsettings'i değil, default appsettings.json kullan
    // Bu sayede SQLite connection string aktif olur
    ASPNETCORE_ENVIRONMENT: isDev ? 'Development' : 'Desktop',
    ASPNETCORE_URLS: API_URL,
    // SQLite DB konumları — kullanıcı AppData altında, yazma izni garanti
    ConnectionStrings__DefaultConnection: `Data Source=${path.join(dataDir, 'BarcodePos.db').replace(/\\/g, '/')}`,
    ConnectionStrings__LicenseConnection: `Data Source=${path.join(dataDir, 'licenses.db').replace(/\\/g, '/')}`,
    DbProvider: 'Sqlite',
    DISABLE_LICENSE_CHECK: 'true',
    // Masaüstü için varsayılan admin (kullanıcı sonra değiştirebilir)
    SITE_ADMIN_EMAIL: 'admin@carisoft.local',
    SITE_ADMIN_PASSWORD: 'admin123',
    // JWT secret rastgele oluşturulmuş bir değer
    JWT_SECRET: 'Desktop-Cari-Soft-JWT-Local-Secret-32Chars-Min-Random-Value-2026',
  };

  backendProcess = spawn(exePath, [], {
    cwd: path.dirname(exePath),
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  backendProcess.stdout.on('data', (d) =>
    console.log(`[Backend] ${d.toString().trim()}`)
  );
  backendProcess.stderr.on('data', (d) =>
    console.error(`[Backend ERR] ${d.toString().trim()}`)
  );

  backendProcess.on('error', (err) => {
    console.error('[Electron] Backend başlatılamadı:', err);
    throw err;
  });

  backendProcess.on('exit', (code) => {
    console.log(`[Electron] Backend kapandı (code: ${code})`);
    backendProcess = null;
  });

  await waitForBackend(0);
}

function waitForBackend(attempt) {
  return new Promise((resolve, reject) => {
    if (attempt >= MAX_HEALTH_ATTEMPTS) {
      reject(new Error(`Backend ${MAX_HEALTH_ATTEMPTS} saniyede yanıt vermedi.`));
      return;
    }

    http
      .get(`${API_URL}/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('[Electron] Backend hazır!');
          resolve();
        } else {
          setTimeout(() => waitForBackend(attempt + 1).then(resolve).catch(reject), 1000);
        }
      })
      .on('error', () => {
        setTimeout(() => waitForBackend(attempt + 1).then(resolve).catch(reject), 1000);
      });
  });
}

function stopBackend() {
  if (!backendProcess) return;
  console.log('[Electron] Backend durduruluyor...');
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${backendProcess.pid} /T /F`, { stdio: 'ignore' });
    } else {
      backendProcess.kill('SIGTERM');
    }
  } catch {
    // Process zaten kapanmış olabilir
  }
  backendProcess = null;
}

/* ────────────────────────────────────────────
   Splash Penceresi
   ──────────────────────────────────────────── */
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 320,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  const html = `
    <html>
    <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;
      background:linear-gradient(135deg,#1e293b,#4f46e5);font-family:system-ui;color:white;
      border-radius:16px;user-select:none;-webkit-app-region:drag;">
      <div style="text-align:center">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#6366f1,#4338ca);
          border-radius:16px;display:flex;align-items:center;justify-content:center;
          margin:0 auto 16px;font-size:28px;font-weight:900;box-shadow:0 8px 32px rgba(99,102,241,0.4)">K</div>
        <div style="font-size:24px;font-weight:800;margin-bottom:6px;letter-spacing:-0.5px">${APP_NAME}</div>
        <div style="font-size:13px;opacity:0.7;margin-bottom:24px">Akıllı Satış Noktası v${app.getVersion()}</div>
        <div style="font-size:11px;opacity:0.5" id="status">Sistem başlatılıyor...</div>
        <div style="margin-top:14px;width:180px;height:3px;background:rgba(255,255,255,0.15);
          border-radius:2px;overflow:hidden;margin-left:auto;margin-right:auto">
          <div style="width:35%;height:100%;background:rgba(255,255,255,0.8);border-radius:2px;
            animation:loading 1.2s ease-in-out infinite"></div>
        </div>
      </div>
      <style>@keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}</style>
    </body>
    </html>`;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

/* ────────────────────────────────────────────
   Ana Pencere
   ──────────────────────────────────────────── */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: APP_NAME,
    show: false,
    icon: path.join(__dirname, 'public', 'icon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    autoHideMenuBar: true,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadURL(API_URL);
  }

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Kapatma → tray'e küçült (production'da)
  mainWindow.on('close', (e) => {
    if (!app.isPackaged) return; // dev'de direkt kapat
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/* ────────────────────────────────────────────
   System Tray
   ──────────────────────────────────────────── */
function createTray() {
  // Basit 16x16 icon
  const iconData = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAW0lEQVQ4T2NkYPj/n4EBCRgZGRgYGBn+M6AKMP5nBCpEV8wINABdPwMDA4aLGBgYGBhxuQHDAKAhOF3ACDQEw0swNzCiuwBFMxM2FzBi8wJYMwsuL4D1AgBioyARAYDp1gAAAABJRU5ErkJggg=='
  );

  tray = new Tray(iconData);
  tray.setToolTip(`${APP_NAME} — Çalışıyor`);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `${APP_NAME}'ı Aç`,
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

/* ────────────────────────────────────────────
   Uygulama Yaşam Döngüsü
   ──────────────────────────────────────────── */
app.whenReady().then(async () => {
  if (!gotLock) return;

  createSplashWindow();

  try {
    await startBackend();
    createMainWindow();
    if (app.isPackaged) createTray();
    setupAutoUpdater();
  } catch (err) {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    dialog.showErrorBox(
      `${APP_NAME} — Başlatma Hatası`,
      `Backend başlatılamadı.\n\n${err.message}\n\nLütfen uygulamayı yeniden başlatmayı deneyin.`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (!app.isPackaged) {
    stopBackend();
    app.quit();
  }
  // Production'da tray'de çalışmaya devam
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopBackend();
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
