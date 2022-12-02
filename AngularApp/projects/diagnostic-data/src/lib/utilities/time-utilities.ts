import * as momentNs from 'moment';

export class TimeUtilities {
  public static roundDownByMinute(date: momentNs.Moment, minutes: number) {
    // This will round down to closest minute, then round down to x minute.
    date.startOf('minute').minute(date.minute() - (date.minute() % minutes));
  }

  public static roundDown(date: momentNs.Moment, duration: momentNs.Duration) {
    if (duration.months() > 0) {
      date
        .startOf('month')
        .month(date.month() - (date.month() % duration.months()));
    }
    if (duration.days() > 0) {
      date.startOf('day').days(date.days() - (date.days() % duration.days()));
    }
    if (duration.hours() > 0) {
      date
        .startOf('hour')
        .hours(date.hours() - (date.hours() % duration.hours()));
    }
    if (duration.minutes() > 0) {
      date
        .startOf('minute')
        .minutes(date.minutes() - (date.minutes() % duration.minutes()));
    }
  }
}

export class TimeZones {
  public static readonly UTC: string = 'Etc/UTC';
}
