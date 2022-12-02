export class TimeZones {
  public static readonly UTC: string = 'Etc/UTC';
}

// This is used as the input to the date picker library
// Date Picker: https://danielykpan.github.io/date-time-picker/
// Formats: https://momentjs.com/docs/#/displaying/format/
export const CUSTOM_MOMENT_FORMATS = {
  parseInput: 'YYYY-MM-DD HH:mm UTC',
  fullPickerInput: 'YYYY-MM-DD HH:mm UTC',
  datePickerInput: 'YYYY-MM-DD',
  timePickerInput: 'HH:mm',
  monthYearLabel: 'MMM YYYY',
  dateA11yLabel: 'LL',
  monthYearA11yLabel: 'MMMM YYYY'
};
