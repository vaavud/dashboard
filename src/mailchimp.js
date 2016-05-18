var $ = require('jquery')
var Highcharts = require('highcharts')
var U = require('./utility.js')

/*
Retrieve Mailchimp data - included the 10 newest campaigns
*/
function getData(login){
  return new Promise((resolve,reject) => {
    // getMailchimpLogin(login, "campaigns?offset=0&count=1000")
    // A lot easier if sorting worked!
    getMailchimpLogin(login, "campaigns?offset=0&count=1000")
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
  var sentTo = new Array(U.const.DISPLAY_CAMPAIGNS).fill(0)
  var title = new Array(U.const.DISPLAY_CAMPAIGNS).fill(0)
  var openRate = new Array(U.const.DISPLAY_CAMPAIGNS).fill(0)
  var clickRate = new Array(U.const.DISPLAY_CAMPAIGNS).fill(0)
  //var maxOpenRate = maxOpen(data)
  var length = data["campaigns"].length
  var arrayFull = 0
  var id
  for (var i = 0; arrayFull < 10; i++) {
    var j = length-1-i
    // Exclude BoD material id = 5a0bd8131f & small campaigns email_sent < 20
    if (data["campaigns"][j]["status"] == "sent" && data["campaigns"][j]["recipients"]["list_id"] != "5a0bd8131f" && data["campaigns"][j]["emails_sent"] > 20) {
      sentTo[arrayFull] = data["campaigns"][j]["emails_sent"]
      title[arrayFull] = data["campaigns"][j]["settings"]["title"]
      id = data["campaigns"][j]["id"]
      // console.log(id)
      openRate[arrayFull] = parseFloat(data["campaigns"][j]["report_summary"]["open_rate"]).toFixed(2)*100
      clickRate[arrayFull] = parseFloat(data["campaigns"][j]["report_summary"]["click_rate"]).toFixed(2)*100
      arrayFull++
    }
  }
    // console.log(openRate)
  return {"sentTo": sentTo, "title": title, "openRate": openRate, "clickRate": clickRate}
}

// Need some way to exclude BoD material
function maxOpen(data){
  var max = 0
  var maxOpenTitle
  var id
  for (var i = 0; i < data["campaigns"].length; i++) {
    if (max < data["campaigns"][i]["report_summary"]["open_rate"]) {
      max = data["campaigns"][i]["report_summary"]["open_rate"]
      maxOpenTitle = data["campaigns"][i]["settings"]["title"]
      id = data["campaigns"][i]["id"]
    }
  }
  // console.log("title: " + maxOpenTitle + ", id:" + id)
  return {"max": max, "maxOpenTitle": maxOpenTitle}
}

/* Plotting */
function chartOptions(data) {
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
  // subtitle: { text: 'Source: mailchimp.com' },
  xAxis: [{
    useHTML: true,
    width: '1px',
    labels: {
      style: {
        color: '#000000'
        }
      },
    categories: [],
    title: {
      // text: 'campaigns',
      style: {color: '#000000'}
     },
    crosshair: true
  }],
  yAxis: [{ // Primary yAxis
      tickPositions: [0, 10000, 20000, 30000, 40000],
      labels: {
        style: { color: '#000000' }
      },
      title: {
        text: 'Subscribers',
        style: { color: '#000000' }
      }
    }, { // Secondary yAxis
        tickPositions: [0, 25, 50, 75, 100],
        labels: {
          format: '{value}%',
          style: { color: '#000000' } },
        title: {
          text: 'Open - & click rate',
          style: { color: '#000000' }
        },
        opposite: true
      }],
  tooltip: { shared: true },
  legend: {
    layout: 'horizontal',
    align: 'center',
    // x: 140,
    verticalAlign: 'bottom',
    // y: 100,
    floating: false,
    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
  },
  series: [{
    name: 'Subscribers',
    type: 'column',
    data: [],
    // tooltip: {
    //   valueSuffix: ' emails'
    // }
  }, {
    name: 'Open rate',
    type: 'spline',
    yAxis: 1,
    data: [],
    tooltip: { valueSuffix: '%' }
  }, {
    name: 'Click rate',
    type: 'spline',
    yAxis: 1,
    data: [],
    tooltip: { valueSuffix: '%' }
  }]
}

module.exports = {
  getData: getData,
  chartOptions: chartOptions
}
