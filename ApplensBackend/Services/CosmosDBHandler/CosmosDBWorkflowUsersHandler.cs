using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Services
{

    /// <summary>
    /// CosmosDBWorkflowUsersHandler class to get workflow users from CosmosDB.
    /// </summary>
    public class CosmosDBWorkflowUsersHandler : CosmosDBHandlerBase<UserAlias>, ICosmosDBWorkflowUsersHandler
    {
        private const string WorkflowUsersCollectionId = "WorkflowUsers";

        /// <summary>
        /// Initializes a new instance of the <see cref="CosmosDBWorkflowUsersHandler"/> class.
        /// Constructor.
        /// </summary>
        /// <param name="configuration">Configuration object.</param>
        public CosmosDBWorkflowUsersHandler(IConfiguration configuration)
            : base(configuration)
        {
            CollectionId = WorkflowUsersCollectionId;
            Inital(configuration).Wait();
        }

        /// <summary>
        /// Adds user to database.
        /// </summary>
        /// <param name="userAlias">User alias to be added.</param>
        /// <returns>A task to await upon.</returns>
        public async Task AddUser(UserAlias userAlias)
        {
            await CreateItemAsync(userAlias);
        }

        /// <summary>
        /// Gets all users from database synchronously.
        /// </summary>
        /// <returns>List of users.</returns>
        public List<UserAlias> GetUsers()
        {
            return GetItemsAsync(UserAlias.WorkflowUsersPartitionKey).Result;
        }

        /// <summary>
        /// Gets all users from database.
        /// </summary>
        /// <returns>List of users.</returns>
        public async Task<List<UserAlias>> GetUsersAsync()
        {
            return await GetItemsAsync(UserAlias.WorkflowUsersPartitionKey);
        }
    }
}
