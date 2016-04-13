var $ = require('jquery')
var Highcharts = require('highcharts')

/*
Retrieve Amplitude data
*/
function getData(iOSlogin, androidLogin, plot){
  var todayOj = new Date()
  var todaysDate = todayOj.toISOString().slice(0,10).replace(/-/g, "")
  console.log(todaysDate)

// Active Users - Defined as App::Open event in Amplitude
if (plot == "ActiveUsers") {
  var iOS = getAmplitudeLogin(iOSlogin, "events?e=App::Open&start=20160104&end=" + todaysDate + "&i=7")
  var android = getAmplitudeLogin(androidLogin, "events?e=App::Open&start=20160104&end=" + todaysDate + "&i=7")
}
// Downloads - Defined as New users in Amplitude
if (plot == "Downloads") {
  var iOS = getAmplitudeLogin(iOSlogin, "users?m=new&start=20160104&end=" + todaysDate + "&i=7")
  var android = getAmplitudeLogin(androidLogin, "users?m=new&start=20160104&end=" + todaysDate + "&i=7")
}
// Measurements - Defined as Measure::Began event in Amplitude
if (plot == "Measurements") {
  var iOS = getAmplitudeLogin(iOSlogin, "events?e=Measure::Began&start=20160104&end=" + todaysDate + "&i=7")
  var android = getAmplitudeLogin(androidLogin, "events?e=Measure::Began&start=20160104&end=" + todaysDate + "&i=7")
}

  return Promise.all([iOS, android])
  .then(data => {
    var userData = combinedData(data)
    return {"userData": userData}
  })

}
    // var aUsers = getAmplitudeLogin(login, "users?m=active&start=20160104&end=" + todaysDate + "&i=7")
    // // var measurementsTotal = getAmplitudeLogin(login, "events?e=Measure::Began&start=20160104&end=" + todaysDate + "&i=7")
    //
    // return Promise.all(aUsers, measurementsTotal)
    // .then(data => {
    //   var activeUsers = data["data"]["series"][0]
    //   var measurements = data
// return new Promise((resolve,reject) => {
//     getAmplitudeLogin(login, "users?m=active&start=20160104&end=" + todaysDate + "&i=7").then(data => {
//       var activeUsers = data["data"]["series"][0]
//       // console.log('ActiveUsers',activeUsers)
//       resolve(activeUsers)
//     })
//   })
  // var measurementsTotal = getAmplitudeLogin(login, "events?e=Measure::Began&start=20160101&end=20160327")
  // .then(result => {
  //   console.log(result)
  // })
  // Promise.all([activeUsers, measurementsTotal])
  //   .then(data => {
  //
  //   })

function getAmplitudeLogin(login, parameter) {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: `https://api.vaavud.com/dashboard/amplitude/api/2/${parameter}`,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          "Authorization": "Basic " + btoa(login.APIKey + ":" + login.SecretKey)
        },
        type: "GET",
        dataType: "json",
      })
      // .always( resolve ); // resolve is a function that takes one parameter (and passes on this value)
      .always(function(result) {
        resolve(result)
      })
  })
}

function combinedData(data) { // 1 Array of arrays of entries
  var combined = Utility.weekZerosArray()
  for (var i = 0; i < data.length; i++) {
    var s = data[i]["data"]["series"][0]
    for (var j = 0; j < s.length; j++) {
      combined[j] += s[j]
    }
  }
  return combined
}

class Utility {
  static weekZerosArray() {
      var currentWeek = Utility.getWeekNumber(new Date())[1]
      return new Array(currentWeek).fill(0)
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

function chartOptions(data, title) {
  var options = chart

  var weekNumbers = []
  for (var i = 0; i < data.length; i++) {
    weekNumbers[i] = i + 1
  }
  options.title.text = title
  options.xAxis[0].categories = weekNumbers
  options.series[0].data = data.userData
  return options
}

var chart = {
  chart: { zoomType: 'xy' },
  title: { text: '' },
  subtitle: { text: 'Source: amplitude.com' },
  xAxis: [{
    title: { text: "Week no." },
    categories: [],
    crosshair: true
  }],
  yAxis: [{ // Primary yAxis
      labels: { style: { color: Highcharts.getOptions().colors[1] } },
      title: {
        text: 'Amount (no)',
        style: { color: Highcharts.getOptions().colors[1] }
      }
    }
  ],
  tooltip: { shared: true },
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
    name: 'Actual',
    type: 'column',
    data: [],
    tooltip: {
      valueSuffix: ' DKK'
    }
  }]
}

module.exports = {
  getData: getData,
  chartOptions: chartOptions
}
