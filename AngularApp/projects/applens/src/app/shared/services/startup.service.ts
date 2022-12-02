import { Injectable } from '@angular/core';
import { ArmResource, ResourceServiceInputs } from '../models/resources';

@Injectable()
export class StartupService {
  private _resourceServiceInputs: ResourceServiceInputs;

  constructor() {}

  public getResourceInfo(): ArmResource {
    return this._resourceServiceInputs.armResource;
  }

  public getInputs(): ResourceServiceInputs {
    return this._resourceServiceInputs;
  }

  public setResource(inputs: ResourceServiceInputs) {
    this._resourceServiceInputs = inputs;
  }
}
