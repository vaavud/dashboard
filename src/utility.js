"use strict"

// Constants
const MS_PER_DAY = 1000*60*60*24
const DISPLAY_DAYS = 28
const DISPLAY_CAMPAIGNS = 10


function parseDate(input) {
    var parts = input.split('-');
    // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(parts[0], parts[1] - 1, parts[2]); // Note: months are 0-based
  }

function currentYear() {
  return new Date().getFullYear()
}

function currentDayInMonth() {
  return new Date().getDate()
}

function currentStartDay() {
  return new Date(new Date().setDate(new Date().getDate()-(currentDayInMonth()-1)))
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth()+1, 0).getDate()
}

module.exports = {
  parseDate: parseDate,
  currentYear: currentYear,
  currentDayInMonth: currentDayInMonth,
  currentStartDay: currentStartDay,
  daysInMonth: daysInMonth,
  const: {
    MS_PER_DAY: MS_PER_DAY,
    DISPLAY_DAYS: DISPLAY_DAYS,
    DISPLAY_CAMPAIGNS: DISPLAY_CAMPAIGNS,
  }
}
