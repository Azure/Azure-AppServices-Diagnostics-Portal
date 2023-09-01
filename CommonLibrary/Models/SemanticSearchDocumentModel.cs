namespace CommonLibrary.Models
{
    public class SemanticSearchDocument
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Url { get; set; }
        public string CollectionName { get; set; }
        public string SourceName { get; set; } = string.Empty;
        public string JsonPayload { get; set; }

        public SemanticSearchDocument(string id, string title, string content, string url = null)
        {
            Id = id;
            Title = title;
            Content = content;
            Url = url;
        }
    }

    public class DocumentSearchSettings
    {
        public string IndexName { get; set; }
        public bool IncludeReferences { get; set; }
        public int NumDocuments { get; set; } = 3;
        public double MinScore { get; set; } = 0.5;
        public string DocumentContentPlaceholder { get; set; } = "<<DOCUMENT_CONTENT_HERE>>";
    }

    public class SearchSettingsBase
    {
        public string IndexName { get; set; }
        public bool IncludeReferences { get; set; }
        public int NumDocuments { get; set; } = 3;
        public double MinScore { get; set; } = 0.5;
    }

    public class ChatFeedbackSearchSettings : SearchSettingsBase
    {
        public string ContentPlaceholder { get; set; } = "<<FEEDBACK_CONTENT_HERE>>";
        public ChatFeedbackSearchSettings()
        {
            NumDocuments = 10;
        }

        public ChatFeedbackSearchSettings Clone()
        {
            return new ChatFeedbackSearchSettings()
            {
                NumDocuments = this.NumDocuments,
                MinScore = this.MinScore,
                ContentPlaceholder = this.ContentPlaceholder
            };
        }
    }
}
