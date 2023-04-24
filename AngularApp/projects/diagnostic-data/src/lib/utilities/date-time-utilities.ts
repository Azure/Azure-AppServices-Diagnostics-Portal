import * as moment from "moment";

export class DateTimeUtilities {
    static readonly yearAndDateFormat: string = "YYYY-MM-DD";
    static readonly timeFormat: string = "HH:mm";
    static readonly fullStringFormat: string = `${DateTimeUtilities.yearAndDateFormat} ${DateTimeUtilities.timeFormat}`;

    //Convert UTC time to show in calendar and time picker
    static convertMomentInUTCToDateAndTime(m: moment.Moment): { date: Date, time: string } {
        const date = new Date(
            m.year(), m.month(), m.date(), m.hour()
        );
        const time = m.format(DateTimeUtilities.timeFormat);

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