
export interface Package {
  codeString: string;
  id: string;
  committedByAlias: string;
  packageConfig: string;
  dllBytes: string;
  pdbBytes: string;
  metadata: string;
  workflowJson:string
}

export interface Dependency {
  name: string;
  version: string;
  allVersions: string[];
}
