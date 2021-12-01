import React from "react";
import {
  useCalendarApi,
  getUserEvents,
  insertDate,
  handleSignIn,
  handleSignOut,
} from "../events-api/google-calendar-api";
import { eventStore, eventProcess } from "../events-api/calendar-events";
import { SideCalendar, MainCalendar } from "./calendar-components";
import { some, none, foldW } from "fp-ts/Option";
import { map } from "fp-ts/Either";
import "./calendar.css";

interface IdateContext {
  date: Date;
  setDate: (input: Date) => void;
}

export const dateContext = React.createContext({} as IdateContext);

const Calendars = () => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [userEvents, setUserEvents] = React.useState<eventStore>(none);

  const dateContextValue: IdateContext = {
    date: currentDate,
    setDate: (_date: Date) => setCurrentDate(_date),
  };

  const { api, user } = useCalendarApi();

  const saveUserEvents = async () => {
    foldW(
      async () => {
        const wrappedEvents = await getUserEvents(api);
        map((res: any) => setUserEvents(some(eventProcess(res.result.items))))(
          wrappedEvents
        );
      },
      () => {}
    )(userEvents);
  };

  const sendEvent = (_: React.MouseEvent<HTMLElement>) => {
    insertDate(api, currentDate).then((response: any) => {
      console.log(response);
    });
  };

  user && api.client.calendar && saveUserEvents();

  return (
    <div>
      {user && userEvents ? (
        <div>
          <button onClick={handleSignOut(api)}>Sign Out</button>
          <dateContext.Provider value={dateContextValue}>
            <p>Tu hora {`${currentDate}`}</p>
            <button onClick={sendEvent}>Tomar hora</button>
            <div className="calendar">
              <MainCalendar userEvents={userEvents} />
              <SideCalendar />
            </div>
          </dateContext.Provider>
        </div>
      ) : (
        <button onClick={handleSignIn(api)}>Sign In</button>
      )}
    </div>
  );
};

export default Calendars;
