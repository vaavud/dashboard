var $ = require('jquery')
var Highcharts = require('highcharts')

// Current accounting year
var year = new Date().getFullYear()
var startDate = new Date(new Date().setDate(new Date().getDate()-30))
// console.log("testDate", testDate)
var todaysDate = new Date()
var _MS_PER_DAY = 1000*60*60*24;

/*
Retrive e-conomic data
*/
function getData(login){
  var p1021 = getEconomicAccount(login, 1021)
  var p1022 = getEconomicAccount(login, 1022)
  var p1023 = getEconomicAccount(login, 1023)
  var p1032 = getEconomicAccount(login, 1032)
  var p1033 = getEconomicAccount(login, 1033)

  return Promise.all([p1021, p1022, p1023, p1032, p1033])
  .then(data => {
    // var weekSum = accWeek(data)
    var daySum = accDay(data)
    var accSum = accPeriod(daySum)
    var test = budgetYTD(todaysDate)
    return {"daySum": daySum, "accSum": accSum}
  })
}


function getEconomicAccountPage(login, account, page) {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: `https://restapi.e-conomic.com/ACCOUNTS/${account}/ACCOUNTING-YEARS/`+ year + `/entries?skippages=${page}&pagesize=1000`,
        dataType: "json",
        headers: {
          "X-AppSecretToken": login.AppSecretToken,
          "X-AgreementGrantToken": login.AgreementGrantToken,
          "Content-Type": "application/json"
        },
        type: "GET"
      })
      // .always( resolve ); // resolve is a function that takes one parameter (and passes on this value)
      .always(function(result) {
        resolve(result)
      })
  })
}

function getEconomicAccount(login, account) {
  return new Promise((resolve, reject) => {
    getEconomicAccountPage(login, account, 0)
      .then(function(result) {
        var pageCount = Math.ceil(result.pagination.results / result.pagination.pageSize)

        if (pageCount === 1) {
          return resolve(result.collection)
        } else if (pageCount > 1) {
          var pagesPromises = []
          for (var i = 1; i < pageCount; i++) {
            pagesPromises.push(getEconomicAccountPage(login, account, i))
          }
          return Promise.all(pagesPromises)
            .then(function(pagesSolved) {
              var endResult = result.collection
              for (var i = 0; i < pagesSolved.length; i++) {
                endResult = endResult.concat(pagesSolved[i].collection)
              }
              resolve(endResult)
            })
        }
        resolve(result)
      })
  })

}

/* Data manipulation */
// function sumWeeks(entries) {
//   var weekSum = Utility.weekZerosArray() // array with 15 spaces
//   for (var i = 0; i < entries.length; i++) { // entries.lenght is all entries on that account
//     var date = Utility.parseDate(entries[i].date) //the date of the entry eg. Fri Jan 01 2016 Timestamp+Timezone
//     var yearWeek = Utility.getWeekNumber(Utility.parseDate(entries[i].date)) // array with year and week no
//     if (yearWeek[0] == new Date().getFullYear() && date < new Date() )  {
//       // hvis entry er samme år som nuværende år og tidligere end idag
//       weekSum[yearWeek[1]-1] -= entries[i].amountInBaseCurrency
//       /*console.log(entries[i].amountInBaseCurrency)*/
//     }
//   }
//   console.log(weekSum)
//   return weekSum
// }
function sumDays(entries) {
  var daySum = new Array(31).fill(0)
  var actualYTD = 0;
  for (var i = 0; i < entries.length; i++) {
    var date = Utility.parseDate(entries[i].date)
    actualYTD -= entries[i].amountInBaseCurrency
    if (+startDate <= +date && +date <= +todaysDate)  {
      var utc1 = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      var utc2 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      var diff = Math.floor((utc2 - utc1)/_MS_PER_DAY)
      daySum[diff] -= entries[i].amountInBaseCurrency
    }
  }
  // console.log("actualYTD", actualYTD)
  return {"daySum": daySum, "actualYTD": actualYTD}
}

// function accWeek(data) { // 1 Array of arrays of entries
//   var accWeekSum = Utility.weekZerosArray() //15
//   for (var i = 0; i < data.length; i++) { // data length = 5 arrays
//     var s = sumWeeks(data[i]) // Forwarding the 1st array of entries
//     for (var j = 0; j < s.length; j++) {
//       accWeekSum[j] += Math.round(s[j])
//     }
//   }
//   return accWeekSum
// }
// Returns an array for each day the last month and actual sales
function accDay(data) { // 1 Array of arrays of entries
  var accDaySum = new Array(31).fill(0)
  var ytd = 0;
  for (var i = 0; i < data.length; i++) { // for each array (5 in total)
    var s = sumDays(data[i]) // daySum = array of the days with sale per day
    ytd += Math.round(s.actualYTD)
    for (var j = 0; j < s.daySum.length; j++) {
      accDaySum[j] += Math.round(s.daySum[j])
    }
  }
  return {"accDaySum": accDaySum, "ytd": ytd}
}

// function accYTD(weekSum) {
//   var accYTD = Utility.weekZerosArray()
//   var sum = 0
//   for (var i = 0; i < weekSum.length; i++) {
//     sum += weekSum[i]
//     accYTD[i] += sum
//   }
//   return accYTD
// }

function accPeriod(daySum) {
  var accPeriod = new Array(31).fill(0)
  var sum = 0
  for (var i = 0; i < daySum.accDaySum.length; i++) {
    sum += daySum.accDaySum[i]
    accPeriod[i] += sum
  }
  return accPeriod
}

class Utility {
  static weekZerosArray() {
      var currentWeek = Utility.getWeekNumber(new Date())[1]
      return new Array(currentWeek).fill(0)
    }
    // parse a date in yyyy-mm-dd format
  static parseDate(input) {
    var parts = input.split('-');
    // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(parts[0], parts[1] - 1, parts[2]); // Note: months are 0-based
  }

  static getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(+d);
    d.setHours(0, 0, 0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    // Get first day of year
    var yearStart = new Date(d.getFullYear(), 0, 1);
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    // Return array of year and week number
    return [d.getFullYear(), weekNo];
  }
}

// Budget on a monthly basic: 151.025 monthly
// excluding June (5), July(6), August(7) and December(11) with 76.625 a month
function budget(date) {
  var month = date.getMonth()
  var daysInMonth = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate()
  var dayBudget
  if (month == 5 || month == 6 || month == 7 || month == 12) {
    dayBudget = Math.round(76625/daysInMonth)
  } else {
    dayBudget = Math.round(151025/daysInMonth)
  }
  return dayBudget
}

function budgetYTD(date) {
  var budgetM = 0
  var month = date.getMonth()
  var daysInMonth = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate()
  var dayBudget = 0
  var day = date.getDate()

  if (month == 5 || month == 6 || month == 7 || month == 12) {
    dayBudget = 76625/daysInMonth
  } else {
    dayBudget = 151025/daysInMonth
  }
  var extra = dayBudget * day;
  for (var i = 0; i < month; i++) {
    if (month == 5 || month == 6 || month == 7 || month == 12) {
      budgetM +=76625
    } else {
      budgetM += 151025
    }
  }
  var budgetYTD = Math.round(budgetM + extra)
  return budgetYTD;
}

/* Plotting */
function chartOptions(data) {
  var daySum = data.daySum.accDaySum
  var accSum = data.accSum
  var options = chart
  var budgetDays = []
  var accBudget = []
  var actualYTD = data.daySum.ytd /// PRINT SOMEWHERE!!!
  // var budgetYTD = budgetYTD()
  // var indexYTD = Math.round(100 + ((actualYTD-budgetYTD)/budgetYTD)*100)

  // for (var i = 0; i < weekSum.length; i++) {
  //   weekNumbers[i] = i + 1
  //   budget[i] = 37756
  //   accBudget[i] = 37756*(i+1)
  // }
  var dates = []
  var sum = 0
  for (var i = 0; i < data.daySum.accDaySum.length; i++) {
    var date = new Date(new Date().setDate(new Date().getDate()-30+i))
    dates[i] = date.toDateString().slice(0,10)
    budgetDays[i] = budget(date)
    // Math.round(151024/31)
    sum += budgetDays[i]
    accBudget[i] = sum
    // Math.round((151024/31)*(i+1))
  }
  options.xAxis[0].categories = dates
  options.series[0].data = daySum
  options.series[1].data = budgetDays
  options.series[2].data = accSum
  options.series[3].data = accBudget

  return options
}

function renderer (data) {
  var actualYTD = data.daySum.ytd /// PRINT SOMEWHERE!!!
  // var budgetYTD = budgetYTD()
  // var indexYTD = Math.round(100 + ((actualYTD-budgetYTD)/budgetYTD)*100)
  varfunction(chart) {
    chart.renderer.text("test", 140 , 100)
    .add()
  })
}

  return
}

var chart = {
  chart: {
    zoomType: 'xy',
    renderTo: 'container1'
  },
  title: {
    text: 'Sales',
    style: {fontFamily: 'Roboto Black Italic', fontWeight: 'bold'}
  },
  // subtitle: { text: 'Source: e-conomic.dk' },
  xAxis: [{
    labels: { style: { color: '#000000' } },
    title: {
      style: {color: '#000000'}
     },
    categories: [],
    crosshair: true
  }],
  yAxis: [{ // Primary yAxis
      floor: 0,
      labels: { style: { color: '#000000' } },
      title: {
        text: 'Amount (DKK)',
        style: { color: '#000000' },
        offset: 0,
        rotation: 0,
        align: "high",
        y: -10,
      }
    }
  ],
  tooltip: { shared: true },
  legend: {
    layout: 'horizontal',
    align: 'center',
    verticalAlign: 'bottom',
    floating: false,
    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
  },
  series: [
    {
      name: 'Actual sale',
      type: 'column',
      data: [],
      tooltip: { valueSuffix: ' DKK' }
    }, {
      name: 'Budget',
      type: 'column',
      data: [],
      tooltip: { valueSuffix: ' DKK' }
    }, {
      name: 'Acc. sale',
      type: 'spline',
      // yAxis: 1,
      data: [],
      tooltip: { valueSuffix: ' DKK' }
    }, {
      name: 'Acc. budget',
      type: 'spline',
      // yAxis: 1,
      data: [],
      tooltip: { valueSuffix: ' DKK' }
    }
  ],
}

module.exports = {
  getData: getData,
  chartOptions: chartOptions
}
