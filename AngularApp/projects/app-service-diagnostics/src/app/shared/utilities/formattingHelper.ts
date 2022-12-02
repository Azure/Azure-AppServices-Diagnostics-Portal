export class FormatHelper {
  static timespanToSeconds(timeInterval: string): number {
    if (!timeInterval || timeInterval.indexOf(':') < 0) {
      return 0;
    }
    const a = timeInterval.split(':'); // split it at the colons
    // minutes are worth 60 seconds. Hours are worth 60 minutes.
    const seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2];
    return seconds;
  }

  static secondsToTimespan(seconds: number): string {
    if (seconds <= 0) {
      return '';
    }
    const date = new Date(null);
    date.setSeconds(seconds); // specify value for SECONDS here
    const timeString = date.toISOString().substr(11, 8);
    return timeString;
  }

  static formatBytes(bytes, decimals) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024,
      dm = decimals || 2,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static getDurationFromDate(start: string, end: string): string {
    let startDate = new Date(start);
    let endDate = new Date(end);
    let endDateTime = new Date(endDate).getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const duration = endDateTime.valueOf() - startDate.valueOf();
    const inDays = Math.round(duration / oneDay);
    const inHours = Math.round((duration * 24) / oneDay);
    const inMinutes = Math.round((duration * 24 * 60) / oneDay);
    let durationString =
      inDays > 0
        ? inDays.toString() + ' day(s)'
        : inHours > 0
        ? inHours.toString() + ' hour(s)'
        : inMinutes.toString() + ' minute(s)';
    return durationString;
  }
}
