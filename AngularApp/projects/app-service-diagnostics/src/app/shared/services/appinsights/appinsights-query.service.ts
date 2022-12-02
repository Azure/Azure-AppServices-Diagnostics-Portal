import { Injectable } from '@angular/core';
import { AppInsightsService } from './appinsights.service';
import { CacheService } from '../cache.service';

@Injectable()
export class AppInsightsQueryService {
  constructor(
    private appinsightsService: AppInsightsService,
    private cache: CacheService
  ) {}

  GetTopExceptions(
    startTimeUTC: string,
    endTimeUTC: string,
    recordsLimit: number = 5,
    invalidateCache: boolean = false
  ) {
    const query: string = `
        exceptions
        | where timestamp >= datetime(${startTimeUTC}) and timestamp <= datetime(${endTimeUTC})
        | where client_Type == "PC"
        | summarize count() by outerMessage, problemId, type
        | top ${recordsLimit} by count_ desc`;

    const requests = this.appinsightsService.ExecuteQuery(query);

    return this.cache.get(
      `AppInsightExceptions-${startTimeUTC}--${endTimeUTC}`,
      requests,
      invalidateCache
    );
  }

  GetTopSlowestDependencies(
    startTimeUTC: string,
    endTimeUTC: string,
    recordsLimit: number = 5,
    invalidateCache: boolean = false
  ) {
    const query: string = `
        dependencies
        | where timestamp >= datetime(${startTimeUTC}) and timestamp <= datetime(${endTimeUTC})
        | where type != "Ajax"
        | summarize round(avg(duration), 2), round(percentile(duration, 50), 2), round(percentile(duration, 90), 2), round(percentile(duration, 95), 2), count()  by name, type
        | where percentile_duration_95 > 100
        | top ${recordsLimit} by avg_duration desc`;

    const requests = this.appinsightsService.ExecuteQuery(query);
    return this.cache.get(
      `AppInsightDependencies-${startTimeUTC}--${endTimeUTC}`,
      requests,
      invalidateCache
    );
  }

  private isNotNullOrEmpty(item: any): boolean {
    return item && item != '';
  }
}
