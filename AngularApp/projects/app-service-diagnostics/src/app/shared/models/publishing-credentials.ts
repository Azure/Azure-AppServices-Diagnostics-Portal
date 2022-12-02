import { ArmObj } from './armObj';

export interface PublishingCredentials extends ArmObj {
  properties: {
    name: string;
    publishingUserName: string;
    publishingPassword: string;
    scmUri: string;
  };
}
