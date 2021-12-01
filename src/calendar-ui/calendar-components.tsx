import {
  WIDTH,
  HEIGHT,
  longTextNode,
  rectPath,
  mainCalendar,
  sideCalendar,
  UserEventsArtist,
} from "./geometry";
import * as f from "./canvas-api";
import * as colors from "./canvas-colors";
import * as d from "./date-utils";
import * as O from "fp-ts/Option";
import { dateContext } from "./calendar";
import { flow, pipe } from "fp-ts/function";
import React, { FunctionComponent } from "react";
import {
  isThisWeekEvent,
  eventStore,
  getPathAndNode,
  getMainIndices,
} from "../events-api/calendar-events";

export interface mainCalendarProps {
  userEvents: eventStore;
}

export const SideCalendar: FunctionComponent = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { date, setDate } = React.useContext(dateContext);

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const ratio = window.devicePixelRatio;
    canvas.width = WIDTH * ratio;
    canvas.height = HEIGHT * ratio;
    canvas.style.width = WIDTH + "px";
    canvas.style.height = HEIGHT + "px";
    canvas.getContext("2d")!.scale(ratio, ratio);

    const ctx = canvas.getContext("2d")!;

    sideCalendar.setNodes(date);
    const blocks = sideCalendar.blocks;
    const arrows = sideCalendar.arrows;

    const onGridClickCallback = (idx: O.Option<number>): void => {
      O.fold(
        () => {},
        (idxClicked: number) => pipe(date, d.indexToDay(idxClicked), setDate)
      )(idx);
    };

    const onGridClick = flow(
      f.onPathClick(...blocks)(ctx),
      f.findClicked,
      onGridClickCallback
    );

    const onArrowsClickCallback = (idx: O.Option<number>): void => {
      O.fold(
        () => {},
        (i: number) => {
          pipe(date, d.shiftMonth(2 * i - 1), setDate);
        }
      )(idx);
    };

    const onArrowsClick = flow(
      f.onPathClick(...arrows)(ctx),
      f.findClicked,
      onArrowsClickCallback
    );

    sideCalendar.draw(date, ctx, colors.sideCalendarAssets);

    canvas.addEventListener("click", onGridClick);
    canvas.addEventListener("click", onArrowsClick);

    return () => {
      canvas.removeEventListener("click", onGridClick);
      canvas.removeEventListener("click", onArrowsClick);
    };
  }, [date, setDate]);

  return <canvas ref={canvasRef} width={WIDTH} height={HEIGHT}></canvas>;
};

export const MainCalendar: FunctionComponent<mainCalendarProps> = ({
  userEvents,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { date, setDate } = React.useContext(dateContext);
  const [hovered, setHovered] = React.useState<O.Option<number>>(O.none);

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const ratio = window.devicePixelRatio;
    canvas.width = WIDTH * ratio;
    canvas.height = HEIGHT * ratio;
    canvas.style.width = WIDTH + "px";
    canvas.style.height = HEIGHT + "px";
    canvas.getContext("2d")!.scale(ratio, ratio);

    const ctx = canvas.getContext("2d")!;

    const grid = mainCalendar.grid;
    const days = mainCalendar.days;

    const weekUserEvents = O.getOrElseW(() => [])(userEvents).filter(
      isThisWeekEvent(date)
    );
    const [userPaths, longUserPaths, userNodes, longUserNodes] =
      getPathAndNode(weekUserEvents);
    const userIndices = getMainIndices(weekUserEvents);

    const onGridClickCallback = O.fold(
      () => {},
      (idxClicked: number) => {
        const _idx = d.dayToIndex(date) + (idxClicked % 7) - d.dayOfWeek(date);
        pipe(date, d.indexToDay(_idx), d.indexToDatetime(idxClicked), setDate);
      }
    );

    const onGridClick = flow(
      f.onPathClick(...grid)(ctx),
      f.findClickedWithFilter(userIndices),
      onGridClickCallback
    );

    const onDaysBlocksClickCallback = O.fold(
      () => {},
      (idxClicked: number) => {
        const _idx = d.dayToIndex(date) + idxClicked - d.dayOfWeek(date);
        pipe(date, d.indexToDay(_idx), setDate);
      }
    );

    const onDaysBlocksClick = flow(
      f.onPathClick(...days)(ctx),
      f.findClicked,
      onDaysBlocksClickCallback
    );

    const onHover = flow(
      f.onPathClick(...longUserPaths)(ctx),
      f.findClicked,
      setHovered
    );

    mainCalendar.draw(date, ctx, colors.mainCalendarAssets);
    UserEventsArtist.draw(userPaths, userNodes, ctx, colors.userAssets);

    O.fold(
      () => {},
      (idx: number) => {
        const node = longUserNodes[idx] as longTextNode;
        node.text = node.longText!;
        const pathLength = node.text.length;
        f.chainPipe(
          f.fillPath(rectPath(node.v, 10 * pathLength, 25), {
            ...colors.white,
          }),
          f.writeNode(node, { ...colors.black, size: 10, baseline: "top" })
        )(ctx);
      }
    )(hovered);

    canvas.addEventListener("mousemove", onHover);
    canvas.addEventListener("click", onDaysBlocksClick);
    canvas.addEventListener("click", onGridClick);

    return () => {
      canvas.removeEventListener("mousemove", onHover);
      canvas.removeEventListener("click", onDaysBlocksClick);
      canvas.removeEventListener("click", onGridClick);
    };
  }, [date, setDate, userEvents, hovered]);

  return <canvas ref={canvasRef} width={WIDTH} height={HEIGHT}></canvas>;
};
