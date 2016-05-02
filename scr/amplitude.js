var $ = require('jquery')
var Highcharts = require('highcharts')
var Mixpanel = require('./mixpanel.js')

var displayDays = 28;
var todayOj = new Date()
var _MS_PER_DAY = 1000*60*60*24
/*
Retrieve Amplitude data
*/
function getData(iOSlogin, androidLogin, plot){
  var todaysDate = todayOj.toISOString().slice(0,10).replace(/-/g, "")
  var startDate = new Date(new Date().setDate(new Date().getDate()-27)).toISOString().slice(0,10).replace(/-/g, "")
  var lastMonthStart = new Date(new Date().setDate(new Date().getDate()-(27*2+1))).toISOString().slice(0,10).replace(/-/g, "")
  var lastMonthEnd = new Date(new Date().setDate(new Date().getDate()-28)).toISOString().slice(0,10).replace(/-/g, "")


  // Measurements - Defined as Measure::Ended and Measurement::Ended event in Amplitude
  if (plot == "Measurements") {
    var iOS = getAmplitudeLogin(iOSlogin, "events?e=Measure::Ended&start=" + startDate + "&end=" + todaysDate + "&i=1")
    var android = getAmplitudeLogin(androidLogin, "events?e=Measurement::Ended&start=" + startDate + "&end=" + todaysDate + "&i=1")

    var iOSLM = getAmplitudeLogin(iOSlogin, "events?e=Measure::Ended&start=" + lastMonthStart + "&end=" + lastMonthEnd + "&i=1")
    var androidLM = getAmplitudeLogin(androidLogin, "events?e=Measurement::Ended&start=" + lastMonthStart + "&end=" + lastMonthEnd + "&i=1")
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
    var amplitudeCMLM = combinedData(data)
    return {"amplitudeCMLM": amplitudeCMLM}
  })
}

function getAmplitudeLogin(login, parameter) {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: `https://api.vaavud.com/dashboard/amplitude/${parameter}`,
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

/*************************/
/*   ADD MIXPANEL DATA   */
/*************************/
function combineAll(data) {
  var combined = new Array(displayDays).fill(0)
  var combinedLM = new Array(displayDays).fill(0)
  var lastYear = data[0].mixpanelLastYear
  var array = new Array(4);
  array[0] = data[0].mixpanelCMLM.combined;
  array[1] = data[1].amplitudeCMLM.combined;
  array[2] = data[0].mixpanelCMLM.combinedLM;
  array[3] = data[1].amplitudeCMLM.combinedLM;
  for (var i = 0; i < 2; i++) {
    var s = array[i]
    var t = array[i+2]
    for (var j = 0; j < s.length; j++) {
      combined[j] += s[j]
      combinedLM[j] += t[j]
    }
  }
  return {"combined": combined, "combinedLM": combinedLM, "lastYear": lastYear}
}


function chartOptions(data, title) {
  console.log(data)
  var options = chart

  if (title == "Downloads" || title == "Notifications added") {
    options = chart1;
  }

  if (data.amplitudeCMLM.lastYear != null){
    options.series[2].data = data.amplitudeCMLM.lastYear
  }

  var dates = []
  for (var i = 0; i < displayDays; i++) {
    var xDaysAgo = new Date(new Date().setDate(new Date().getDate()-27+i))
    dates[i] = xDaysAgo.toDateString().slice(0,10)
  }

  options.title.text = title
  options.series[0].data = data.amplitudeCMLM.combined
  options.series[1].data = data.amplitudeCMLM.combinedLM
  options.xAxis[0].categories = dates

  return options
}

var chart = {
  chart: { zoomType: 'xy' },
  title: { text: '' },
  // subtitle: { text: 'Source: amplitude.com' },
  xAxis: [{
    labels: {
      style: {color: '#000000'}
    },
    categories: [],
    crosshair: true
  }],
  yAxis: [{ // Primary yAxis
      labels: { style: { color: '#000000' } },
      title: {
        text: 'Amount (no)',
        style: { color: '#000000' }
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
  series: [{
    name: 'Actual',
    type: 'spline',
    data: [],
    // tooltip: {
    //   valueSuffix: ' users'
    // }
  }, {
    name: 'Last month',
    type: 'spline',
    data: [],
    // tooltip: {
    //   valueSuffix: ' users'
    // }
  }, {
    name: 'Last year',
    type: 'spline',
    data: [],
    color: '#7a868c',
    // tooltip: {
    //   valueSuffix: ' users'
    // }
  }]
}

var chart1 = {
  chart: { zoomType: 'xy' },
  title: { text: '' },
  // subtitle: { text: 'Source: amplitude.com' },
  xAxis: [{
    labels: {
      style: {color: '#000000'}
    },
    categories: [],
    crosshair: true
  }],
  yAxis: [{ // Primary yAxis
      labels: { style: { color: '#000000' } },
      title: {
        text: 'Amount (no)',
        style: { color: '#000000' }
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
  series: [{
    name: 'Actual',
    type: 'spline',
    data: [],
    // tooltip: {
    //   valueSuffix: ' users'
    // }
  }, {
    name: 'Last month',
    type: 'spline',
    data: [],
    // tooltip: {
    //   valueSuffix: ' users'
    // }
  }]
}


module.exports = {
  getData: getData,
  chartOptions: chartOptions,
  combineAll: combineAll,
}
