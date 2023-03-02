using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AppLensV3.Helpers;

namespace AppLensV3.Services
{
    public class WorkflowUsersCacheService : IWorkflowUsersCacheService
    {
        private const int RefreshIntervalInHours = 1;
        private ICosmosDBWorkflowUsersHandler workflowUsersHandler;
        private List<string> workflowUsersList = new ();

        public WorkflowUsersCacheService(ICosmosDBWorkflowUsersHandler cosmosDBWorkflowUsersHandler)
        {
            workflowUsersHandler = cosmosDBWorkflowUsersHandler;
            StartCacheRefresh();
        }

        public List<string> GetWorkflowUsers()
        {
            return this.workflowUsersList;
        }

        public async Task StartCacheRefresh()
        {
            while (true)
            {
                try
                {
                    var workflowUsers = await workflowUsersHandler.GetUsersAsync();
                    if (workflowUsers != null && workflowUsers.Any())
                    {
                        var usersInDb = workflowUsers.Select(x => x.Alias.ToLower()).OrderBy(x => x);
                        if (usersInDb.Any())
                        {
                            this.workflowUsersList = usersInDb.ToList();
                        }
                    }
                }
                catch (Exception)
                {
                    // TODO - log the exception
                }

                await Task.Delay(TimeSpan.FromHours(RefreshIntervalInHours));
            }
        }
    }
}
