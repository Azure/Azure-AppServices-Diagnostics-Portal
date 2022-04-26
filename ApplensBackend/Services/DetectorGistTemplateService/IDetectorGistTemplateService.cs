using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public interface IDetectorGistTemplateService
    {
        Task<string> GetTemplate(string name, CancellationToken cancellationToken);
    }
}
