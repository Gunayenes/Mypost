using BarcodePos.Application.DTOs.Services;
using FluentValidation;

namespace BarcodePos.Application.Validators.Services;

public class CreateServiceRequestValidator : AbstractValidator<CreateServiceRequest>
{
    public CreateServiceRequestValidator()
    {
        RuleFor(x => x.CustomerId)
            .GreaterThan(0).WithMessage("Müşteri seçimi zorunludur.");

        RuleFor(x => x.DeviceName)
            .NotEmpty().WithMessage("Cihaz/ürün adı zorunludur.")
            .MaximumLength(200);

        RuleFor(x => x.FaultDescription)
            .NotEmpty().WithMessage("Arıza/talep açıklaması zorunludur.")
            .MaximumLength(2000);

        RuleFor(x => x.DeviceBrand).MaximumLength(100);
        RuleFor(x => x.DeviceModel).MaximumLength(100);
        RuleFor(x => x.DeviceSerial).MaximumLength(100);
        RuleFor(x => x.DeviceAccessories).MaximumLength(500);
        RuleFor(x => x.DeviceCondition).MaximumLength(500);
        RuleFor(x => x.CustomerNote).MaximumLength(1000);
    }
}

public class UpdateServiceRequestValidator : AbstractValidator<UpdateServiceRequest>
{
    public UpdateServiceRequestValidator()
    {
        RuleFor(x => x.DeviceName)
            .NotEmpty().WithMessage("Cihaz/ürün adı zorunludur.")
            .MaximumLength(200);

        RuleFor(x => x.FaultDescription)
            .NotEmpty().WithMessage("Arıza/talep açıklaması zorunludur.")
            .MaximumLength(2000);

        RuleFor(x => x.LaborCost)
            .GreaterThanOrEqualTo(0).WithMessage("İşçilik bedeli 0 veya üzeri olmalıdır.");

        RuleFor(x => x.DeviceBrand).MaximumLength(100);
        RuleFor(x => x.DeviceModel).MaximumLength(100);
        RuleFor(x => x.DeviceSerial).MaximumLength(100);
        RuleFor(x => x.DeviceAccessories).MaximumLength(500);
        RuleFor(x => x.DeviceCondition).MaximumLength(500);
        RuleFor(x => x.CustomerNote).MaximumLength(1000);
    }
}

public class UpdateServiceStatusRequestValidator : AbstractValidator<UpdateServiceStatusRequest>
{
    private static readonly string[] ValidStatuses =
        ["KayitAcildi", "Incelemede", "OnayBekliyor", "ParcaBekliyor", "Islemde", "Tamamlandi", "TeslimEdildi", "IptalEdildi"];

    public UpdateServiceStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Durum zorunludur.")
            .Must(s => ValidStatuses.Contains(s)).WithMessage("Geçersiz durum değeri.");

        RuleFor(x => x.Note).MaximumLength(2000);
    }
}

public class UpdateServicePriorityRequestValidator : AbstractValidator<UpdateServicePriorityRequest>
{
    private static readonly string[] ValidPriorities = ["Dusuk", "Orta", "Yuksek"];

    public UpdateServicePriorityRequestValidator()
    {
        RuleFor(x => x.Priority)
            .NotEmpty().WithMessage("Öncelik zorunludur.")
            .Must(p => ValidPriorities.Contains(p)).WithMessage("Geçersiz öncelik değeri.");
    }
}

public class AddServicePartRequestValidator : AbstractValidator<AddServicePartRequest>
{
    public AddServicePartRequestValidator()
    {
        RuleFor(x => x.PartName)
            .NotEmpty().WithMessage("Parça adı zorunludur.")
            .MaximumLength(200);

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Miktar 0'dan büyük olmalıdır.");

        RuleFor(x => x.UnitCost)
            .GreaterThanOrEqualTo(0).WithMessage("Birim maliyet 0 veya üzeri olmalıdır.");
    }
}

public class AddServicePaymentRequestValidator : AbstractValidator<AddServicePaymentRequest>
{
    public AddServicePaymentRequestValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Ödeme tutarı 0'dan büyük olmalıdır.");

        RuleFor(x => x.Note).MaximumLength(500);
    }
}

public class AddServiceLogRequestValidator : AbstractValidator<AddServiceLogRequest>
{
    public AddServiceLogRequestValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Not açıklaması zorunludur.")
            .MaximumLength(2000);
    }
}
