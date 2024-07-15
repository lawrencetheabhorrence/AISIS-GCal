const headerinfo = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//lawrencetheabhorrence//aisis-gcal//EN";
const weekdays = {
  'M': 'MO',
  'T': 'TU',
  'W': 'WE',
  'TH': 'TH',
  'FR': 'FR',
  'SAT': 'SA'
};

const weekdaysArr = ['MO','TU','WE','TH','FR','SA'];

/* need to update every sem */
/* dates are in YYYY-MM-DD */
const startDate = {
  'MO': '20240812',
  'TU': '20240813',
  'WE': '20240807',
  'TH': '20240808',
  'FR': '20240809',
  'SA': '20240810'
};

const endDate = '20241128';

function closestStartDateFromStr(wdString) {
  switch (wdString) {
    case 'M-TH':
      return startDate['TH'];
    case 'T-F':
      return startDate['FR'];
    case 'W':
      return startDate['WE'];
    case 'SAT':
      return startDate['SA'];
    case 'D':
      return startDate['WE'];
  }

  return startDate['WE'];
}

function closestStartDate(days) {
  if (days.has('WE')) { return startDate['WE']; }
  if (days.has('TH')) { return startDate['TH']; }
  if (days.has('FR')) { return startDate['FR']; }
  if (days.has('SA')) { return startDate['SA']; }
  if (days.has('MO')) { return startDate['MO']; }
  if (days.has('TU')) { return startDate['TU']; }

  return startDate['WE'];
}

function pad(n) {
  // helper function with 0-padding
  // up to 2 digits
  return (n > 9 ? `${n}` : `0${n}`);
}

class CourseEvent {
  constructor(name,loc,days,timeStart,timeEnd,startDateGiven) {
    const sd = (!startDateGiven ? closestStartDate(days) : startDateGiven);
    this.name = name;
    this.loc = loc;
    this.days = days;
    this.ts = `${sd}T${timeStart}00`;
    this.te = `${sd}T${timeEnd}00`;
    this.until = `${endDate}T000000`;
  }

  set timeEnd(te) {
    this.te = `${startDateGiven}T${te}00`;
  }

  set timeStart(ts) {
    this.ts = `${startDateGiven}T${ts}00`;
  }

  static padTime(t) {
    if (t.length < 4) {
      return "0".repeat(4-t.length) + t;
    }
  }

  addDay(d) {
    days.push(d);
  }

  get freq() {
    if (days.length >= 5) { return "DAILY"; }
    return "WEEKLY";
  }

  toString() {
    /* uid generation only works because aisis is on https */
    const now = new Date(Date.now())
      .toISOString()
      .split('.')[0]
      .replaceAll('-','')
      .replaceAll(':','');
    const fr = `RRULE:FREQ=${this.freq};UNTIL=${this.until}`;
    return ["BEGIN:VEVENT",
            `UID:${self.crypto.randomUUID()}`,
            "SEQUENCE:0",
            `DTSTAMP:${now}`,
            `DTSTART;TZIP=Asia/Manila:${this.ts}`,
            `DTEND;TZIP=Asia/Manila:${this.te}`,
            fr + (this.freq == 'DAILY' ? '' : `;BYDAY=${this.days.join(',')}`),
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
  if (dayString == "D") { return weekdaysArr.slice(0,5); }
  return days.map((d) => weekdays[d]);
}


function isEmpty(s) {
  /* helper function to check if
   * string is empty, including
   * strings with only whitespace */
  return (s.trim() == '');
}

function createCalButton() {
    const calLink= document.createElement('a');
    calLink.classList.add("button01");

    calLink.style.textDecoration = 'none';
    calLink.style.paddingInline = '6px';
    calLink.style.paddingBlock = '1px';
    calLink.style.border = '2px solid buttonborder';

    calLink.textContent="Export to Calendar";
    calLink.setAttribute('href', 'data:text/calendar;charset=utf8,' + encodeURIComponent(cal.toString()));
    calLink.setAttribute('download','class_schedule.ics');

    return calLink;
}

if (window.location.href=='https://aisis.ateneo.edu/j_aisis/confirmEnlistment.do') {
  const tb = document.querySelector("table[align='center']");
  if (tb) {
    const table = tb.tBodies[0];
    const rows = table.children;
    for (let i=1;i<table.children.length-1;++i) {
      const r = rows[i];
      const sched = r.children[4].textContent;

      const intermediate = sched.split('/');
      const loc = intermediate[1].slice(0,-14);
      const days = convertDays(intermediate[0].split(' ')[0]);
      const name = r.children[0].textContent;
      const timeStart = intermediate[0].split(' ')[1].split('-')[0];
      const timeEnd =intermediate[0].split(' ')[1].split('-')[1];
      const course = new CourseEvent(name,loc,days,timeStart,timeEnd,closestStartDateFromStr(intermediate[0].split(' ')[0]));
      cal.addCourse(course);
    }

    const calLink = createCalButton();
    // insert button
    table.lastElementChild.firstElementChild.append(calLink);
  }
}
else if (window.location.href=='https://aisis.ateneo.edu/j_aisis/J_VMCS.do') {
  const tb = document.querySelector["table[width='90%']"].tBodies[0];
  const courseStrings = new Set();
  const courses = [];
  if (tb) {
    const rows = tb.children;
    for (let i=1;i<rows.length;++i) {
      const t = rows[i].children[0].split('-');
      for (let j=1;j<7;++j) {
        const s = rows[i].children[j].innerText;
        if (isEmpty(s)) { continue; }
        if (!courseStrings.has(s)) {
          courseStrings.add(s);
          const days = new Set([weekdaysArr[j-1]]);
          const ce = new CourseEvent(innerText.split('\n')[0],
                                    innerText.split(' ')[2],
                                    days,t[0],t[1],null);
          courses.push(ce);
        } else {
          const ce = courses.filter((c) => c.name == s)[0];
          ce.timeEnd = t[1];
          ce.days.add(weekdaysArr[j-1]);
        }
      }
    }

    for (const ce of courses) {
      cal.addCourse(ce);
    }

    const calLink = createCalButton();
    tb.insertAdjacentElement('afterend',calLink);
  }
}
