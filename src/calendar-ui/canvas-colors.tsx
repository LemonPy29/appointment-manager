import { style, textStyle } from "./canvas-api";
import { MainCalendar, SideCalendar, UserEventsArtist } from "./geometry";

export const black: style = { R: 7, G: 36, B: 44 };
export const red: style = { R: 187, G: 98, B: 125 };
export const green: style = { R: 136, G: 204, };
export const yellow: style = { R: 151, G: 143, B: 101 };
export const blue: style = { R: 43, G: 88, B: 96 };
export const magenta: style = { R: 123, G: 135, B: 145 };
export const cyan: style = { R: 0, G: 119, B: 119 };
export const white: style = { R: 145, G: 163, B: 176 };
export const lavender: style = { R: 179, G: 102, B: 255 };
export const bg: style = { R: 255, G: 255, B: 255 };
export const fg: style = { R: 30, G: 30, B: 63 };

export type Asset<Obj> = {
  [key in keyof Obj]?: style | textStyle;
};

export const mainCalendarAssets: Asset<MainCalendar> = {
  hourNode: { ...black, alpha: 0.5, font: "monospace" },
  selectedBlock: { ...green, alpha: 0.75 },
  grid: { ...white, alpha: 0.3 },
  selectedDay: { ...lavender },
  dayInitials: { ...black, alpha: 0.7, size: 16 },
  notSelectedNodes: { ...black, alpha: 0.7, size: 16, font: "monospace" },
  selectedNode: { ...bg, size: 16, font: "monospace" },
};

export const sideCalendarAssets: Asset<SideCalendar> = {
  monthName: { ...magenta },
  selectedBlock: { ...lavender },
  notSelectedNodes: { ...black, alpha: 0.7, size: 12, font: "monospace" },
  selectedNode: { ...bg, size: 12, font: "monospace" },
};

export const userAssets: Asset<UserEventsArtist> = {
  userNodes: { ...bg, size: 13, baseline: "top" },
  userPaths: { ...lavender },
};
