import * as dateutils from "./date-utils";
import {
  moveTo,
  lineTo,
  quadraticCurveTo,
  chainPipe,
  fillPath,
  drawPath,
  writeNode,
  clear,
} from "./canvas-api";
import { Asset } from "./canvas-colors";
export const WIDTH = 1250;
export const HEIGHT = 1250;
const EDGE = 50;
const SIDE_BLOCK_SIZE = 30;
const SIDE_INNER_SIZE = 30;
const MAIN_BLOCK_WIDTH = 160;
const MAIN_BLOCK_HEIGHT = 50;

export type vtx = {
  x: number;
  y: number;
};

export interface textNode {
  v: vtx;
  text: string;
}

export interface longTextNode extends textNode {
  longText?: string;
}

interface calendarVertices {
  A: vtx;
  B: vtx;
  C: vtx;
  D: vtx;
  E: vtx;
  F: vtx;
}

const arrowPath = (v: vtx, direction: number, size: number = 10): Path2D => {
  const figure = new Path2D();
  const A = v;
  const B = { x: A.x, y: A.y + 2 * size };
  const C = { x: A.x + direction * size, y: A.y + size };

  chainPipe(moveTo(A), lineTo(B), lineTo(C), lineTo(A))(figure);
  return figure;
};

export const rectPath = (
  { x, y }: vtx,
  width: number,
  height: number
): Path2D => {
  const figure = new Path2D();
  figure.rect(x, y, width, height);
  return figure;
};

export const roundCornerRect = (
  c: vtx,
  width: number,
  height: number,
  eps: number
): Path2D => {
  const ABot = c;
  const AMid = { x: ABot.x, y: ABot.y - eps };
  const ATop = { x: ABot.x + eps, y: ABot.y - eps };

  const BTop = { x: ATop.x + width, y: ATop.y };
  const BMid = { x: BTop.x + eps, y: BTop.y };
  const BBot = { x: BTop.x + eps, y: BTop.y + eps };

  const CTop = { x: BBot.x, y: BBot.y + height };
  const CMid = { x: CTop.x, y: CTop.y + eps };
  const CBot = { x: CTop.x - eps, y: CTop.y + eps };

  const DBot = { x: CBot.x - width, y: CBot.y };
  const DMid = { x: DBot.x - eps, y: DBot.y };
  const DTop = { x: DBot.x - eps, y: DBot.y - eps };

  const fig = new Path2D();
  chainPipe(
    moveTo(ABot),
    quadraticCurveTo(AMid, ATop),
    lineTo(BTop),
    quadraticCurveTo(BMid, BBot),
    lineTo(CTop),
    quadraticCurveTo(CMid, CBot),
    lineTo(DBot),
    quadraticCurveTo(DMid, DTop),
    lineTo(ABot)
  )(fig);
  return fig;
};

class CalendarGeometry {
  protected _selectedNode: textNode = { v: { x: 0, y: 0 }, text: "" };
  protected _notSelectedNodes: textNode[] = [];
  protected width: number;
  protected height: number;
  protected blockWidth: number;
  protected blockHeight: number;
  vertices: calendarVertices;
  _path = new Path2D();

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    blockWidth: number,
    innerHeight: number
  ) {
    this.width = width;
    this.height = height;
    this.blockWidth = blockWidth;
    this.blockHeight = innerHeight;
    this.vertices = {
      A: { x, y } as vtx,
      B: { x: x + width, y } as vtx,
      C: { x: x + width, y: y + height } as vtx,
      D: { x: x, y: y + height } as vtx,
      E: { x: x, y: y + innerHeight } as vtx,
      F: { x: x + width, y: y + innerHeight } as vtx,
    };
  }

  get selectedNode() {
    return this._selectedNode;
  }

  get notSelectedNodes() {
    return this._notSelectedNodes;
  }

  get layout(): Path2D {
    chainPipe(
      moveTo(this.vertices.A),
      lineTo(this.vertices.B),
      moveTo(this.vertices.C),
      lineTo(this.vertices.D)
    )(this._path);
    return this._path;
  }

  get dayInitials(): textNode[] {
    const { blockWidth } = this;
    const { x, y } = this.vertices.E;
    return dateutils.daysSymbol.map((day, i) => ({
      v: {
        x: x + blockWidth * (0.475 + (i % 7)),
        y: y - blockWidth * 0.25,
      },
      text: day,
    }));
  }
}

export class SideCalendar extends CalendarGeometry {
  protected _nodes: textNode[] = [];
  protected _blocks: Path2D[] = [];
  protected _lastDate: Date = new Date();
  private _selectedBlock: Path2D = new Path2D();

  get arrows() {
    const { x, y } = this.vertices.B;
    const left = { x: x - 10, y: y + 10 };
    const right = { x: x - 5, y: y + 10 };
    return [arrowPath(left, -1), arrowPath(right, 1)];
  }

  setNodes(date: Date) {
    this._lastDate = date;
    const { x, y } = this.vertices.E;
    const idx = dateutils.dayToIndex(date);

    this._nodes = dateutils.daysOfMonth(date).map((text, i) => ({
      v: {
        x: x + SIDE_BLOCK_SIZE * (0.5 + (i % 7)),
        y: y + SIDE_BLOCK_SIZE * (0.5 + ((i / 7) | 0)),
      },
      text: `${text}`,
    }));

    this._selectedNode = this._nodes[idx];
    this._notSelectedNodes = this._nodes.filter((_, i) => i !== idx);
  }

  get blocks(): Path2D[] {
    return this._nodes.map(({ v }, _) => {
      const voff = {
        x: v.x - 0.15 * SIDE_BLOCK_SIZE,
        y: v.y - 0.5 * SIDE_BLOCK_SIZE,
      };
      return rectPath(voff, 0.75 * SIDE_BLOCK_SIZE, 0.75 * SIDE_BLOCK_SIZE);
    });
  }

  setSelectedBlock(date: Date) {
    const idx = dateutils.dayToIndex(date);
    this._selectedBlock = this.blocks[idx];
  }

  get selectedBlock() {
    return this._selectedBlock;
  }

  get nodes(): textNode[] {
    return this._nodes;
  }

  monthName(date: Date): textNode {
    const { x, y } = this.vertices.A;
    const currentMonth = date.getMonth();
    return {
      v: {
        x: x + 0.25 * SIDE_BLOCK_SIZE,
        y: y + 0.75 * SIDE_BLOCK_SIZE,
      },
      text: `${dateutils.months[currentMonth]}`,
    };
  }

  draw(date: Date, ctx: CanvasRenderingContext2D, asset: Asset<SideCalendar>) {
    if (this._lastDate !== date) {
      this.setNodes(date);
    }
    const monthName = this.monthName(date);
    this.setSelectedBlock(date);

    const drawPipe = chainPipe(
      clear({ x: 0, y: 0, width: 400, height: 400 }),
      drawPath(this.layout, asset["layout"]),
      fillPath(this.arrows, asset["arrows"]),
      fillPath(this._selectedBlock, asset["selectedBlock"]),
      writeNode(monthName, asset["monthName"]),
      writeNode(this.selectedNode, asset["selectedNode"]),
      writeNode(this.notSelectedNodes, asset["notSelectedNodes"]),
      writeNode(this.dayInitials, asset["dayInitials"])
    );

    drawPipe(ctx);
  }
}

export class MainCalendar extends CalendarGeometry {
  grid: Path2D[];
  private _nodes: textNode[] = [];
  private _lastDate = new Date();
  private _selectedDay = new Path2D();
  private _selectedBlock = new Path2D();

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    blockWidth: number,
    innerHeight: number
  ) {
    super(x, y, width, height, blockWidth, innerHeight);
    this.grid = Array.from({ length: 84 }, (_, i) => {
      const v = {
        x: this.vertices.E.x + blockWidth * (i % 7),
        y: this.vertices.E.y + innerHeight * ((i / 7) | 0),
      };
      return rectPath(v, MAIN_BLOCK_WIDTH, MAIN_BLOCK_HEIGHT);
    });
  }

  dateToVertex(date: Date): vtx {
    const idx = dateutils.datetimeToMainIndex(date);
    const { x, y } = this.vertices.E;
    return {
      x: x + this.blockWidth * (idx % 7),
      y: y + this.blockHeight * ((idx / 7) | 0) + 5,
    };
  }

  roundCornerBlock(c: vtx) {
    const border = 15;
    const width = this.blockWidth - border;
    const height = this.blockHeight - border;
    const curveLength = border / 2;
    return roundCornerRect(c, width, height, curveLength);
  }

  setNodes(date: Date) {
    this._lastDate = date;
    const { x, y } = this.vertices.E;

    const idx = dateutils.dayOfWeek(date);
    this._nodes = dateutils.daysOfWeek(date).map((dayNumber, i) => ({
      v: {
        x: x + this.blockWidth * (0.45 + (i % 7)),
        y: y - this.blockHeight * 0.3,
      } as vtx,
      text: `${dayNumber}`,
    }));

    this._notSelectedNodes = this._nodes.filter((_, i) => i !== idx);
    this._selectedNode = this._nodes[idx];
  }

  get days() {
    return this._nodes.map(({ v }) => {
      const voff = {
        x: v.x - 0.07 * this.blockHeight,
        y: v.y - 0.35 * this.blockHeight,
      };
      return rectPath(voff, 0.5 * this.blockHeight, 0.5 * this.blockHeight);
    });
  }

  setSelectedDay(date: Date) {
    const dayOfWeek = dateutils.dayOfWeek(date);
    this._selectedDay = this.days[dayOfWeek];
  }

  get selectedDay() {
    return this._selectedDay;
  }

  dateToBlock(date: Date) {
    const v = this.dateToVertex(date);
    return this.roundCornerBlock(v);
  }

  dateToBlockAndNode(
    date: Date,
    text: string,
    longText?: string,
    offx = 0,
    offy = 0
  ): [textNode | longTextNode, Path2D] {
    const v = this.dateToVertex(date);

    const node = {
      v: { x: v.x + offx, y: v.y + offy },
      text: text,
      longText: longText,
    };
    const path = this.roundCornerBlock(v);
    return [node, path];
  }

  setSelectedBlock(date: Date) {
    const v = this.dateToVertex(date);
    this._selectedBlock = this.roundCornerBlock(v);
  }

  get selectedBlock() {
    return this._selectedBlock;
  }

  get hourNode(): textNode[] {
    const { x, y } = this.vertices.E;
    return Array.from({ length: 13 }, (_, i) => ({
      v: {
        x: x - 45,
        y: y + this.blockHeight * i + 5,
      },
      text: `${i + 9}.00`,
    }));
  }

  draw(date: Date, ctx: CanvasRenderingContext2D, asset: Asset<MainCalendar>) {
    if (this._lastDate !== date) {
      this.setNodes(date);
    }

    this.setSelectedDay(date);
    this.setSelectedBlock(date);

    const drawPipe = chainPipe(
      clear({ x: 0, y: 0, width: 1250, height: 1250 }),
      fillPath(this._selectedDay, asset["selectedDay"]),
      fillPath(this._selectedBlock, asset["selectedBlock"]),
      writeNode(this.dayInitials, asset["dayInitials"]),
      writeNode(this.hourNode, asset["hourNode"]),
      writeNode(this._selectedNode, asset["selectedNode"]),
      writeNode(this._notSelectedNodes, asset["notSelectedNodes"]),
      drawPath(this.grid, asset["grid"])
    );

    drawPipe(ctx);
  }
}

export class UserEventsArtist {
  userPaths: Path2D[] = [];
  userNodes: longTextNode[] = [];

  static draw(
    userPaths: Path2D[],
    userNodes: longTextNode[],
    ctx: CanvasRenderingContext2D,
    asset: Asset<UserEventsArtist>
  ) {
    const drawPipe = chainPipe(
      fillPath(userPaths, asset["userPaths"]),
      writeNode(userNodes, asset["userNodes"])
    );

    drawPipe(ctx);
  }
}

export const mainCalendar = new MainCalendar(
  2 * EDGE,
  EDGE,
  7 * MAIN_BLOCK_WIDTH,
  13 * MAIN_BLOCK_HEIGHT,
  MAIN_BLOCK_WIDTH,
  MAIN_BLOCK_HEIGHT
);

export const sideCalendar = new SideCalendar(
  EDGE,
  EDGE,
  7 * SIDE_BLOCK_SIZE,
  6 * SIDE_BLOCK_SIZE + 2 * SIDE_INNER_SIZE,
  SIDE_BLOCK_SIZE,
  2 * SIDE_INNER_SIZE
);
