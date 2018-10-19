﻿export interface DeploymentLocations{
    locations: Location[];
    hostingEnvironmentDeploymentInfos : Location[];
}

export interface Location{
    name : string;
    description? : string;
    sortOrder? : number;
    displayName? : string;
    location? : string;
}

// export interface HostingEnvironmentInfo{
//     name : string;
//     location : string;
// }