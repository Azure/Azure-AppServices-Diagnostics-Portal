using System.Collections.Generic;

namespace AppLensV3.Services
{
    public interface IWorkflowUsersCacheService
    {
        List<string> GetWorkflowUsers();
    }
}
