
namespace DiagPortalTest
{
    class CaseSubmissionItem
    {
        public string SupportTopicId { get; set; }
        public string SapSupportTopicId { get; set; }
        public string SapProductId { get; set; }

        public string CaseSubject { get; set; }
    }


    class DiagAndSolveItem
    {
        public string CategoryName { get; set; }
        public string DetectorName { get; set; }

        public string DiagPortalPath { get; set; }
    }

    class DiagTestData
    {
        public string ResourceUri { get; set; }

        public CaseSubmissionItem CaseSubmission { get; set; }

        public DiagAndSolveItem DiagAndSolve { get; set; }
    }

    class DiagPortalTestConst
    {
        public static readonly string DiagPortalTestEmail = "DiagPortalTestEmail";
        public static readonly string KeyVaultDevUri = "KeyVaultDevUri";

        //Getting from environment variable
        public static readonly string DiagPortalTestPassword = "DiagPortalTestPassword";
        public static readonly string DiagPortalTestEnvironment = "DiagPortalTestEnvironment";

        //Getting from runsetting file
        public static readonly string Slot = "Slot";
        public static readonly string Region = "Region";
    }
}
