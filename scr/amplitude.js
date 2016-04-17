var $ = require('jquery')
var Highcharts = require('highcharts')
var displayDays = 28;
/*
Retrieve Amplitude data
*/
function getData(iOSlogin, androidLogin, plot){
  var todayOj = new Date()
  var todaysDate = todayOj.toISOString().slice(0,10).replace(/-/g, "")
  var fourWeeksAgo = new Date(new Date().setDate(new Date().getDate()-27))
  var startDate = fourWeeksAgo.toISOString().slice(0,10).replace(/-/g, "")
  var lastMonth = new Date(new Date().setDate(new Date().getDate()-(27*2+1)))
  var lastMonthStart = lastMonth.toISOString().slice(0,10).replace(/-/g, "")
  var lastMonthE = new Date(new Date().setDate(new Date().getDate()-28))
  var lastMonthEnd = lastMonthE.toISOString().slice(0,10).replace(/-/g, "")

  console.log("today " + todaysDate)
  console.log("startDate " + startDate)
  console.log("lastMonthStart: " + lastMonthStart)
  console.log("lastMonthEnd: " + lastMonthEnd)

  // Measurements - Defined as Measure::Began event in Amplitude
  if (plot == "Measurements") {
    var iOS = getAmplitudeLogin(iOSlogin, "events?e=Measure::Began&start=" + startDate + "&end=" + todaysDate + "&i=1")
    var android = getAmplitudeLogin(androidLogin, "events?e=Measurement::Began&start=" + startDate + "&end=" + todaysDate + "&i=1")

    var iOSLM = getAmplitudeLogin(iOSlogin, "events?e=Measure::Began&start=" + lastMonthStart + "&end=" + lastMonthEnd + "&i=1")
    var androidLM = getAmplitudeLogin(androidLogin, "events?e=Measurement::Began&start=" + lastMonthStart + "&end=" + lastMonthEnd + "&i=1")

  }
  // Active Users - Defined as unique App::Open event in Amplitude
  if (plot == "ActiveUsers") {
    var iOS = getAmplitudeLogin(iOSlogin, "events?e=App::Open&start=" + startDate + "&end=" + todaysDate + "&i=1&m=uniques")
    var android = getAmplitudeLogin(androidLogin, "events?e=App::Open&start=" + startDate + "&end=" + todaysDate + "&i=1&m=uniques")

    var iOSLM = getAmplitudeLogin(iOSlogin, "events?e=App::Open&start=" + lastMonthStart + "&end=" + lastMonthEnd + "&i=1&m=uniques")
    var androidLM = getAmplitudeLogin(androidLogin, "events?e=App::Open&start=" + lastMonthStart + "&end=" + lastMonthEnd + "&i=1&m=uniques")
  }
  // Downloads - Defined as New users in Amplitude
  if (plot == "Downloads") {
    var iOS = getAmplitudeLogin(iOSlogin, "users?m=new&start=" + startDate + "&end=" + todaysDate + "&i=1")
    var android = getAmplitudeLogin(androidLogin, "users?m=new&start=" + startDate + "&end=" + todaysDate + "&i=1")

    var iOSLM = getAmplitudeLogin(iOSlogin, "users?m=new&start=" + lastMonthStart + "&end=" + lastMonthEnd + "&i=1")
    var androidLM = getAmplitudeLogin(androidLogin, "users?m=new&start=" + lastMonthStart + "&end=" + lastMonthEnd + "&i=1")
  }
  // Notifications - Defined as Notifications::added event in Amplitude
  if (plot == "Notifications added") {
    var iOS = getAmplitudeLogin(iOSlogin, "events?e=Notifications::added&start=" + startDate + "&end=" + todaysDate + "&i=1")
    var android = getAmplitudeLogin(androidLogin, "events?e=Notifications::Added&start=" + startDate + "&end=" + todaysDate + "&i=1")

    var iOSLM = getAmplitudeLogin(iOSlogin, "events?e=Notifications::added&start=" + lastMonthStart + "&end=" + lastMonthEnd + "&i=1")
    var androidLM = getAmplitudeLogin(androidLogin, "events?e=Notifications::Added&start=" + lastMonthStart + "&end=" + lastMonthEnd + "&i=1")
  }

  return Promise.all([iOS, android, iOSLM, androidLM])
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

function combinedData(data) { // 1 Array of arrays of data
  var combined = new Array(displayDays).fill(0)
  var combinedLM = new Array(displayDays).fill(0)
  for (var i = 0; i < 2; i++) {
    var s = data[i]["data"]["series"][0]
    var t = data[i+2]["data"]["series"][0]
    for (var j = 0; j < s.length; j++) {
      combined[j] += s[j]
      combinedLM[j] += t[j]
    }
  }
  return {"combined": combined, "combinedLM": combinedLM}
}

function chartOptions(data, title) {
  var options = chart

  var dates = []
  for (var i = 0; i < displayDays; i++) {
    var xDaysAgo = new Date(new Date().setDate(new Date().getDate()-27+i))
    dates[i] = xDaysAgo.toDateString().slice(0,10)
  }

  options.title.text = title
  options.xAxis[0].categories = dates
  options.series[0].data = data.userData.combined
  options.series[1].data = data.userData.combinedLM
  return options
}

var chart = {
  chart: { zoomType: 'xy' },
  title: { text: '' },
  subtitle: { text: 'Source: amplitude.com' },
  xAxis: [{
    title: { text: "Date" },
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
      valueSuffix: ' users'
    }
  }, {
    name: 'Last month',
    type: 'column',
    data: [],
    tooltip: {
      valueSuffix: ' users'
    }
  }]
}

module.exports = {
  getData: getData,
  chartOptions: chartOptions
}
