using BarcodePos.Application.DTOs.Sales;
using FluentValidation;

namespace BarcodePos.Application.Validators.Sales;

public class CreateSaleRequestValidator : AbstractValidator<CreateSaleRequest>
{
    private static readonly string[] ValidPaymentTypes = ["Nakit", "Kart", "Veresiye", "Parcali", "Iade"];

    public CreateSaleRequestValidator()
    {
        RuleFor(x => x.PaymentType)
            .NotEmpty().WithMessage("Ödeme türü zorunludur.")
            .Must(p => ValidPaymentTypes.Contains(p)).WithMessage("Geçersiz ödeme türü.");

        RuleFor(x => x.DiscountTotal)
            .GreaterThanOrEqualTo(0).WithMessage("İndirim tutarı 0 veya üzeri olmalıdır.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("En az 1 ürün gereklidir.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId)
                .GreaterThan(0).WithMessage("Ürün seçimi zorunludur.");
            item.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("Miktar 0'dan büyük olmalıdır.");
            item.RuleFor(i => i.DiscountAmount)
                .GreaterThanOrEqualTo(0).WithMessage("İndirim tutarı 0 veya üzeri olmalıdır.");
        });

        // Veresiye ise CustomerId zorunlu
        RuleFor(x => x.CustomerId)
            .NotNull().WithMessage("Veresiye satışında müşteri seçimi zorunludur.")
            .When(x => x.PaymentType == "Veresiye");
    }
}
