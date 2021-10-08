//All svg files name under app-service-diagnostics/src/assets/img/detectors folder
//Update once add new icons into detectors folder
export const icons: Set<string> = new Set(
    [
        //detector Id
        'appchanges',
        'appcrashes',
        'eventviewer',
        'ParentAvailabilityAndPerformance',
        'ParentConfigurationManagement',
        'CertificateBindingOperations',
        'certificatedeleteoperations',
        'certificateuploadoperations',
        'backupFailures',
        'clientcertificateloadfailures',
        'CustomDomainAddFailureOnPortal',
        'webappcpu',
        'http4xx',
        'inaccessiblecerts',
        'KeyVaultAppSettings',
        'Memoryusage',
        'Migration',
        'MinTlsVersionChecker',
        'navigator',
        'configuringsslandcustomdomains',
        'appDownAnalysis',
        'ipaddressrestrictions',

        //Tools

        //Proactive Tools
        'mitigate',
        'cpumonitoring',
        'crashmonitoring',

        //Diagnostic Tools
        'profiler',
        'memorydump',
        'databasetester',
        'networktrace',
        'javamemorydump',
        'javathreaddump',
        'javaflightrecorder',
        'networkchecks',

        //Support Tools
        'sitemetrics',
        'appserviceplanmetrics',
        'eventviewer',
        'freblogs',
        'advancedapprestart',
    ]
);
