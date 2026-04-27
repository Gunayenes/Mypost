using BarcodePos.Application.DTOs.Products;
using FluentValidation;

namespace BarcodePos.Application.Validators.Products;

public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductRequestValidator()
    {
        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Kategori seçimi zorunludur.");

        RuleFor(x => x.Barcode)
            .NotEmpty().WithMessage("Barkod zorunludur.")
            .MaximumLength(50).WithMessage("Barkod en fazla 50 karakter olabilir.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ürün adı zorunludur.")
            .MaximumLength(200).WithMessage("Ürün adı en fazla 200 karakter olabilir.");

        RuleFor(x => x.SalePrice)
            .GreaterThan(0).WithMessage("Satış fiyatı 0'dan büyük olmalıdır.");

        RuleFor(x => x.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Maliyet fiyatı 0 veya üzeri olmalıdır.");

        RuleFor(x => x.CostPriceUsd)
            .GreaterThan(0).When(x => x.CostPriceUsd.HasValue)
            .WithMessage("Dolar maliyet fiyatı 0'dan büyük olmalıdır.");

        RuleFor(x => x.SalePriceUsd)
            .GreaterThan(0).When(x => x.SalePriceUsd.HasValue)
            .WithMessage("Dolar satış fiyatı 0'dan büyük olmalıdır.");

        RuleFor(x => x.ExchangeRate)
            .GreaterThan(0).When(x => x.ExchangeRate.HasValue)
            .WithMessage("Döviz kuru 0'dan büyük olmalıdır.");

        RuleFor(x => x.ExchangeRate)
            .NotNull().When(x => x.CostPriceUsd.HasValue || x.SalePriceUsd.HasValue)
            .WithMessage("Dolar fiyatı girildiğinde döviz kuru zorunludur.");

        RuleFor(x => x.TaxRate)
            .InclusiveBetween(0, 100).WithMessage("KDV oranı 0 ile 100 arasında olmalıdır (örn: 18).");

        RuleFor(x => x.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Stok miktarı 0 veya üzeri olmalıdır.");

        RuleFor(x => x.MinStockLevel)
            .GreaterThanOrEqualTo(0).WithMessage("Minimum stok seviyesi 0 veya üzeri olmalıdır.");
    }
}

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Kategori seçimi zorunludur.");

        RuleFor(x => x.Barcode)
            .NotEmpty().WithMessage("Barkod zorunludur.")
            .MaximumLength(50).WithMessage("Barkod en fazla 50 karakter olabilir.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ürün adı zorunludur.")
            .MaximumLength(200).WithMessage("Ürün adı en fazla 200 karakter olabilir.");

        RuleFor(x => x.SalePrice)
            .GreaterThan(0).WithMessage("Satış fiyatı 0'dan büyük olmalıdır.");

        RuleFor(x => x.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Maliyet fiyatı 0 veya üzeri olmalıdır.");

        RuleFor(x => x.CostPriceUsd)
            .GreaterThan(0).When(x => x.CostPriceUsd.HasValue)
            .WithMessage("Dolar maliyet fiyatı 0'dan büyük olmalıdır.");

        RuleFor(x => x.SalePriceUsd)
            .GreaterThan(0).When(x => x.SalePriceUsd.HasValue)
            .WithMessage("Dolar satış fiyatı 0'dan büyük olmalıdır.");

        RuleFor(x => x.ExchangeRate)
            .GreaterThan(0).When(x => x.ExchangeRate.HasValue)
            .WithMessage("Döviz kuru 0'dan büyük olmalıdır.");

        RuleFor(x => x.ExchangeRate)
            .NotNull().When(x => x.CostPriceUsd.HasValue || x.SalePriceUsd.HasValue)
            .WithMessage("Dolar fiyatı girildiğinde döviz kuru zorunludur.");

        RuleFor(x => x.TaxRate)
            .InclusiveBetween(0, 100).WithMessage("KDV oranı 0 ile 100 arasında olmalıdır.");

        RuleFor(x => x.MinStockLevel)
            .GreaterThanOrEqualTo(0).WithMessage("Minimum stok seviyesi 0 veya üzeri olmalıdır.");

        RuleFor(x => x.StockQuantity!.Value)
            .GreaterThanOrEqualTo(0).When(x => x.StockQuantity.HasValue)
            .WithMessage("Stok miktarı 0 veya üzeri olmalıdır.");
    }
}
