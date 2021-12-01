interface Idatetime {
  dateTime: string;
}

export interface Ievent {
  start: Idatetime;
  end: Idatetime;
}

const data: Ievent[] = [
  {
    start: {
      dateTime: '2021-05-31T13:00:00-04:00',
    },
    end: {
      dateTime: '2021-05-31T14:00:00-04:00',
    }
  },
  {
    start: {
      dateTime: '2021-05-31T19:00:00-04:00',
    },
    end: {
      dateTime: '2021-05-31T20:00:00-04:00',
    }
  },
  {
    start: {
      dateTime: '2021-06-01T15:00:00-04:00',
    },
    end: {
      dateTime: '2021-06-01T16:00:00-04:00',
    }
  }
]

export default data;
