/*
Retrive e-conomic data
*/
function getEconomicData(login){
  var p1021 = getEconomicAccount(login, 1021)
  var p1022 = getEconomicAccount(login, 1022)
  var p1023 = getEconomicAccount(login, 1023)
  var p1032 = getEconomicAccount(login, 1032)
  var p1033 = getEconomicAccount(login, 1033)


  Promise.all([p1021, p1022, p1023, p1032, p1033])
    .then(data => {

      var weekSum = EconomicChart.accWeek(data)
      var accSum = EconomicChart.accYTD(weekSum)

      EconomicChart.plot(weekSum, accSum)
    })
}

function getEconomicAccountPage(login, account, page) {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: `https://restapi.e-conomic.com/ACCOUNTS/${account}/ACCOUNTING-YEARS/2016/entries?skippages=${page}&pagesize=1000`,
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



class EconomicChart {
  static plot(weekSum, accSum) {

    var options = highchartsOptions()

    var weekNumbers = []
    for (var i = 0; i < weekSum.length; i++) {
      weekNumbers[i] = i + 1
    }

    options.xAxis[0].categories = weekNumbers

    options.series[0].data = weekSum

    options.series[2].data = accSum


    new Highcharts.Chart('container', options)
      // $("#output").text(JSON.stringify(weekSum, null, 4));

  }

  static sumWeeks(entries) {
    var weekSum = Utility.weekZerosArray()
    for (var i = 0; i < entries.length; i++) {
      var yearWeek = Utility.getWeekNumber(Utility.parseDate(entries[i].date))
      if (yearWeek[0] == new Date().getFullYear()) {
        weekSum[yearWeek[1]] -= entries[i].amountInBaseCurrency
        /*console.log(entries[i].amountInBaseCurrency)*/
      }
    }
    return weekSum
  }

  static accWeek(data) { // 1 Array of arrays of entries
    var accWeekSum = Utility.weekZerosArray()
    for (var i = 0; i < data.length; i++) {
      var s = EconomicChart.sumWeeks(data[i])
      for (var j = 0; j < s.length; j++) {
        accWeekSum[j] += Math.round(s[j])
      }
    }
    return accWeekSum
  }

  static accYTD(weekSum) {
    var accYTD = Utility.weekZerosArray()
    var sum = 0
    for (var i = 0; i < weekSum.length; i++) {
      sum += weekSum[i]
      accYTD[i] += sum

    }
    return accYTD
  }

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

function highchartsOptions() {
  var options = {
    chart: {
      zoomType: 'xy'
    },
    title: {
      text: 'Sales 2016'
    },
    subtitle: {
      text: 'Source: e-conomic.dk'
    },
    xAxis: [{
      title: {
        text: "Week no."
      },
      categories: [],
      crosshair: true
    }],
    yAxis: [{ // Primary yAxis
        labels: {
          // format: '{value} DKK',
          style: {
            color: Highcharts.getOptions().colors[1]
          }
        },
        title: {
          text: 'Amount (DKK)',
          style: {
            color: Highcharts.getOptions().colors[1]
          }
        }
      }
      // , { // Secondary yAxis
      //     title: {
      //         text: 'Rainfall',
      //         style: {
      //             color: Highcharts.getOptions().colors[0]
      //         }
      //     },
      //     labels: {
      //         format: '{value} mm',
      //         style: {
      //             color: Highcharts.getOptions().colors[0]
      //         }
      //     },
      //     opposite: true
      // }
    ],
    tooltip: {
      shared: true
    },
    legend: {
      layout: 'vertical',
      align: 'left',
      x: 120,
      verticalAlign: 'top',
      y: 100,
      floating: true,
      backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
    },
    series: [{
      name: 'Invoiced sale',
      type: 'column',
      data: [],
      tooltip: {
        valueSuffix: ' DKK'
      }
    }, {
      name: 'Budget',
      type: 'column',
      data: [37756, 37756, 37756, 37756, 37756, 37756, 37756, 37756, 37756],
      tooltip: {
        valueSuffix: ' DKK'
      }
    }, {
      name: 'Acc. sale',
      type: 'spline',
      // yAxis: 1,
      data: [],
      tooltip: {
        valueSuffix: ' DKK'
      }
    }, {
      name: 'Acc, budget',
      type: 'spline',
      // yAxis: 1,
      data: [37756, 37756 * 2, 37756 * 3, 37756 * 4, 37756 * 5, 37756 * 6, 37756 * 7, 37756 * 8, 37756 * 9],
      tooltip: {
        valueSuffix: ' DKK'
      }
    }]
  }
  return options
}
