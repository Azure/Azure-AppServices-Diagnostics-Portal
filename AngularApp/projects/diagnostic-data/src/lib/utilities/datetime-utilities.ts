//import * as momentNs from 'moment';
import * as moment from 'moment';
import 'moment/locale/pt-br';
//const moment = momentNs;

export class DataTimeUtilities {
    public static readonly stringFormat = "YYYY-MM-DD HH:mm";

    //Input as local date,out put is formatted UTC string
    static convertLocalDateToUTCString(date: Date): string {
        //const moment = 
        const m = moment.utc(date.getTime());
        return m.format(DataTimeUtilities.stringFormat);
    }

    static getHourAndMinute(date: Date): string {
        return moment(date).format('HH:mm');
    }
}