import React from 'react';
import { tryCatch } from 'fp-ts/TaskEither';
import { none, some, Option, foldW } from 'fp-ts/Option';
import { map } from 'fp-ts/Either';

export const BLOCK_TIME = 60 * 60000;

const Config = {
  apiKey: process.env.REACT_APP_CALENDAR_API_KEY!,
  clientId: process.env.REACT_APP_CALENDAR_CLIENT_ID!,
  discoveryDocs: [
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
  ],
  scope: "https://www.googleapis.com/auth/calendar"
}

interface Window {
  [key: string]: any;
}

interface IisSignedIn {
  get: () => boolean;
  listen: (f: (s: boolean) => void) => void;
}

interface IGoogleAuth {
  signIn: () => void;
  signOut: () => void;
  isSignedIn: IisSignedIn;
}

interface Iauth2 {
  getAuthInstance: () => IGoogleAuth;
}

interface Ievents {
  list: (p: any) => any;
  insert: (p: any) => any;
}

interface Icalendar {
  events: Ievents;
}

interface Iclient {
  init: (c: any) => Promise<void>;
  calendar: Icalendar;
}

export interface Igapi {
  auth2: Iauth2;
  load: (s: string, f:() => void) => void;
  client: Iclient;
}

interface IEventsArgs {
  calendarId: string;
  timeMin: string;
  showDeleted: boolean;
  singleEvents: boolean;
  maxResults: number;
  orderBy: string;
}

const initClient = (userListener: (status: boolean) => void) => () => {
  const _api = (window as Window)['gapi'] as Igapi;
  _api.client.init(Config)
    .then(() => {
      _api.auth2.getAuthInstance().isSignedIn.listen(userListener);
      userListener(
        _api.auth2.getAuthInstance().isSignedIn.get()
      );
    })
}

export const useCalendarApi = () => {
  const [api, setApi] = React.useState({} as Igapi);
  const [user, setUser] = React.useState(false);

  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    document.body.appendChild(script);

    script.onload = () => {
      (window as Window)['gapi']
        .load('client:auth2', initClient(setUser));
      setApi((window as Window)['gapi']);
    }

    return () => {
      document.body.removeChild(script);
    }
  }, [api])
  return { api, user };
}

export const getUserEvents = async (api: Igapi) => {
  const args = {
    'calendarId': 'primary',
    'timeMin': (new Date()).toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 10,
    'orderBy': 'StartTime'
  } as IEventsArgs;
  return tryCatch(
      () => api.client.calendar.events.list(args),
      (reason) => new Error(`${reason}`),
    )()
}

export async function useTaskEither<T>(unsafePromise: Promise<T>) {
  const [data, setData] = React.useState<Option<T>>(none);

  const te = tryCatch(
    () => unsafePromise,
    (reason) => new Error(`${ reason }`)
  );

  foldW(
    async () => {
      const safePromise = await te();
      const mapResponse = map(
        (response: T) => setData(some(response))
      );
      mapResponse(safePromise);
    },
    () => {  }
  )(data)

  return data;
}

const createEventFromDate = (date: Date) => (
  {
    'summary': 'Consulta Psicologica',
    'location': 'Zoom',
    'description': 'Consulta',
    'start': {
      'dateTime': date.toISOString(),
      'timeZone': 'America/Santiago'
    },
    'end': {
      'dateTime': (new Date(date.getTime() + BLOCK_TIME)).toISOString(),
      'timeZone': 'America/Santiago'
    }
  }
)

export const insertDate = (api: Igapi, date: Date): Promise<void> => {
  const consultaEvent = createEventFromDate(date);
  console.log(consultaEvent);
  return api.client.calendar.events.insert(
    {
      'calendarId': 'primary',
      'resource': consultaEvent
    }
  )
}

export const handleSignIn = (api: Igapi) => 
  (_: React.MouseEvent<HTMLElement>) => api.auth2.getAuthInstance().signIn();

export const handleSignOut = (api: Igapi) => 
  (_: React.MouseEvent<HTMLElement>) => api.auth2.getAuthInstance().signOut();
