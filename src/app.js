const headerinfo = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//lawrencetheabhorrence//aisis-gcal//EN";
const weekdays = {
  'M': 'MO',
  'T': 'TU',
  'W': 'WE',
  'TH': 'TH',
  'FR': 'FR',
  'SAT': 'SA'
};

/* need to update every sem */
/* dates are in YYYY-MM-DD */
const startDate = {
  'MO': '20240812',
  'TU': '20240813',
  'WE': '20240807',
  'TH': '20240808',
  'FR': '20240809',
  'SAT': '20240810'
};

const endDate = '20241128';

function closestStartDate(wdString) {
  // kind of hacky but idrc
  switch (wdString) {
    case 'M-TH':
      return startDate['TH'];
    case 'T-F':
      return startDate['FR'];
    case 'W':
      return startDate['WE'];
    case 'SAT':
      return startDate['SAT'];
    case 'D':
      return startDate['WE'];
  }

  return startDate['WE'];
}

function pad(n) {
  // helper function with 0-padding
  // up to 2 digits
  return (n > 9 ? `${n}` : `0${n}`);
}

class CourseEvent {
  constructor(name,loc,days,timeStart,timeEnd,startDateGiven,isDaily) {
    this.name = name;
    this.loc = loc;
    this.days = days;
    this.timeStart = `${startDateGiven}T${timeStart}00`;
    this.timeEnd = `${startDateGiven}T${timeEnd}00`;
    this.until = `${endDate}T000000`;
    this.freq = (isDaily ? 'DAILY':'WEEKLY');
  }
  toString() {
    /* only works because aisis is on https */
    const now = new Date(Date.now())
      .toISOString()
      .split('.')[0]
      .replaceAll('-','')
      .replaceAll(':','');
    const freq = `RRULE:FREQ=${this.freq};UNTIL=${this.until}`;
    return ["BEGIN:VEVENT",
            `UID:${self.crypto.randomUUID()}`,
            "SEQUENCE:0",
            `DTSTAMP:${now}`,
            `DTSTART;TZIP=Asia/Manila:${this.timeStart}`,
            `DTEND;TZIP=Asia/Manila:${this.timeEnd}`,
            freq + (this.freq == 'DAILY' ? '' : `;BYDAY=${this.days.join(',')}`),
            `SUMMARY:${this.name}`,
            `LOCATION:${this.loc}`,
            "END:VEVENT"].join('\r\n');
  }
}

class Calendar {
  constructor() {
    this.events = [];
  }
  addCourse(ce) {
    this.events.push(ce);
  }
  toString() {
    let cal = headerinfo;
    for (const c of this.events) {
      cal += '\r\n' + c.toString();
    }

    cal += '\r\nEND:VCALENDAR';
    return cal;
  }
}

const cal = new Calendar();

function convertDays(dayString) {
  const days = dayString.split('-');
  return days.map((d) => weekdays[d]);
}

function convertTime(timeString) {
  return timeString;
}

// get main content

if (window.location.href=='https://aisis.ateneo.edu/j_aisis/submitEnlistment.do') {
  const tb = document.querySelector("table[align='center']");
  if (tb) {
    const table = tb.tBodies[0];
    const rows = table.children;
    for (let i=1;i<table.children.length-1;++i) {
      const r = rows[i]; // tr
      const sched = r.children[4].textContent;
      if (sched) {
        const intermediate = sched.split('/');
        const loc = intermediate[1].slice(0,-14);
        const days = convertDays(intermediate[0].split(' ')[0]);
        const name = r.children[0].textContent;
        const timeStart = convertTime(intermediate[0].split(' ')[1].split('-')[0]);
        const timeEnd = convertTime(intermediate[0].split(' ')[1].split('-')[1]);
        const isDaily = (days[0] == 'D');
        const course = new CourseEvent(name,loc,days,convertTime(timeStart),convertTime(timeEnd),closestStartDate(intermediate[0].split(' ')[0]),isDaily);
        cal.addCourse(course);
      }
    }

    const calLink= document.createElement('a');
    calLink.textContent="Save to .ics";
    calLink.setAttribute('href', 'data:text/calendar;charset=utf8,' + encodeURIComponent(cal.toString()));
    calLink.setAttribute('download','enlistmentsummary.ics');

    tb.insertAdjacentElement('afterend',calLink);
  }
}
