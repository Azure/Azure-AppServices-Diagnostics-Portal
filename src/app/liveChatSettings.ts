// This file contains Live Chat Settings
export class LiveChatSettings {

    // If set to true, Live chat in home page will only show for demo subs
    // If set to false, it will show for all prod subs 
    public static DemoModeForHomePage: boolean = false;

    // If set to true, Live chat will show in case submission for enabled Topics for demo subs
    // If set to false, it will show for all prod subs.
    public static DemoModeForCaseSubmission: boolean = true;

    // List of Support Topics for which Live chat is Enabled
    public static enabledSupportTopics: string[] = [
        "32581615"
    ];

    // This indicates the time after which Live Chat will pop up. 
    public static InactivityTimeoutInMs: Number = 10000;

    // Live Chat Business Hours
    public static BuisnessStartDay: Number = 1; // Monday
    public static BuisnessEndDay: Number = 5;   // Friday
    public static BusinessStartHourPST: Number = 0;   // 9 AM PST
    public static BusinessEndHourPST: Number = 23;     // 4 PM PST
}