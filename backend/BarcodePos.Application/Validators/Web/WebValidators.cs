using BarcodePos.Application.DTOs.Web;
using FluentValidation;

namespace BarcodePos.Application.Validators.Web;

public class WebRegisterValidator : AbstractValidator<WebRegisterRequest>
{
    public WebRegisterValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100).WithMessage("Ad zorunludur.");
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100).WithMessage("Soyad zorunludur.");
        RuleFor(x => x.BusinessName).NotEmpty().MaximumLength(200).WithMessage("İşletme adı zorunludur.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.");
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20).WithMessage("Telefon zorunludur.");
        RuleFor(x => x.Password).NotEmpty()
            .MinimumLength(8).WithMessage("Şifre en az 8 karakter olmalıdır.")
            .Matches(@"[A-Z]").WithMessage("Şifre en az bir büyük harf içermelidir.")
            .Matches(@"[a-z]").WithMessage("Şifre en az bir küçük harf içermelidir.")
            .Matches(@"\d").WithMessage("Şifre en az bir rakam içermelidir.");
    }
}

public class WebLoginValidator : AbstractValidator<WebLoginRequest>
{
    public WebLoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Geçerli bir e-posta giriniz.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Şifre zorunludur.");
    }
}

public class ForgotPasswordValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Geçerli bir e-posta giriniz.");
    }
}

public class ResetPasswordValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Token).NotEmpty().WithMessage("Token zorunludur.");
        RuleFor(x => x.NewPassword).NotEmpty()
            .MinimumLength(8).WithMessage("Yeni şifre en az 8 karakter olmalıdır.")
            .Matches(@"[A-Z]").WithMessage("Şifre en az bir büyük harf içermelidir.")
            .Matches(@"[a-z]").WithMessage("Şifre en az bir küçük harf içermelidir.")
            .Matches(@"\d").WithMessage("Şifre en az bir rakam içermelidir.");
    }
}
