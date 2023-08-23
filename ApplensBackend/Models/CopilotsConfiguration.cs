using System;
using System.Collections.Generic;
using System.Linq;

namespace AppLensV3.Models
{
    public class CopilotsConfiguration
    {
        public bool Enabled { get; set; } = true;

        public Dictionary<string, CopilotSettings> CopilotSettings { get; set; } = new Dictionary<string, CopilotSettings>(StringComparer.OrdinalIgnoreCase);

        public bool isCopilotEnabled(string chatIdentifier, string resourceProviderName, string resourceTypeName)
                => CopilotSettings.ContainsKey(chatIdentifier?.Trim())
                    ? CopilotSettings[chatIdentifier?.Trim()].isCopilotEnabled(resourceProviderName, resourceTypeName)
                    : Enabled;

        public bool IsUserAllowedAccess(string chatIdentifier, string userId, string resourceProviderName, string resourceTypeName)
               => CopilotSettings.ContainsKey(chatIdentifier?.Trim())
                    ? CopilotSettings[chatIdentifier?.Trim()].IsUserAllowedAccess(userId, resourceProviderName, resourceTypeName)
                    : Enabled;

        public bool IsUserAllowedToSubmitFeedback(string chatIdentifier, string userId, string resourceProviderName, string resourceTypeName)
               => CopilotSettings.ContainsKey(chatIdentifier?.Trim())
                    ? CopilotSettings[chatIdentifier?.Trim()].IsUserAllowedToSubmitFeedback(userId, resourceProviderName, resourceTypeName)
                    : false;
    }

    public class CopilotSettings
    {
        public bool Enabled { get; set; } = true;

        private List<string> _enabledResourceProviders = new List<string>();

        public string EnabledResourceProviders
        {
            get => string.Join(",", _enabledResourceProviders);

            set
            {
                if (!string.IsNullOrEmpty(value))
                {
                    _enabledResourceProviders = value.Split(',').Where(u => !string.IsNullOrWhiteSpace(u)).Select(u => u.Trim().Trim('/')).ToList();
                }
            }
        }

        public bool isCopilotEnabled(string resourceProviderName, string resourceTypeName)
        {
            if (!Enabled || _enabledResourceProviders.Count == 0)
            {
                return Enabled && _enabledResourceProviders.Count == 0;
            }

            string key = $"{resourceProviderName?.Trim()}/{resourceTypeName?.Trim()}".Trim('/');
            return _enabledResourceProviders.Any(rp => rp.Equals(key, StringComparison.OrdinalIgnoreCase));
        }

        private List<string> _allowedUserAliases = new List<string>();

        public string AllowedUserAliases
        {
            get => string.Join(",", _allowedUserAliases);

            set
            {
                if (!string.IsNullOrEmpty(value))
                {
                    _allowedUserAliases = value.Split(',').Where(u => !string.IsNullOrWhiteSpace(u)).Select(u => u.Trim().Split('@')[0]).ToList();
                }
            }
        }

        public bool IsUserAllowedAccess(string userId, string resourceProviderName, string resourceTypeName)
        {
            if (!isCopilotEnabled(resourceProviderName, resourceTypeName) || _allowedUserAliases.Count == 0)
            {
                return isCopilotEnabled(resourceProviderName, resourceTypeName) && _allowedUserAliases.Count == 0;
            }

            userId = userId?.Split('@')?.Length > 0 ? userId.Split('@')[0].Trim() : string.Empty;
            return _allowedUserAliases.Any(u => u.Equals(userId, StringComparison.OrdinalIgnoreCase));
        }

        public bool FeedbackEnabled { get; set; } = false;

        private Dictionary<string, List<string>> _usersAllowedToSubmitFeedback = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        public string UsersAllowedToSubmitFeedback 
        {
            get
            {
                if (_usersAllowedToSubmitFeedback?.Count < 1)
                {
                    return string.Empty;
                }

                List<string> settingsList = new List<string>();
                foreach (KeyValuePair<string, List<string>> kvp in _usersAllowedToSubmitFeedback)
                {
                    settingsList.Add($"{kvp.Key}:{string.Join(',', kvp.Value)}");
                }

                return string.Join('|', settingsList);
            }

            set
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    foreach (string str in value.Split("|"))
                    {
                        string rpName = str.Split(':')[0].Trim('/').Trim();
                        List<string> userNames = str.Split(':').Length > 1 ?
                                        str.Split(':')[1].Split(',').Where(u => !string.IsNullOrWhiteSpace(u)).Select(u => u.Trim().Split('@')[0]).ToList()
                                        : new List<string>();

                        if (!_usersAllowedToSubmitFeedback.ContainsKey(rpName))
                        {
                            _usersAllowedToSubmitFeedback.TryAdd(rpName, userNames);
                        }
                        else
                        {
                            if (userNames.Count > 0)
                            {
                                _usersAllowedToSubmitFeedback[rpName].AddRange(_usersAllowedToSubmitFeedback[rpName].Union(userNames, StringComparer.OrdinalIgnoreCase));
                            }
                        }
                    }
                }
            }
        }

        public bool IsUserAllowedToSubmitFeedback(string userId, string resourceProviderName, string resourceTypeName)
        {
            if (!FeedbackEnabled || string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(resourceProviderName) || string.IsNullOrWhiteSpace(resourceTypeName))
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(UsersAllowedToSubmitFeedback))
            {
                return true;
            }

            userId = userId.Trim().Split('@')[0];

            string key = $"{resourceProviderName.Trim()}/{resourceTypeName.Trim()}".Trim('/');

            if (!_usersAllowedToSubmitFeedback.ContainsKey(key))
            {
                return false;
            }

            return _usersAllowedToSubmitFeedback[key].Any(u => u.Equals(userId, StringComparison.OrdinalIgnoreCase));
        }
    }
}
