var $ = require('jquery')
var Highcharts = require('highcharts')

/*
Retrieve Mailchimp data - included the 10 newest reports
*/
function getData(login){
  return new Promise((resolve,reject) => {
    getMailchimpLogin(login, "reports?offset=0&count=1000")
    .then(function(data) {
      var stats = report(data)
    resolve(stats)
    })
  })
}


function getMailchimpLogin(login, parameter) {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: `https://api.vaavud.com/dashboard/mailchimp/${parameter}`,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          "Authorization": "Basic " + btoa("anystring" + ":" + login.APIKey)
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

function report(data){
  var sentTo = new Array(10).fill(0)
  var title = new Array(10).fill(0)
  var openRate = new Array(10).fill(0)
  var clickRate = new Array(10).fill(0)
  for (var i = 0; i < 10; i++) {
    sentTo[i] = data["reports"][i]["emails_sent"]
    title[i] = data["reports"][i]["campaign_title"]
    openRate[i] = parseFloat(data["reports"][i]["opens"]["open_rate"]).toFixed(2)*100
    clickRate[i] = parseFloat(data["reports"][i]["clicks"]["click_rate"]).toFixed(2)*100
  }
return {"sentTo": sentTo, "title": title, "openRate": openRate, "clickRate": clickRate}
}

/* Plotting */
function chartOptions(data) {
  console.log(data)
  var sentTo = data.sentTo
  var campaignTitle = data.title
  var openRate = data.openRate
  var clickRate = data.clickRate
  var options = chart

  options.xAxis[0].categories = campaignTitle
  options.series[0].data = sentTo
  options.series[1].data = openRate
  options.series[2].data = clickRate
  return options
}

var chart = {
  chart: { type: 'bar' },
  title: { text: 'Mailchimp campaigns' },
  subtitle: { text: 'Source: mailchimp.com' },
  xAxis: [{
    categories: [],
    title: {
      text: {text: null},
      style: {color: '#000000'}
     },
    crosshair: true
  }],
  yAxis: [{ // Primary yAxis
      labels: { style: { color: '#000000' } },
      title: {
        text: 'Sent to',
        style: { color: '#000000' }
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
    name: 'Sent to',
    type: 'column',
    data: [],
    tooltip: {
      valueSuffix: ' emails'
    }
  }, {
    name: 'Open rate',
    type: 'spline',
    // yAxis: 1,
    data: [],
    tooltip: { valueSuffix: ' %' }
  }, {
    name: 'Click rate',
    type: 'spline',
    // yAxis: 1,
    data: [],
    tooltip: { valueSuffix: ' %' }
  }]
}

module.exports = {
  getData: getData,
  chartOptions: chartOptions
}
