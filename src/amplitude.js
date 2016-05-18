var $ = require('jquery')
var Highcharts = require('highcharts')
var Mixpanel = require('./mixpanel.js')
var U = require('./utility.js')


/*
Retrieve Amplitude data
*/
function getData(iOSlogin, androidLogin, plot){
  var todaysDate = new Date().toISOString().slice(0,10).replace(/-/g, "")
  var startDate = new Date(new Date().setDate(new Date().getDate()-27)).toISOString().slice(0,10).replace(/-/g, "")
  var lastMonthStart = new Date(new Date().setDate(new Date().getDate()-(27*2+1))).toISOString().slice(0,10).replace(/-/g, "")
  var lastMonthEnd = new Date(new Date().setDate(new Date().getDate()-28)).toISOString().slice(0,10).replace(/-/g, "")

// measurements - Defined as Measure::Ended and Measurement::Ended event in Amplitude
// activeUsers - Defined as unique App::Open event in Amplitude
// downloads - Defined as New users in Amplitude
// notifications - Defined as Notifications::added event in Amplitude

  var urlpath = {
    ios: {
      measurements: 'events?e=Measure::Ended',
      activeUsers: 'events?e=App::Open',
      downloads: 'users?m=new',
      notifications: 'events?e=Notifications::added',
    },
    android: {
      measurements: 'events?e=Measurement::Ended',
      activeUsers: 'events?e=App::Open',
      downloads: 'users?m=new',
      notifications: 'events?e=Notifications::Added',
    }
  }
    var iOS = getAmplitudeLogin(iOSlogin, urlpath.ios[plot] + "&start=" + startDate + "&end=" + todaysDate + "&i=1")
    var android = getAmplitudeLogin(androidLogin, urlpath.android[plot] + "&start=" + startDate + "&end=" + todaysDate + "&i=1")

    var iOSLM = getAmplitudeLogin(iOSlogin, urlpath.ios[plot] + "&start=" + lastMonthStart + "&end=" + lastMonthEnd + "&i=1")
    var androidLM = getAmplitudeLogin(androidLogin, urlpath.android[plot] + "&start=" + lastMonthStart + "&end=" + lastMonthEnd + "&i=1")

  return Promise.all([iOS, android, iOSLM, androidLM])
  .then(data => {
    return {"combined": combinedData(data.slice(0,2)), "combinedLM": combinedData(data.slice(2,4))}
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
  var combined = new Array(U.const.DISPLAY_DAYS).fill(0)
  for (var i = 0; i < data.length; i++) {
    var s = data[i]["data"]["series"][0]
    for (var j = 0; j < s.length; j++) {
      combined[j] += s[j]
    }
  }
  return combined
}

/*************************/
/*   ADD MIXPANEL DATA   */
/*************************/
function joinMixpanelAndAmplitude(data) {
  var combined = new Array(U.const.DISPLAY_DAYS).fill(0)
  var combinedLM = new Array(U.const.DISPLAY_DAYS).fill(0)
  var lastYear = data[0].mixpanelLastYear
  var array = new Array(4);
  array[0] = data[0].mixpanelCMLM.combined;
  array[1] = data[1].combined;
  array[2] = data[0].mixpanelCMLM.combinedLM;
  array[3] = data[1].combinedLM;
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
  // console.log(data)
  // var options = chart
  var options = chart

  if (title == "Downloads" || title == "Notifications added") {
    options = chart1;
  }

  if (data.lastYear != null){
    options.series[2].data = data.lastYear
  }

  var dates = []
  for (var i = 0; i < U.const.DISPLAY_DAYS; i++) {
    var xDaysAgo = new Date(new Date().setDate(new Date().getDate()-27+i))
    dates[i] = xDaysAgo.toDateString().slice(0,10)
  }

  options.title.text = title
  options.series[0].data = data.combined
  options.series[1].data = data.combinedLM
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
    name: 'This month',
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
    name: 'This month',
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
  joinMixpanelAndAmplitude: joinMixpanelAndAmplitude,
}
