export interface ArmResource {
  id: string;
  name: string;
  type: string;
  kind: string;
  location: string;
  properties: any;
  tags?: { [key: string]: string };
}
