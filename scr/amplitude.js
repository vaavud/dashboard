var $ = require('jquery')
var Highcharts = require('highcharts')

/*
Retrieve Amplitude data
*/
function getData(login){
  var todayOj = new Date()
  var todaysDate = todayOj.toISOString().slice(0,10).replace(/-/g, "")
  console.log(todaysDate)

  getAmplitudeLogin(login, "users?m=active&start=20160104&end=" + todaysDate + "&i=7")
  .then(result => {
    console.log(result)
    var test = keyData(result)
    console.log(test)
  })
  // var measurementsTotal = getAmplitudeLogin(login, "events?e=Measure::Began&start=20160101&end=20160327")
  // .then(result => {
  //   console.log(result)
  // })
  // Promise.all([activeUsers, measurementsTotal])
  //   .then(data => {
  //
  //   })
}


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
        type: "GET"
      })
      // .always( resolve ); // resolve is a function that takes one parameter (and passes on this value)
      .always(function(result) {
        resolve(result)
      })
  })
}

function keyData(data) {
  var length = data[0].length
  var users = new Array(length)
  for (var i = 0; i < data[0].length; i++) {
    var users = data[0][i]
  }
  console.log(users)
  return users
}

function chartOptions(data) {
  var weekSum = data.week

  var options = chart

  var weekNumbers = []
  for (var i = 0; i < weekSum.length; i++) {
    weekNumbers[i] = i + 1
  }

  options.xAxis[0].categories = weekNumbers
  options.series[0].data = weekSum

  return options
}

var chart = {
  chart: { zoomType: 'xy' },
  title: { text: 'Active users 2016' },
  subtitle: { text: 'Source: amplitude' },
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
    name: 'Invoiced sale',
    type: 'column',
    data: [],
    tooltip: {
      valueSuffix: ' DKK'
    }
  }]
}

module.exports = {
  getData: getData
  // chartOptions: chartOptions
}
