/* need to update every sem */
/* dates are in YYYY-MM-DD */
const startDate = {
  "now": {
    'MO': '20240610',
    'TU': '20240611',
    'WE': '20240605',
    'TH': '20240606',
    'FR': '20240607',
    'SA': '20240608'
  },
  "next": {
    'MO': '20240812',
    'TU': '20240813',
    'WE': '20240807',
    'TH': '20240808',
    'FR': '20240809',
    'SA': '20240810'
  }
};

const endDate = {'now': '20240720', 'next': '20241128'};
const weekdaysArr = ['MO','TU','WE','TH','FR','SA'];

function pad(n) {
  // helper function with 0-padding
  // up to 2 digits
  return (n > 9 ? `${n}` : `0${n}`);
}

class CourseEvent {
  #sem; #sd;
  constructor(name,loc,days,timeStart,timeEnd,startDateGiven,isPresentSem) {
    this.name = name;
    this.loc = loc;
    this.days = days;
    this.timeStart = this.#padTime(timeStart);
    this.timeEnd = this.#padTime(timeEnd);
    this.#sem = (isPresentSem ? "now" : "next");
    this.#sd = (!startDateGiven ? this.#closestStartDate() : this.#closestStartDateFromStr(startDateGiven));
  }

  #padTime(t) {
    if (t.length < 4) {
      return "0".repeat(4-t.length) + t;
    }
    return t;
  }

  addDay(d) {
    this.days.add(d);
    this.#sd = this.#closestStartDate();
  }

  #closestStartDate() {
    if (this.days.has('WE')) { return startDate[this.#sem]['WE']; }
    else if (this.days.has('TH')) { return startDate[this.#sem]['TH']; }
    else if (this.days.has('FR')) { return startDate[this.#sem]['FR']; }
    else if (this.days.has('SA')) { return startDate[this.#sem]['SA']; }
    else if (this.days.has('MO')) { return startDate[this.#sem]['MO']; }
    else if (this.days.has('TU')) { return startDate[this.#sem]['TU']; }
    else { return startDate[this.#sem]['WE']; }
  }

  #closestStartDateFromStr(wdString) {
    switch (wdString) {
      case 'M-TH':
        return startDate[this.#sem]['TH'];
      case 'T-F':
        return startDate[this.#sem]['FR'];
      case 'W':
        return startDate[this.#sem]['WE'];
      case 'SAT':
        return startDate[this.#sem]['SA'];
      case 'D':
        return startDate[this.#sem]['WE'];
    }
    return startDate[this.#sem]['WE'];
  }

  toString() {
    /* uid generation only works because aisis is on https */
    const now = new Date(Date.now())
      .toISOString()
      .split('.')[0]
      .replaceAll('-','')
      .replaceAll(':','');
    const until = `${endDate[this.#sem]}T000000`;
    return ["BEGIN:VEVENT",
            `UID:${self.crypto.randomUUID()}`,
            "SEQUENCE:0",
            `DTSTAMP:${now}`,
            `DTSTART;TZIP=Asia/Manila:${this.#sd}T${this.timeStart}00`,
            `DTEND;TZIP=Asia/Manila:${this.#sd}T${this.timeEnd}00`,
            `RRULE:FREQ=WEEKLY;UNTIL=${until};BYDAY=${Array.from(this.days).join(',')}`,
            `SUMMARY:${this.name}`,
            `LOCATION:${this.loc}`,
            "END:VEVENT"].join('\r\n');
  }
}

class Calendar {
  #events;
  constructor() {
    this.#events = [];
  }
  addCourse(ce) {
    this.#events.push(ce);
  }
  toString() {
    const headerinfo = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//lawrencetheabhorrence//aisis-gcal//EN";
    let cal = headerinfo;
    for (const c of this.#events) {
      cal += '\r\n' + c.toString();
    }

    cal += '\r\nEND:VCALENDAR';
    return cal;
  }
}

const cal = new Calendar();

function convertDays(dayString) {
  const weekdays = {
    'M': 'MO',
    'T': 'TU',
    'W': 'WE',
    'TH': 'TH',
    'FR': 'FR',
    'SAT': 'SA'
  };
  const days = dayString.split('-');
  if (dayString == "D") { return new Set(weekdaysArr.slice(0,5)); }
  return new Set(days.map((d) => weekdays[d]));
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
      const startDateGiven = intermediate[0].split(' ')[0];
      const course = new CourseEvent(name,loc,days,timeStart,timeEnd,startDateGiven,false);
      cal.addCourse(course);
    }

    const calLink = createCalButton();
    // insert button
    table.lastElementChild.firstElementChild.append(calLink);
  }
}
else if (window.location.href=='https://aisis.ateneo.edu/j_aisis/J_VMCS.do') {
  const table = document.querySelector("table[width='90%']");
  if (table) {
    const tb = table.tBodies[0];
    const rows = tb.children;
    const courses = [];
    let lastCourse;

    /* navigates the schedule per column,
     * thus a subject/course is represented
     * by multiple events that repeat once a week.
     */
    for (let i=1;i<7;++i) {
      for(let j=1;j<rows.length;++j) {
        const t = rows[j].children[0].textContent.split('-');
        const s = rows[j].children[i].innerText;

        if (isEmpty(s)) { lastCourse=s; continue; }
        if (!lastCourse || s != lastCourse) {
          const days = new Set([weekdaysArr[i-1]]);
          const lines = s.split('\n');
          const ce = new CourseEvent(lines[0],
            lines[1].slice(lines[1].indexOf(' ')+1,-14),
            days,t[0],t[1],null,true);
          courses.push(ce);
          lastCourse = s;
        } else {
          const c = courses[courses.length-1];
          c.timeEnd = t[1];
        }
      }
    }

    /* navigates the schedule per row, produces less events
     * but gaps in subjects are not implemented yet hree
     */
    /*
    const courseStrings = new Set();
    for (let i=1;i<rows.length;++i) {
      const t = rows[i].children[0].textContent.split('-');
      for (let j=1;j<7;++j) {
        const s = rows[i].children[j].innerText;
        if (isEmpty(s)) { continue; }
        if (!courseStrings.has(s)) {
          courseStrings.add(s);
          const days = new Set([weekdaysArr[j-1]]);
          const lines = s.split('\n');
          const ce = new CourseEvent(lines[0],
                                    lines[1].slice(lines[1].indexOf(' ')+1,-14),
                                    days,t[0],t[1],null,true);
          courses.push(ce);
        } else {
          const ce = courses.filter((c) => c.name == s.split('\n')[0])[0];
          ce.timeEnd = t[1];
          ce.addDay(weekdaysArr[j-1]);
        }
      }
    }
    */

    for (const ce of courses) {
      cal.addCourse(ce);
    }

    const calLink = createCalButton();
    table.insertAdjacentElement('afterend',calLink);
  }
}
