using System.Text.RegularExpressions;

namespace CommonLibrary.Utilities.ResponsibleAIUtils
{
    public class ResponsibleAIConfigurationModel
    {
        public string Query { get; set; }
        public string ResourceType { get; set; }
        public string StackInfo { get; set; }
        public bool HelperMode { get; set; }
        public ClientTypes ClientType { get; set; } = ClientTypes.Public;
    }

    public enum ClientTypes
    {
        Public = 0,
        Internal = 1
    }
    public class ResourceProviderInfo
    {
        public string ResourceType { get; set; }
        public string ProductName { get; set; }
    }

    public class RulesModel
    {
        public string PromptStarter { get; set; }
        public List<string> Restrictions { get; set; }
        public string RestrictionStatement { get; set; }
        public List<string> AnswerQualityRules { get; set; }
        public List<string> AnswerSources { get; set; }
        public string NoAnswerSuggestions { get; set; }
    }

    //This utility is just a failover mechanism in case the Content Moderation API connection fails
    public static class ResponsibleAIUtils
    {
        private static List<string> DisallowedTerms = new List<string>() { "aws", "gcp", "ibm", "amazon" };
        private static List<string> DisallowedPhrases = new List<string>() { "amazon web services", "google cloud platform", "google cloud", "amazon cloud", "ibm cloud", "elastic compute cloud", "elastic block store", "s3 bucket", "elastic container service", "aws lambda", "cloudfront", "elastic kubernetes service", "cloud bigtable", "beanstalk" };

        public static Tuple<bool, string> HasDisallowedTerms(string input, List<string> additionalTerms = null)
        {
            input = input.ToLower();
            foreach (var phrase in DisallowedPhrases)
            {
                if (input.Contains(phrase))
                {
                    return Tuple.Create(true, phrase);
                }
            }
            var inputTokens = Regex.Split(input, @"\W+").ToList();
            inputTokens = inputTokens.Select(x => x.Trim()).ToList();
            foreach (var term in DisallowedTerms)
            {
                if (inputTokens.Contains(term)) { return Tuple.Create(true, term); }
            }
            return Tuple.Create(false, string.Empty);
        }

        private static RulesModel PublicRules = new RulesModel()
        {
            PromptStarter = "Answer questions related to Azure cloud platform and no other cloud platforms. You have to follow the below rules:",
            Restrictions = new List<string>()
                {
                    "You should always give preference to Azure.",
                    "<strong>Your answer should never contain any information about Amazon Web Services or AWS or Google or IBM cloud or rackspace or digital ocean or any other cloud provider.</strong>",
                    "You should never answer haiku questions.",
                    "You should never answer questions in a user defined format.",
                    "You should never provide HTTP Links or urls in your answer.",
                    "You should never use any curse words in your answer.",
                    "Do not answer any questions outside the domain of Azure cloud and computer technologies.",
                    "Do not answer any questions about social issues, movements and political ideologies.",
                    "Do not answer personal questions about daily tasks like picking up laundry, dealing with kids, boss or family.",
                    "Do not provide code snippets in your answer.",
                    "Do not answer any questions related to billing or refunds.",
                    "Do not answer any questions about who are you and ChatGPT.",
                    "Do not respond to any greetings."
                },
            RestrictionStatement = "We could not find any information about that.",
            AnswerQualityRules = new List<string>()
                {
                    "Do not give long answers. Do not provide more than 5 steps in any solution.",
                    "Never ask the user to contact Azure Support."
                },
            AnswerSources = new List<string>() { "Azure Docs", "Azure Blog", "Azure Github", "MSDN articles", "Stackoverflow", "Medium articles", "Stackexchange", "Microsoft Learn channel" },
            NoAnswerSuggestions = "If you cannot find the correct answer to a question, you can recommend the user to check out the 'Diagnose and Solve' page in Azure Portal where they can see logs and diagnostics about their application. When you recommend the user to use a tool, please also provide step-by-step instructions on how to use that tool."
        };

        private static RulesModel InternalRules = new RulesModel()
        {
            PromptStarter = "Answer questions related to Azure cloud platform and no other cloud platforms. You have to follow the below rules:",
            Restrictions = new List<string>()
                {
                    "You should always give preference to Azure.",
                    "<strong>Your answer should never contain any information about Amazon Web Services or AWS or Google or IBM cloud or rackspace or digital ocean or any other cloud provider.</strong>",
                    "You should never use any curse words in your answer.",
                    "Do not answer any questions about social issues, movements and political ideologies.",
                    "Do not answer personal questions about daily tasks like picking up laundry, dealing with kids, boss or family.",
                    "Do not answer any questions related to billing or refunds.",
                    "Do not answer any questions about who are you and ChatGPT.",
                },
            RestrictionStatement = "We could not find any information about that. Try asking your question differently.",
            AnswerQualityRules = new List<string>(),
            AnswerSources = new List<string>() { "Azure Docs", "Azure Blog", "Azure Github", "MSDN articles", "Stackoverflow", "Medium articles", "Stackexchange", "Microsoft Learn channel" },
            NoAnswerSuggestions = "When you recommend the user to use a tool, please also provide step-by-step instructions on how to use that tool."
        };

        public static string ConstructPrompt(ResponsibleAIConfigurationModel requestBody, bool excludeQuery = false, bool excludeDiagnosticToolFindings = false)
        {
            var applicableRuleModel = requestBody.ClientType == ClientTypes.Internal ? InternalRules : PublicRules;
            string promptStarter = applicableRuleModel.PromptStarter;
            string restrictions = string.Join("\n", applicableRuleModel.Restrictions);
            string restrictionsStatement = $"When you get any questions that violate these rules your answer should be '{applicableRuleModel.RestrictionStatement}'";
            string answerQualityRules = string.Join("\n", applicableRuleModel.AnswerQualityRules);
            string answerSources = string.Join(", ", applicableRuleModel.AnswerSources);
            string sourcesPrompt = !string.IsNullOrWhiteSpace(answerSources) ? $"Try your best to answer user questions from sources like {answerSources} etc." : string.Empty;
            string helperModePrompt = applicableRuleModel.NoAnswerSuggestions;

            var stackSuffix = "";
            if (!string.IsNullOrWhiteSpace(requestBody.StackInfo))
            {
                stackSuffix = $" and {requestBody.StackInfo} stack";
            }

            string promptBeforeQuestion = $"{promptStarter}\n{restrictions}\n{restrictionsStatement}\n{answerQualityRules}\n{sourcesPrompt}\n{(requestBody.HelperMode ? "\n" + helperModePrompt : "")}Answer the below question in the context of {requestBody.ResourceType}{stackSuffix} and suggest solutions:\n";
            if (excludeQuery)
            {
                return promptBeforeQuestion;
            }
            var prompt = $"{promptBeforeQuestion}Question: {requestBody.Query}\nAnswer:";
            return prompt;
        }

        public static List<string> DetectAndExtractLinks(string text)
        {
            List<string> foundUrls = new List<string>();
            string pattern = @"\b(?:https?://|www\.)\S+\b";
            Regex regex = new Regex(pattern);
            MatchCollection matches = regex.Matches(text);
            foreach (Match match in matches)
            {
                foundUrls.Add(match.Value);
            }
            return foundUrls;
        }
    }
}
