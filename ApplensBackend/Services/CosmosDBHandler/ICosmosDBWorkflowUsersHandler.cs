using Newtonsoft.Json;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public class UserAlias
    {
        public const string WorkflowUsersPartitionKey = "WorkflowUsers";

        public UserAlias(string userAlias)
        {
            this.Alias = userAlias;
            this.Id = userAlias;
            this.PartitionKey = WorkflowUsersPartitionKey;
        }

        [JsonProperty(PropertyName = "alias")]
        public string Alias { get; set; }

        /// <summary>
        /// User alias Id.
        /// </summary>
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; }

        [JsonProperty]
        private readonly string PartitionKey;
    }

    /// <summary>
    /// Interface for ASP.NET CORE dependency injection.
    /// </summary>
    public interface ICosmosDBWorkflowUsersHandler : ICosmosDBHandlerBase<UserAlias>
    {
        /// <summary>
        /// Gets workflow users from CosmosDb.
        /// </summary>
        /// <returns>All users aliases allowed to publish workflows.</returns>
        Task<List<UserAlias>> GetUsersAsync();

        /// <summary>
        /// Adds new user alias to workflow users in CosmosDb.
        /// </summary>
        /// <param name="userAlias">User Alias to add</param>
        /// <returns>Task.</returns>
        Task AddUser(UserAlias userAlias);

        /// <summary>
        /// Gets workflow users from CosmosDb.
        /// </summary>
        /// <returns>All users aliases allowed to publish workflows.</returns>
        List<UserAlias> GetUsers();
    }
}
