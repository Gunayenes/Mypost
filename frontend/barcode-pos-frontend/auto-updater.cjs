const { dialog, BrowserWindow } = require('electron');

/**
 * Otomatik güncelleme sistemi.
 * GitHub Releases'tan kontrol eder.
 * Offline ortamda sessizce devam eder (hata vermez).
 */
function setupAutoUpdater() {
  const { app } = require('electron');
  if (!app.isPackaged) return;

  const { autoUpdater } = require('electron-updater');

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
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Güncelleme Mevcut',
      message: `Yeni sürüm mevcut: v${info.version}`,
      detail: 'Güncellemeyi şimdi indirmek ister misiniz?\nİndirme arka planda yapılır, işinize devam edebilirsiniz.',
      buttons: ['İndir', 'Sonra'],
      defaultId: 0,
      cancelId: 1,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  // Güncelleme yok
  autoUpdater.on('update-not-available', () => {
    console.log('[Updater] Güncel sürümdesiniz.');
  });

  // İndirme tamamlandı
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Güncelleme indirildi:', info.version);

    const win = BrowserWindow.getFocusedWindow();
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Güncelleme Hazır',
      message: `v${info.version} indirildi!`,
      detail: 'Uygulamayı yeniden başlatarak güncelleme kurulacaktır.',
      buttons: ['Şimdi Yeniden Başlat', 'Sonra'],
      defaultId: 0,
      cancelId: 1,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // Hata — offline ortamda sessizce devam et
  autoUpdater.on('error', (err) => {
    console.log('[Updater] Güncelleme kontrolü başarısız (muhtemelen offline):', err.message);
  });

  // Uygulama açıldıktan 10 saniye sonra kontrol et
  setTimeout(() => {
    console.log('[Updater] Güncelleme kontrol ediliyor...');
    autoUpdater.checkForUpdates().catch(() => {
      // Offline — sessizce devam
    });
  }, 10000);
}

module.exports = { setupAutoUpdater };
