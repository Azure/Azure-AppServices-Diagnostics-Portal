using Microsoft.IdentityModel.Tokens;
using System;
using System.Text.RegularExpressions;

namespace Backend.Services.ArmTokenValidator
{
    public class ArmTokenValidator
    {
        public static string ValidateIssuer(string issuer, SecurityToken token, TokenValidationParameters parameters)
        {
            if (string.IsNullOrEmpty(issuer)) return parameters.ValidIssuer;

            var validIssuerPattern = @"^https:\/\/login\.microsoftonline\.com\/([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})\/v2\.0$";
            var regex = new Regex(validIssuerPattern, RegexOptions.IgnoreCase);

            return regex.IsMatch(issuer) ? issuer : parameters.ValidIssuer;
        }
    }
}
