using BarcodePos.Infrastructure.Services;
using LicenseManager;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<LicenseDbContext>();

var app = builder.Build();

// Veritabanını oluştur
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LicenseDbContext>();
    db.Database.EnsureCreated();
}

// ── Ana sayfa ──
app.MapGet("/", () => Results.Content(Html.Page, "text/html; charset=utf-8"));

// ── Tüm lisansları getir ──
app.MapGet("/api/licenses", async (LicenseDbContext db) =>
{
    var licenses = await db.Licenses.OrderByDescending(l => l.IssuedAt).ToListAsync();
    var now = DateTime.UtcNow;
    return licenses.Select(l => new
    {
        l.Id,
        l.CustomerName,
        l.MachineId,
        l.Phone,
        l.Note,
        l.Username,
        l.Password,
        l.DurationDays,
        l.IssuedAt,
        l.ExpiresAt,
        l.IsActive,
        l.LicenseKey,
        status = !l.IsActive ? "Pasif"
            : l.ExpiresAt < now ? "Süresi Dolmuş"
            : l.ExpiresAt < now.AddDays(30) ? "Yakında Dolacak"
            : "Aktif",
        daysLeft = l.IsActive ? (int)(l.ExpiresAt - now).TotalDays : 0,
    });
});

// ── İstatistikler ──
app.MapGet("/api/stats", async (LicenseDbContext db) =>
{
    var now = DateTime.UtcNow;
    var all = await db.Licenses.ToListAsync();
    return new
    {
        total = all.Count,
        active = all.Count(l => l.IsActive && l.ExpiresAt >= now),
        expiringSoon = all.Count(l => l.IsActive && l.ExpiresAt >= now && l.ExpiresAt < now.AddDays(30)),
        expired = all.Count(l => l.IsActive && l.ExpiresAt < now),
        inactive = all.Count(l => !l.IsActive),
    };
});

// ── Yeni lisans üret ──
app.MapPost("/api/licenses", async (LicenseDbContext db, CreateLicenseRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.CustomerName) || string.IsNullOrWhiteSpace(req.MachineId))
        return Results.BadRequest(new { error = "Müşteri adı ve Makine ID zorunlu." });
    if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
        return Results.BadRequest(new { error = "Kullanıcı adı ve şifre zorunlu." });

    var days = req.DurationDays > 0 ? req.DurationDays : 365;
    var expiresAt = DateTime.UtcNow.AddDays(days);
    var licenseKey = LicenseService.GenerateLicenseKey(req.MachineId.Trim(), req.CustomerName.Trim(), expiresAt, req.Username.Trim(), req.Password.Trim());

    var record = new LicenseRecord
    {
        CustomerName = req.CustomerName.Trim(),
        MachineId = req.MachineId.Trim(),
        Phone = req.Phone?.Trim() ?? "",
        Note = req.Note?.Trim() ?? "",
        Username = req.Username.Trim(),
        Password = req.Password.Trim(),
        LicenseKey = licenseKey,
        DurationDays = days,
        IssuedAt = DateTime.UtcNow,
        ExpiresAt = expiresAt,
        IsActive = true,
    };

    db.Licenses.Add(record);
    await db.SaveChangesAsync();
    return Results.Ok(new { success = true, licenseKey, record.Id });
});

// ── Lisans yenile ──
app.MapPost("/api/licenses/{id}/renew", async (LicenseDbContext db, int id, RenewRequest req) =>
{
    var license = await db.Licenses.FindAsync(id);
    if (license == null) return Results.NotFound();

    var days = req.DurationDays > 0 ? req.DurationDays : 365;
    var expiresAt = DateTime.UtcNow.AddDays(days);
    var newKey = LicenseService.GenerateLicenseKey(license.MachineId, license.CustomerName, expiresAt, license.Username, req.Password ?? "Pos123!");

    license.Password = req.Password ?? "Pos123!";
    license.LicenseKey = newKey;
    license.DurationDays = days;
    license.ExpiresAt = expiresAt;
    license.IssuedAt = DateTime.UtcNow;
    license.IsActive = true;
    await db.SaveChangesAsync();

    return Results.Ok(new { success = true, licenseKey = newKey });
});

// ── Lisansı pasife al ──
app.MapPost("/api/licenses/{id}/toggle", async (LicenseDbContext db, int id) =>
{
    var license = await db.Licenses.FindAsync(id);
    if (license == null) return Results.NotFound();
    license.IsActive = !license.IsActive;
    await db.SaveChangesAsync();
    return Results.Ok(new { success = true, isActive = license.IsActive });
});

// ── Lisans sil ──
app.MapDelete("/api/licenses/{id}", async (LicenseDbContext db, int id) =>
{
    var license = await db.Licenses.FindAsync(id);
    if (license == null) return Results.NotFound();
    db.Licenses.Remove(license);
    await db.SaveChangesAsync();
    return Results.Ok(new { success = true });
});

Console.WriteLine();
Console.WriteLine("  ╔═══════════════════════════════════════════╗");
Console.WriteLine("  ║  Cari Soft Lisans Yönetim Paneli           ║");
Console.WriteLine("  ║  http://localhost:5099                     ║");
Console.WriteLine("  ╚═══════════════════════════════════════════╝");
Console.WriteLine();

app.Run("http://localhost:5099");

// ── Request modelleri ──
record CreateLicenseRequest(string CustomerName, string MachineId, string? Phone, string? Note, string Username, string Password, int DurationDays);
record RenewRequest(int DurationDays, string? Password);

// ── HTML ──
static class Html
{
    public const string Page = """
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cari Soft — Lisans Yönetim Paneli</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; }
  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
</style>
</head>
<body class="bg-gray-100 min-h-screen">

<!-- Header -->
<header class="bg-slate-800 text-white px-6 py-4 shadow-lg">
  <div class="max-w-7xl mx-auto flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-xl">🛡️</div>
      <div>
        <h1 class="text-lg font-bold">Cari Soft — Lisans Yönetimi</h1>
        <p class="text-xs text-gray-400">Müşteri ve lisans kontrol paneli</p>
      </div>
    </div>
    <button onclick="showModal()" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold transition">
      + Yeni Lisans Üret
    </button>
  </div>
</header>

<!-- Stats -->
<div class="max-w-7xl mx-auto px-6 py-6">
  <div id="stats" class="grid grid-cols-5 gap-4 mb-6"></div>

  <!-- Tablo -->
  <div class="bg-white rounded-xl shadow border overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 border-b">
        <tr>
          <th class="text-left px-4 py-3 font-semibold text-gray-600">Müşteri</th>
          <th class="text-left px-4 py-3 font-semibold text-gray-600">Kullanıcı</th>
          <th class="text-left px-4 py-3 font-semibold text-gray-600">Şifre</th>
          <th class="text-left px-4 py-3 font-semibold text-gray-600">Telefon</th>
          <th class="text-left px-4 py-3 font-semibold text-gray-600">Makine ID</th>
          <th class="text-center px-4 py-3 font-semibold text-gray-600">Süre</th>
          <th class="text-center px-4 py-3 font-semibold text-gray-600">Kalan Gün</th>
          <th class="text-center px-4 py-3 font-semibold text-gray-600">Durum</th>
          <th class="text-left px-4 py-3 font-semibold text-gray-600">Not</th>
          <th class="text-center px-4 py-3 font-semibold text-gray-600">İşlem</th>
        </tr>
      </thead>
      <tbody id="table-body"></tbody>
    </table>
    <div id="empty" class="hidden px-4 py-12 text-center text-gray-400">Henüz müşteri yok.</div>
  </div>
</div>

<!-- Yeni Lisans Modal -->
<div id="modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/40">
  <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 fade-in">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold">Yeni Lisans Üret</h2>
      <button onclick="hideModal()" class="p-1 hover:bg-gray-100 rounded text-gray-500">✕</button>
    </div>
    <form onsubmit="createLicense(event)" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Müşteri Adı *</label>
        <input id="f-name" required class="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="Ali Bakkal">
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Makine ID *</label>
        <input id="f-machine" required class="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:border-blue-500 outline-none" placeholder="A1B2C3D4...">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
          <input id="f-phone" class="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="0555 123 4567">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Süre (gün)</label>
          <select id="f-days" class="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none">
            <option value="30">30 gün (Deneme)</option>
            <option value="90">90 gün (3 ay)</option>
            <option value="180">180 gün (6 ay)</option>
            <option value="365" selected>365 gün (1 yıl)</option>
            <option value="730">730 gün (2 yıl)</option>
            <option value="3650">3650 gün (10 yıl)</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Kullanıcı Adı *</label>
          <input id="f-username" required class="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="alibakkal">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Şifre *</label>
          <input id="f-password" required class="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="Pos123!">
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Not</label>
        <input id="f-note" class="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="Opsiyonel not...">
      </div>
      <div id="f-error" class="hidden p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600"></div>
      <button type="submit" class="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition">
        Lisans Üret
      </button>
    </form>
  </div>
</div>

<!-- Lisans Anahtarı Modal -->
<div id="key-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/40">
  <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 fade-in">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-green-700">✅ Lisans Üretildi</h2>
      <button onclick="hideKeyModal()" class="p-1 hover:bg-gray-100 rounded text-gray-500">✕</button>
    </div>
    <p class="text-sm text-gray-600 mb-3">Bu anahtarı müşteriye gönderin:</p>
    <textarea id="key-text" readonly rows="4" class="w-full border rounded-lg px-3 py-2 text-xs font-mono bg-gray-50 resize-none"></textarea>
    <div class="flex gap-2 mt-3">
      <button onclick="copyKey()" class="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
        📋 Kopyala
      </button>
      <button onclick="sendKeyWhatsApp()" class="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
        💬 WhatsApp
      </button>
      <button onclick="hideKeyModal()" class="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
        Kapat
      </button>
    </div>
    <div id="key-phone-row" class="hidden mt-2">
      <div class="flex gap-2 items-center">
        <input id="key-phone" class="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:border-green-500 outline-none" placeholder="Telefon: 05xx xxx xxxx">
        <button onclick="doSendWhatsApp()" class="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition">Gönder</button>
      </div>
    </div>
    <p id="copy-msg" class="text-xs text-green-600 mt-2 hidden">Kopyalandı!</p>
  </div>
</div>

<script>
const API = '';
let _licenses = [];

async function load() {
  const [statsRes, listRes] = await Promise.all([fetch('/api/stats'), fetch('/api/licenses')]);
  const stats = await statsRes.json();
  _licenses = await listRes.json();
  renderStats(stats);
  renderTable(_licenses);
}

function renderStats(s) {
  const cards = [
    { label: 'Toplam Müşteri', value: s.total, color: 'blue', icon: '👥' },
    { label: 'Aktif Lisans', value: s.active, color: 'green', icon: '✅' },
    { label: 'Yakında Dolacak', value: s.expiringSoon, color: 'amber', icon: '⚠️' },
    { label: 'Süresi Dolmuş', value: s.expired, color: 'red', icon: '❌' },
    { label: 'Pasif', value: s.inactive, color: 'gray', icon: '⏸️' },
  ];
  document.getElementById('stats').innerHTML = cards.map(c => `
    <div class="bg-white rounded-xl border p-4 shadow-sm">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-gray-500">${c.label}</span>
        <span>${c.icon}</span>
      </div>
      <span class="text-2xl font-bold text-${c.color}-600">${c.value}</span>
    </div>
  `).join('');
}

function statusBadge(status) {
  const map = {
    'Aktif': 'bg-green-100 text-green-700',
    'Yakında Dolacak': 'bg-amber-100 text-amber-700',
    'Süresi Dolmuş': 'bg-red-100 text-red-700',
    'Pasif': 'bg-gray-100 text-gray-600',
  };
  return `<span class="text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100'}">${status}</span>`;
}

function renderTable(licenses) {
  const tbody = document.getElementById('table-body');
  const empty = document.getElementById('empty');
  if (licenses.length === 0) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  tbody.innerHTML = licenses.map(l => `
    <tr class="border-b border-gray-100 hover:bg-gray-50">
      <td class="px-4 py-3 font-medium">${l.customerName}</td>
      <td class="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">${l.username || '—'}</td>
      <td class="px-4 py-3 font-mono text-xs text-purple-600">${l.password || '—'}</td>
      <td class="px-4 py-3 text-gray-500">${l.phone || '—'}</td>
      <td class="px-4 py-3 font-mono text-xs text-gray-500">${l.machineId.substring(0,12)}...</td>
      <td class="px-4 py-3 text-center text-gray-500">${l.durationDays}g</td>
      <td class="px-4 py-3 text-center font-semibold ${l.daysLeft <= 30 ? 'text-red-600' : 'text-green-600'}">${l.daysLeft > 0 ? l.daysLeft : 0}</td>
      <td class="px-4 py-3 text-center">${statusBadge(l.status)}</td>
      <td class="px-4 py-3 text-gray-400 text-xs">${l.note || '—'}</td>
      <td class="px-4 py-3 text-center">
        <div class="flex items-center justify-center gap-1">
          <button onclick="showKeyForCopy('${l.licenseKey.replace(/'/g,"\\'")}', '${(l.phone||'').replace(/'/g,"\\'")}')" class="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Anahtarı Göster">🔑</button>
           <button onclick="sendWhatsApp(${l.id})" class="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100" title="WhatsApp ile Gönder">💬</button>
           <button onclick="renewLicense(${l.id})" class="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100" title="Yenile">🔄</button>
          <button onclick="toggleLicense(${l.id})" class="px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded hover:bg-amber-100" title="${l.isActive ? 'Pasife Al' : 'Aktive Et'}">${l.isActive ? '⏸️' : '▶️'}</button>
          <button onclick="deleteLicense(${l.id}, '${l.customerName}')" class="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100" title="Sil">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function showModal() { document.getElementById('modal').classList.remove('hidden'); document.getElementById('modal').classList.add('flex'); }
function hideModal() { document.getElementById('modal').classList.add('hidden'); document.getElementById('modal').classList.remove('flex'); }
function hideKeyModal() { document.getElementById('key-modal').classList.add('hidden'); document.getElementById('key-modal').classList.remove('flex'); }

function showKeyModal(key, phone) {
  document.getElementById('key-text').value = key;
  document.getElementById('key-modal').classList.remove('hidden');
  document.getElementById('key-modal').classList.add('flex');
  document.getElementById('copy-msg').classList.add('hidden');
  document.getElementById('key-phone-row').classList.add('hidden');
  if (phone) document.getElementById('key-phone').value = phone;
  else document.getElementById('key-phone').value = '';
}

function showKeyForCopy(key, phone) { showKeyModal(key, phone); }

async function copyKey() {
  const text = document.getElementById('key-text').value;
  await navigator.clipboard.writeText(text);
  document.getElementById('copy-msg').classList.remove('hidden');
  setTimeout(() => document.getElementById('copy-msg').classList.add('hidden'), 2000);
}

async function createLicense(e) {
  e.preventDefault();
  const body = {
    customerName: document.getElementById('f-name').value,
    machineId: document.getElementById('f-machine').value,
    phone: document.getElementById('f-phone').value,
    note: document.getElementById('f-note').value,
    username: document.getElementById('f-username').value,
    password: document.getElementById('f-password').value,
    durationDays: parseInt(document.getElementById('f-days').value),
  };
  const res = await fetch('/api/licenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.success) {
    hideModal();
    const phone = document.getElementById('f-phone').value;
    document.getElementById('f-name').value = '';
    document.getElementById('f-machine').value = '';
    document.getElementById('f-phone').value = '';
    document.getElementById('f-note').value = '';
    document.getElementById('f-username').value = '';
    document.getElementById('f-password').value = '';
    showKeyModal(data.licenseKey, phone);
    load();
  } else {
    document.getElementById('f-error').textContent = data.error;
    document.getElementById('f-error').classList.remove('hidden');
  }
}

async function renewLicense(id) {
  const days = prompt('Yeni süre (gün):', '365');
  if (!days) return;
  const password = prompt('Yeni şifre (boş bırakırsan Pos123! olur):', '');
  const res = await fetch(`/api/licenses/${id}/renew`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ durationDays: parseInt(days), password: password || null }) });
  const data = await res.json();
  if (data.success) { showKeyModal(data.licenseKey); load(); }
}

async function toggleLicense(id) {
  await fetch(`/api/licenses/${id}/toggle`, { method: 'POST' });
  load();
}

async function deleteLicense(id, name) {
  if (!confirm(`"${name}" silinecek. Emin misiniz?`)) return;
  await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
  load();
}

// ── WhatsApp / SMS ──

function formatPhone(raw) {
  if (!raw) return '';
  let p = raw.replace(/[^0-9+]/g, '');
  if (p.startsWith('0')) p = '90' + p.substring(1);
  if (!p.startsWith('+')) p = '+' + p;
  return p;
}

function buildWhatsAppMsg(key) {
  return `Cari Soft Lisans Anahtarınız:%0A%0A${encodeURIComponent(key)}%0A%0AUygulamada Ayarlar > Lisans Aktivasyonu bölümüne yapıştırın.`;
}

function sendWhatsApp(id) {
  const lic = _licenses.find(l => l.id === id);
  if (!lic) return;
  if (!lic.phone) { alert('Bu müşterinin telefon numarası yok.'); return; }
  const phone = formatPhone(lic.phone);
  const msg = buildWhatsAppMsg(lic.licenseKey);
  window.open(`https://wa.me/${phone.replace('+','')}?text=${msg}`, '_blank');
}

let _keyModalPhone = '';
function sendKeyWhatsApp() {
  document.getElementById('key-phone-row').classList.toggle('hidden');
  document.getElementById('key-phone').focus();
}

function doSendWhatsApp() {
  const phone = formatPhone(document.getElementById('key-phone').value);
  if (!phone || phone.length < 10) { alert('Geçerli bir telefon numarası girin.'); return; }
  const key = document.getElementById('key-text').value;
  const msg = buildWhatsAppMsg(key);
  window.open(`https://wa.me/${phone.replace('+','')}?text=${msg}`, '_blank');
}

load();
</script>
</body>
</html>
""";
}
