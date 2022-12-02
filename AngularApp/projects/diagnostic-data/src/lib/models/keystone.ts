import { HealthStatus } from './detector';
import { Solution } from '../components/solution/solution';

export interface KeystoneInsight {
  Status: HealthStatus;
  Title: string;
  Description: string;
  Solution: Solution;
  StartDate: Date;
  ExpiryDate: Date;
}
