using Microsoft.Extensions.Configuration;

namespace AppLensV3.Services
{
    public class CosmosDBHandler<T> : CosmosDBHandlerBase<T> where T : class
    {
        public CosmosDBHandler(IConfiguration configuration)
            : base(configuration)
        {
            CollectionId = configuration["ApplensTemporaryAccess:CollectionId"];
            Inital(configuration).Wait();
        }
    }
}
