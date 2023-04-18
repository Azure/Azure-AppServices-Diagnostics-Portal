
namespace DiagPortalTest
{
    public class CaseSubmissionItem
    {
        public string SupportTopicId { get; set; }
        public string SapSupportTopicId { get; set; }
        public string SapProductId { get; set; }

        public string CaseSubject { get; set; }
    }


    public class DiagAndSolveItem
    {
        public string CategoryName { get; set; }
        public string DetectorName { get; set; }

        public string DiagPortalPath { get; set; }
    }

    public class DiagTestData
    {
        public string ResourceUri { get; set; }

        public CaseSubmissionItem CaseSubmission { get; set; }

        public DiagAndSolveItem DiagAndSolve { get; set; }
    }

    class DiagPortalTestConst
    {
        //Getting from appsettings
        public static readonly string DiagPortalTestEmail = "diagPortalTestEmail";
        public static readonly string KeyVaultDevUri = "keyVaultDevUri";

        //Getting from environment variable
        public static readonly string DiagPortalTestPassword = "DiagPortalTestPassword";
        public static readonly string DiagPortalTestEnvironment = "DiagPortalTestEnvironment";

        //Getting from runsetting file
        public static readonly string Slot = "Slot";
        public static readonly string Region = "Region";
    }
}
