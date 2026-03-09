using BarcodePos.Application.DTOs.StockMovements;
using FluentValidation;

namespace BarcodePos.Application.Validators.StockMovements;

public class CreateStockMovementRequestValidator : AbstractValidator<CreateStockMovementRequest>
{
    private static readonly string[] ManualTypes = ["Giris", "Cikis", "Duzeltme"];

    public CreateStockMovementRequestValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0).WithMessage("Ürün seçimi zorunludur.");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Hareket türü zorunludur.")
            .Must(t => ManualTypes.Contains(t))
            .WithMessage("Geçersiz hareket türü. Geçerli: Giris, Cikis, Duzeltme");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Miktar 0'dan büyük olmalıdır.");

        RuleFor(x => x.Note)
            .MaximumLength(500).WithMessage("Not en fazla 500 karakter olabilir.")
            .When(x => !string.IsNullOrEmpty(x.Note));
    }
}
