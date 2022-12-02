export interface ResponseMessageEnvelope<T> {
  id: string;
  name: string;
  type: string;
  kind: string;
  location: string;
  tags: any;
  properties: T;
}

export interface ResponseMessageCollectionEnvelope<T> {
  id: string;
  nextLink: string;
  value: T[];
}
