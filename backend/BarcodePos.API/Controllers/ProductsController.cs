using BarcodePos.API.Extensions;
using BarcodePos.Application.DTOs.Products;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ICurrentUser _currentUser;

    public ProductsController(IProductService productService, ICurrentUser currentUser)
    {
        _productService = productService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Ürün listesi — sayfalı ve filtrelenebilir. Yonetici+
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] ProductListFilter filter)
    {
        var result = await _productService.GetAllAsync(filter, _currentUser.StoreId);
        return Ok(result);
    }

    /// <summary>
    /// Ürün detayı. Yonetici+
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _productService.GetByIdAsync(id, _currentUser.StoreId);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Barkod ile ürün sorgulama — POS ana sorgusu. Kasiyer+
    /// </summary>
    [HttpGet("barcode/{barcode}")]
    public async Task<IActionResult> GetByBarcode(string barcode)
    {
        var result = await _productService.GetByBarcodeAsync(barcode, _currentUser.StoreId);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// İsim veya barkod ile ürün arama — POS arama. Kasiyer+
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        var result = await _productService.SearchAsync(q, _currentUser.StoreId);
        return Ok(result);
    }

    /// <summary>
    /// Düşük stoklu ürünler. Yonetici+
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
    {
        var result = await _productService.GetLowStockAsync(_currentUser.StoreId);
        return Ok(result);
    }

    /// <summary>
    /// Yeni ürün için dahili barkod oluştur (EAN-13 uyumlu). Yonetici+
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpGet("generate-barcode")]
    public async Task<IActionResult> GenerateBarcode()
    {
        var result = await _productService.GenerateBarcodeAsync(_currentUser.StoreId);
        if (!result.Success)
            return Conflict(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Yeni ürün oluştur. Yonetici+
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductRequest request,
        [FromServices] IValidator<CreateProductRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        // Plan limit kontrolü
        var plan = HttpContext.GetSubscriptionPlan();
        if (plan is not null)
        {
            var currentCount = await _productService.GetAllAsync(new ProductListFilter(), _currentUser.StoreId);
            if (currentCount.Success && currentCount.Data!.TotalCount >= plan.MaxProducts)
                return BadRequest(new { success = false, message = $"Mevcut planınızda en fazla {plan.MaxProducts} ürün ekleyebilirsiniz. Lütfen paketinizi yükseltin." });
        }

        var result = await _productService.CreateAsync(request, _currentUser.StoreId);
        if (!result.Success)
            return Conflict(new { success = false, message = result.Message });
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Ürün güncelle. Yonetici+ (StockQuantity güncellenmez)
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateProductRequest request,
        [FromServices] IValidator<UpdateProductRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        var result = await _productService.UpdateAsync(id, request, _currentUser.StoreId);
        if (!result.Success)
            return result.Message!.Contains("bulunamadı") ? NotFound(new { success = false, message = result.Message }) : Conflict(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Ürünü pasif yap (soft delete). Admin only
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _productService.DeleteAsync(id, _currentUser.StoreId);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Excel'den toplu ürün içe aktarma. Admin only
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("import")]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB
    public async Task<IActionResult> BulkImport(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, message = "Dosya yüklenmedi." });

        if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { success = false, message = "Sadece .xlsx uzantılı dosyalar kabul edilir." });

        await using var stream = file.OpenReadStream();
        var result = await _productService.BulkImportAsync(stream, _currentUser.StoreId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// İçe aktarma şablon dosyası indir.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpGet("import/template")]
    public async Task<IActionResult> DownloadTemplate()
    {
        var bytes = await _productService.GetImportTemplateAsync();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "urun-import-sablonu.xlsx");
    }

    /// <summary>
    /// Mevcut ürünleri Excel'e aktar. Aynı format import ile uyumludur.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpGet("export")]
    public async Task<IActionResult> ExportProducts()
    {
        var bytes = await _productService.ExportToExcelAsync(_currentUser.StoreId);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"urunler-{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }

    /// <summary>
    /// USD'li tüm ürünlerin TL fiyatlarını güncel kura göre yeniden hesaplar.
    /// Mağaza Ayarları'ndaki "USD Kurlarını Güncelle" butonu çağırır.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPost("bulk-update-usd-prices")]
    public async Task<IActionResult> BulkUpdateUsdPrices()
    {
        var result = await _productService.BulkUpdateUsdPricesAsync(_currentUser.StoreId);
        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message });
        return Ok(result);
    }
}
