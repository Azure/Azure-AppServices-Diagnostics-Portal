import { HealthStatus } from './detector';

export class StatusStyles {
    public static Critical: string = '#ff0000';
    public static Warning: string = '#ff9104';
    public static Healthy: string = '#3da907';
    public static Info: string = '#3a9bc7';
    public static Gift: string = 'dodgerblue';

    public static CriticalIcon: string = 'ib-redx';
    public static WarningIcon: string = 'ib-yellowexclam';
    public static HealthyIcon: string = 'ib-greencheck';
    public static InfoIcon: string = 'ib-blueinfo';
    public static GiftIcon: string = 'fa-gift';


    public static CriticalBackground: string = '#FEF0F1';
    public static WarningBackground: string = '#FFF8F0';
    public static HealthyBackground: string = '#F8FFF0';
    public static InfoBackground: string = '#F0F6FF';

    public static getColorByStatus(status: HealthStatus) {
        switch (status) {
            case HealthStatus.Critical:
                return StatusStyles.Critical;
            case HealthStatus.Warning:
                return StatusStyles.Warning;
            case HealthStatus.Success:
                return StatusStyles.Healthy;
            case HealthStatus.Info:
                return StatusStyles.Info;
            case HealthStatus.Onboarding:
                return StatusStyles.Gift;
            default:
                return '';
        }
    }

    public static getIconByStatus(status: HealthStatus) {
        switch (status) {
            case HealthStatus.Critical:
                return StatusStyles.CriticalIcon;
            case HealthStatus.Warning:
                return StatusStyles.WarningIcon;
            case HealthStatus.Success:
                return StatusStyles.HealthyIcon;
            case HealthStatus.Info:
                return StatusStyles.InfoIcon;
            case HealthStatus.Onboarding:
                return StatusStyles.GiftIcon;
            default:
                return '';
        }
    }

    public static getBackgroundByStatus(status: HealthStatus) {
        switch(status) {
            case HealthStatus.Critical:
                return StatusStyles.CriticalBackground;
            case HealthStatus.Warning:
                return StatusStyles.WarningBackground;
            case HealthStatus.Success:
                return StatusStyles.HealthyBackground;
            case HealthStatus.Info:
                return StatusStyles.Info;
            default:
                return '';
        }
    }
}
