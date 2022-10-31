export class WrappedManagementApiBody {
    Properties: any
}

export class NetworkTroubleshooterPostAPIBody {
    ProviderType: string;
    Credentials: Credentials;
    ResourceMetadata: ResourceMetadata;
}

export class NetworkTroubleshooterPostTcpPingBody {
    Host: string;
    Port: number;
}

export class Credentials {
    CredentialType: string;
    CredentialReference: CredentialReference;
    ResourceMetadata: ResourceMetadata;
}

export class CredentialReference {
    ReferenceType: string;
    ReferenceName: string;
}

export class ResourceMetadata {
    EntityName: string;
}