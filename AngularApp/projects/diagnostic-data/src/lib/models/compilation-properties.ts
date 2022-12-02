export class CompilationProperties {
  scriptETag: string;
  assemblyName: string;
  assemblyBytes: string;
  pdbBytes: string;
  constructor() {
    this.scriptETag = '';
    this.assemblyBytes = '';
    this.assemblyName = '';
    this.pdbBytes = '';
  }
}
