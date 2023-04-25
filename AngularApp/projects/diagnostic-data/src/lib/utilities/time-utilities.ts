import * as moment from 'moment';

export class TimeUtilities {
    static readonly yearAndDateFormat: string = "YYYY-MM-DD";
    static readonly timeFormat: string = "HH:mm";
    static readonly fullStringFormat: string = `${TimeUtilities.yearAndDateFormat} ${TimeUtilities.timeFormat}`;


    public static roundDownByMinute(date: moment.Moment, minutes: number) {
        // This will round down to closest minute, then round down to x minute.
        date.startOf('minute').minute(date.minute() - date.minute() % minutes);
    }

    public static roundDown(date: moment.Moment, duration: moment.Duration) {
        if (duration.months() > 0) {
            date.startOf('month').month(date.month() - date.month() % duration.months());
        }
        if (duration.days() > 0 ) {
            date.startOf('day').days(date.days() - date.days() % duration.days());
        }
        if (duration.hours() > 0 ) {
            date.startOf('hour').hours(date.hours() - date.hours() % duration.hours());
        }
        if (duration.minutes() > 0 ) {
            date.startOf('minute').minutes(date.minutes() - date.minutes() % duration.minutes());
        }
    }

    //Convert UTC time to show in calendar and time picker
    static convertMomentInUTCToDateAndTime(m: moment.Moment): { date: Date, time: string } {
        const date = new Date(
            m.year(), m.month(), m.date(), m.hour()
        );
        const time = m.format(TimeUtilities.timeFormat);

        return {
            date, time
        }
    }

    //Convert date and time in picker into moment in UTC
    static convertDateAndTimeToUTCMoment(date: Date, time: string): moment.Moment {
        const hour = Number.parseInt(time.split(":")[0]);
        const minute = Number.parseInt(time.split(":")[1]);
        return moment.utc([date.getFullYear(), date.getMonth(), date.getDate(), hour, minute]);
    }
}
