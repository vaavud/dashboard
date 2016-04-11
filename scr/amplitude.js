var $ = require('jquery')
var Highcharts = require('highcharts')

/*
Retrieve Amplitude data
*/
function getData(login){
  var todayOj = new Date()
  var todaysDate = todayOj.toISOString().slice(0,10).replace(/-/g, "")
  console.log(todaysDate)

  // var aUsers = getAmplitudeLogin(login, "users?m=active&start=20160104&end=" + todaysDate + "&i=7")
  // // var measurementsTotal = getAmplitudeLogin(login, "events?e=Measure::Began&start=20160104&end=" + todaysDate + "&i=7")
  //
  // return Promise.all(aUsers, measurementsTotal)
  // .then(data => {
  //   var activeUsers = data["data"]["series"][0]
  //   var measurements = data

  getAmplitudeLogin(login, "users?m=active&start=20160104&end=" + todaysDate + "&i=7")
  .then(data => {
    var activeUsers = data["data"]["series"][0]
    console.log(activeUsers)

    return activeUsers
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
        type: "GET",
        dataType: "json",
      })
      // .always( resolve ); // resolve is a function that takes one parameter (and passes on this value)
      .always(function(result) {
        resolve(result)
      })
  })
}

// function keyData(data) {
//   var users = new Array(data.length)
//   for (var i = 0; i < data.length; i++) {
//     users[i] = data[i]
//   }
//   console.log(users)
//   return users
// }

function chartOptions(data) {
  var activeUsers = data.activeUsers
  var options = chart
  var weekNumbers = []
  for (var i = 0; i < data.length; i++) {
    weekNumbers[i] = i + 1
  }

  options.xAxis[0].categories = weekNumbers
  options.series[0].data = activeUsers
  return options
}

var chart = {
  chart: { zoomType: 'xy' },
  title: { text: 'Active users 2016' },
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
    name: 'Active users',
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
