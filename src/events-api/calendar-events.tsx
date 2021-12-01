import { BLOCK_TIME } from "./google-calendar-api";
import * as d from "../calendar-ui/date-utils";
import { Option, fold, fromNullable } from "fp-ts/Option";
import { flow } from "fp-ts/function";
import { mainCalendar, longTextNode } from "../calendar-ui/geometry";

const MAX_N_CHARS = 14;

export interface Ievent {
  start: Date;
  end?: Date;
  summary: string;
  longSummary?: string;
}

export type eventStore = Option<Ievent[]>;

export const extractEventInfo = (ev: any): Ievent => ({
  start: new Date(ev.start.dateTime),
  end: new Date(ev.end.dateTime),
  summary: ev.summary,
});

export const isThisWeekEvent =
  (day: Date) =>
  (event: Ievent): boolean =>
    d.isThisWeek(day)(event.start);

export const splitEvents = (evs: Ievent[]): Ievent[] => {
  let res: Ievent[] = [];
  for (const ev of evs) {
    const diff = d.endStartDiff(ev.start, ev.end!) - 1;
    if (diff > 0) {
      res = res.concat(
        Array.from(
          { length: diff + 1 },
          (_, i) =>
            ({
              start: new Date(ev.start.getTime() + i * BLOCK_TIME),
              summary: ev.summary,
            } as Ievent)
        )
      );
    } else {
      res.push(ev);
    }
  }
  return res;
};

export const groupEvents = (evs: Ievent[]): Map<string, string> => {
  const numEvents = new RegExp("and ([0-9]+) more");
  const res = new Map<string, string>();

  for (const ev of evs) {
    ev.start.setHours(ev.start.getHours(), 0, 0);
    const currentKey = ev.start.toString();
    const possibleEvent = fromNullable(res.get(currentKey));
    fold(
      () => {
        res.set(currentKey, ev.summary);
      },
      (s: string) => {
        const match = fromNullable(s.match(numEvents));
        fold(
          () => {
            res.set(currentKey, ev.summary + " and 1 more");
          },
          (m: RegExpMatchArray) => {
            res.set(currentKey, ev.summary + ` and ${parseInt(m[1]) + 1} more`);
          }
        )(match);
      }
    )(possibleEvent);
  }
  return res;
};

export const eventFromMap = (evMap: Map<string, string>): Ievent[] => {
  const res: Ievent[] = [];
  for (const [key, value] of evMap.entries()) {
    res.push({ start: new Date(key), summary: value });
  }
  return res;
};

export const eventProcess = flow(
  (evs: Ievent[]) => evs.map((ev: Ievent) => extractEventInfo(ev)),
  splitEvents,
  groupEvents,
  eventFromMap
);

export const getMainIndices = (events: Ievent[]): number[] =>
  events.map((ev: Ievent) => d.datetimeToMainIndex(ev.start));

export function getPathAndNode(
  userEvents: Ievent[]
): [Path2D[], Path2D[], longTextNode[], longTextNode[]] {
  const paths = [] as Path2D[];
  const longPaths = [] as Path2D[];
  const nodes = [] as longTextNode[];
  const longNodes = [] as longTextNode[];

  for (const event of userEvents) {
    const isLong = event.summary.length > MAX_N_CHARS;

    const text = isLong
      ? event.summary.slice(0, MAX_N_CHARS) + "..."
      : event.summary;
    const longText = event.summary;

    const [node, path] = mainCalendar.dateToBlockAndNode(
      event.start,
      text,
      longText,
      5
    );

    if (isLong) {
      longPaths.push(path);
      longNodes.push(node);
    }

    paths.push(path);
    nodes.push(node);
  }

  return [paths, longPaths, nodes, longNodes];
}
