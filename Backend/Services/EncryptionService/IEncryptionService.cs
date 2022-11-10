using Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IEncryptionService
    {
        string EncryptString(string jsonPayload);
        AppInsightsDecryptionResponse DecryptString(string encryptedString);
    }
}
