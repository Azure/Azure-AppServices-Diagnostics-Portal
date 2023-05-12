using System.Threading.Tasks;
using System;

namespace AppLensV3.Services
{
    public interface IRedisService<T>
    {
        bool IsEnabled();
        Task<string> GetKey(string key);
        Task<bool> SetKey(string key, string value, TimeSpan? expiryTime = null);
        Task<bool> DeleteKey(string key);
    }
}
