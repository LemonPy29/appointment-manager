import { flow, pipe } from 'fp-ts/function';
import { BLOCK_TIME } from '../events-api/google-calendar-api';

export const months: string[] = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const _getDate = (date: Date): number => date.getDate();

export const setHour = (hour: number) => (date: Date) => 
  new Date(date.setHours(hour, 0, 0));

export const daysSymbol: string[] = [ 'L', 'M', 'W', 'J', 'V', 'S', 'D' ];

export const setDay = (day: number) => (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), day);

export const shiftMonth = (shift: number) => (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + shift, date.getDate());

export const dayOfWeek = (date: Date): number => ((date.getDay() + 6)%7);

const firstDayOfMonth = flow(setDay(1), dayOfWeek);

const lastDayOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

const lastWeekDay = flow(lastDayOfMonth, dayOfWeek);
 
export const dayToIndex = (date: Date): number => 
  firstDayOfMonth(date) + date.getDate() - 1;

export const indexToDay = (idx: number) => (date: Date) =>
  setDay(idx - firstDayOfMonth(date) + 1)(date);

export const indexToHour = (idx: number): number => ((idx/7)|0) + 9;

export const indexToDatetime = flow(indexToHour, setHour);

export const datetimeToMainIndex = (date: Date): number => 
  dayOfWeek(date) + (date.getHours() - 9) * 7;

export const daysOfMonth = (date: Date): number[] => 
  Array.from(
    { length: firstDayOfMonth(date) },
    (_, i) => 
      pipe(
        date, 
        shiftMonth(-1), 
        lastDayOfMonth,
        _getDate
      ) - firstDayOfMonth(date) + i + 1
  ).concat(
    Array.from({ length: pipe(date, lastDayOfMonth, _getDate) }, 
      (_, i) => i + 1
    )
  ).concat(
    Array.from({ length: (6 - lastWeekDay(date)) }, (_, i) => i + 1)
  );

const firstIndexOfWeek = (date: Date): number => 
  dayToIndex(date) - dayOfWeek(date);

export const daysOfWeek = (date: Date): number[] => {
  const days = daysOfMonth(date);
  const first = firstIndexOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => days[first + i])
}

export function multiIndexArray <T>(a: T[]) {
  return (idxs: number[]) =>
    idxs.reduce((result: T[], idx) => result.concat(a[idx]), []);
}

export const isThisWeek = (d: Date) => {
  const monday = new Date(
    d.getFullYear(), d.getMonth(), d.getDate() - dayOfWeek(d)
  );
  const sunday = new Date(
    d.getFullYear(), d.getMonth(), d.getDate() - dayOfWeek(d) + 6
  );
  return (e: Date) => 
    (e.valueOf() - monday.valueOf() > 0) &&
      (sunday.valueOf() - e.valueOf() > 0)
};

export const endStartDiff = (start: Date, end: Date): number => 
  (end.valueOf() - start.valueOf()) / BLOCK_TIME;
