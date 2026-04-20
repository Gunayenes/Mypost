using BarcodePos.Infrastructure.Services;

// ╔══════════════════════════════════════════════════════════╗
// ║  KasaPlus — Lisans Anahtarı Üretme Aracı                ║
// ║  Kullanım: dotnet run -- <MachineID> <MüşteriAdı> <Gün> ║
// ║  Örnek:  dotnet run -- ABC123 "Ali Bakkal" 365           ║
// ╚══════════════════════════════════════════════════════════╝

if (args.Length < 5)
{
    Console.WriteLine();
    Console.WriteLine("  KasaPlus Lisans Üretici");
    Console.WriteLine("  ========================");
    Console.WriteLine();
    Console.WriteLine("  Kullanım: dotnet run -- <MachineID> <MüşteriAdı> <Gün> <KullanıcıAdı> <Şifre>");
    Console.WriteLine();
    Console.WriteLine("  Örnek:");
    Console.WriteLine("    dotnet run -- A1B2C3D4E5F6 \"Ali Bakkal\" 365 alibakkal Pos123!");
    Console.WriteLine();
    return;
}

var machineId = args[0];
var customerName = args[1];
var days = int.Parse(args[2]);
var username = args[3];
var password = args[4];
var expiresAt = DateTime.UtcNow.AddDays(days);

var licenseKey = LicenseService.GenerateLicenseKey(machineId, customerName, expiresAt, username, password);

Console.WriteLine();
Console.WriteLine("  ════════════════════════════════════════");
Console.WriteLine("  LİSANS ANAHTARI ÜRETİLDİ");
Console.WriteLine("  ════════════════════════════════════════");
Console.WriteLine($"  Müşteri    : {customerName}");
Console.WriteLine($"  Makine ID  : {machineId}");
Console.WriteLine($"  Kullanıcı  : {username}");
Console.WriteLine($"  Geçerlilik : {days} gün ({expiresAt:dd.MM.yyyy})");
Console.WriteLine();
Console.WriteLine("  Anahtar:");
Console.WriteLine($"  {licenseKey}");
Console.WriteLine();
Console.WriteLine("  Bu anahtarı müşteriye gönderin.");
Console.WriteLine("  ════════════════════════════════════════");
Console.WriteLine();
