using Azure.Search.Documents.Indexes;
using SendGrid.Helpers.Mail;

namespace AppLensV3.Models
{
    public class CognitiveSearchDocument
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Url { get; set; }
        public string JsonPayload { get; set; }

        public CognitiveSearchDocument(string id, string title, string content, string url = null, string jsonPayload = null)
        {
            Id = id;
            Title = title;
            Content = content;
            Url = url;
            JsonPayload = jsonPayload;
        }
    }

    public class CognitiveSearchDocumentWrapper
    {
        [SimpleField(IsFilterable = true, IsKey = true)]
        public string Id { get; set; }

        [SimpleField(IsFilterable = true)]
        public string AdditionalMetadata { get; set; }

        [SearchableField(IsFilterable = true)]
        public string Description { get; set; }

        [SearchableField(IsFilterable = true)]
        public string Text { get; set; }
    }

    public class SearchSettingsBase
    {
        public string IndexName { get; set; }
        public bool IncludeReferences { get; set; }
        public int NumDocuments { get; set; } = 3;
        public double MinScore { get; set; } = 0.5;
    }

    public class DocumentSearchSettings: SearchSettingsBase
    {
        public string IndexName { get; set; }
        public string DocumentContentPlaceholder { get; set; } = "<<DOCUMENT_CONTENT_HERE>>";
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
