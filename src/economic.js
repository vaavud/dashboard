var $ = require('jquery')
var Highcharts = require('highcharts')
var U = require('./utility.js')

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
    // var test = budgetYTD()
    return {"daySum": daySum, "accSum": accSum}
  })
}


function getEconomicAccountPage(login, account, page) {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: `https://restapi.e-conomic.com/ACCOUNTS/${account}/ACCOUNTING-YEARS/`+ U.currentYear() + `/entries?skippages=${page}&pagesize=1000`,
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

function sumDays(entries) {
  var daySum = new Array(U.currentDayInMonth()).fill(0)
  var actualYTD = 0;
  for (var i = 0; i < entries.length; i++) {
    var date = U.parseDate(entries[i].date)
    actualYTD -= entries[i].amountInBaseCurrency
    if (+U.currentStartDay() <= +date && +date <= +new Date())  {
      var utc1 = Date.UTC(U.currentStartDay().getFullYear(), U.currentStartDay().getMonth(), U.currentStartDay().getDate())
      var utc2 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      var diff = Math.floor((utc2 - utc1)/U.const.MS_PER_DAY)
      daySum[diff] -= entries[i].amountInBaseCurrency
    }
  }
  // console.log("actualYTD", actualYTD)
  return {"daySum": daySum, "actualYTD": actualYTD}
}

// Returns an array for each day the last month and actual sales
function accDay(data) { // 1 Array of arrays of entries
  var accDaySum = new Array(U.currentDayInMonth()).fill(0)
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

function accPeriod(daySum) {
  var accPeriod = new Array(U.currentDayInMonth()).fill(0)
  var sum = 0
  for (var i = 0; i < daySum.accDaySum.length; i++) {
    sum += daySum.accDaySum[i]
    accPeriod[i] += sum
  }
  return accPeriod
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

function budgetYTD() {
  var budgetM = 0
  var month = new Date().getMonth()
  var daysInMonth = U.daysInMonth(new Date())
  var dayBudget = 0
  var day = new Date().getDate()

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
  var budget_test = budgetYTD()
  var dates = []
  var sum = 0
  for (var i = 0; i < data.daySum.accDaySum.length; i++) {
    var date = new Date(new Date().setDate(new Date().getDate()-(U.currentDayInMonth()-1)+i))
    dates[i] = date.toDateString().slice(3,10)
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
  var actualYTD = data.daySum.ytd
  var budget = budgetYTD()
  // var budget_ytd = budgetYTD()
  var indexYTD = Math.round((((actualYTD-budget)/budget)*100)+100);
  var ytdText = function(chart) {
    chart.renderer.text("Actual YTD: " + Math.round((actualYTD/1000)) + "k DKK", 100 , 60)
    // Thusand seperator
    // .toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    .css({
      // color: '#7a868c',
      fontSize: '13px',
      // fontFamily: 'Open Sans Bold',
      // fontWeight: 'Bold'
    })
    .add()
    chart.renderer.text("Budget YTD: " + Math.round((budget/1000)) + "k DKK", 100 , 75)
    .css({
      // color: '#7a868c',
      fontSize: '13px'
    })
    .add()
    chart.renderer.text("Index: " + indexYTD, 100 , 95)
    .css({
      // color: '#7a868c',
      fontSize: '13px'
    })
    .add()
  }
  return ytdText
}

var chart = {
  chart: {
    zoomType: 'xy',
    renderTo: 'container1'
  },
  title: {
    text: 'Sales - current month',
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
      labels: { style: { color: '#000000', fontSize: '12px' } },
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
  chartOptions: chartOptions,
  renderer: renderer,
  budgetYTD: budgetYTD,
}
