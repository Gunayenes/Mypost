const { dialog, BrowserWindow, Notification } = require('electron');

/**
 * Otomatik güncelleme sistemi.
 * GitHub Releases'tan kontrol eder.
 * Offline ortamda sessizce devam eder (hata vermez).
 * Periyodik olarak güncelleme kontrol eder.
 */
function setupAutoUpdater() {
  const { app } = require('electron');
  if (!app.isPackaged) return;

  let autoUpdater;
  try {
    autoUpdater = require('electron-updater').autoUpdater;
  } catch {
    console.log('[Updater] electron-updater yüklenemedi, güncelleme devre dışı.');
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.logger = {
    info: (msg) => console.log('[Updater]', msg),
    warn: (msg) => console.warn('[Updater]', msg),
    error: (msg) => console.error('[Updater]', msg),
  };

  // Güncelleme bulundu
  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Yeni sürüm bulundu:', info.version);

    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'Güncelleme Mevcut',
        message: `Yeni sürüm mevcut: v${info.version}`,
        detail: 'Güncellemeyi şimdi indirmek ister misiniz?\nİndirme arka planda yapılır.',
        buttons: ['İndir', 'Sonra'],
        defaultId: 0,
        cancelId: 1,
      }).then(({ response }) => {
        if (response === 0) autoUpdater.downloadUpdate();
      });
    } else if (Notification.isSupported()) {
      new Notification({
        title: 'KasaPlus Güncelleme',
        body: `Yeni sürüm mevcut: v${info.version}`,
      }).show();
    }
  });

  // Güncelleme yok
  autoUpdater.on('update-not-available', () => {
    console.log('[Updater] Güncel sürümdesiniz.');
  });

  // İndirme tamamlandı
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Güncelleme indirildi:', info.version);

    const win = BrowserWindow.getFocusedWindow();
    dialog.showMessageBox(win || BrowserWindow.getAllWindows()[0], {
      type: 'info',
      title: 'Güncelleme Hazır',
      message: `v${info.version} indirildi!`,
      detail: 'Uygulamayı yeniden başlatarak güncelleme kurulacaktır.',
      buttons: ['Şimdi Yeniden Başlat', 'Sonra'],
      defaultId: 0,
      cancelId: 1,
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall(false, true);
    });
  });

  // Hata — offline ortamda sessizce devam et
  autoUpdater.on('error', (err) => {
    console.log('[Updater] Kontrol başarısız (muhtemelen offline):', err.message);
  });

  // İlk kontrol: 10 saniye sonra
  setTimeout(() => checkForUpdates(autoUpdater), 10000);

  // Periyodik kontrol: her 4 saatte bir
  setInterval(() => checkForUpdates(autoUpdater), 4 * 60 * 60 * 1000);
}

function checkForUpdates(autoUpdater) {
  console.log('[Updater] Güncelleme kontrol ediliyor...');
  autoUpdater.checkForUpdates().catch(() => {
    // Offline — sessizce devam
  });
}

module.exports = { setupAutoUpdater };
