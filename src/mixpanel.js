'use strict'

var $ = require('jquery')
var displayDays = 28;
var todayOj = new Date()
/*
Retrieve Mixpanel data
*/
function getData(login, plot){
  var todaysDate = todayOj.toISOString().slice(0,10)
  var startDate = new Date(new Date().setDate(new Date().getDate()-27)).toISOString().slice(0,10)
  var lastMonthStart = new Date(new Date().setDate(new Date().getDate()-(27*2+1))).toISOString().slice(0,10)
  var lastMonthEnd = new Date(new Date().setDate(new Date().getDate()-28)).toISOString().slice(0,10)
  var lastYearStart = new Date(new Date().setDate(new Date().getDate()-(7*56-1))).toISOString().slice(0,10)
  var lastYearEnd = new Date(new Date().setDate(new Date().getDate()-(7*52))).toISOString().slice(0,10)

  // Measurements - Defined as Stop Measurement for lastYear and Stop Measurement & Measurement::Ended for currentMonth and lastMonth
  if (plot == "measurements") {
    var currentMonth1 = getMixpanelLogin(login, "event=Stop Measurement&unit=day&from_date=" + startDate + "&to_date=" + todaysDate)
    var m1 = "Stop Measurement"

    var currentMonth2 = getMixpanelLogin(login, "event=Measurement::Ended&unit=day&from_date=" + startDate + "&to_date=" + todaysDate)
    var m2 = "Measurement::Ended"

    var lastMonth1 = getMixpanelLogin(login, "event=Stop Measurement&unit=day&from_date=" + lastMonthStart + "&to_date=" + lastMonthEnd)
    var lastMonth2 = getMixpanelLogin(login, "event=Measurement::Ended&unit=day&from_date=" + lastMonthStart + "&to_date=" + lastMonthEnd)

    // var lastYear = getMixpanelLogin(login, "event=Stop Measurement&unit=day&from_date=" + lastYearStart + "&to_date=" + lastYearEnd)
  }

  // Active Users - Defined as unique Open App for lastYear and Open App & App::Open for currentMonth and lastMonth
  // App::Open is duplicates
  if (plot == "activeUsers") {
    var currentMonth1 = getMixpanelLogin(login, "type=unique&event=Open App&unit=day&from_date=" + startDate + "&to_date=" + todaysDate)
    var m1 = "Open App"
    var currentMonth2 = getMixpanelLogin(login, "type=unique&event=App::Open&unit=day&from_date=" + startDate + "&to_date=" + todaysDate)
    var m2 = "App::Open"

    var lastMonth1 = getMixpanelLogin(login, "type=unique&event=Open App&unit=day&from_date=" + lastMonthStart + "&to_date=" + lastMonthEnd)
    var lastMonth2 = getMixpanelLogin(login, "type=unique&event=App::Open&unit=day&from_date=" + lastMonthStart + "&to_date=" + lastMonthEnd)

    // var lastYear = getMixpanelLogin(login, "type=unique&event=Open App&unit=day&from_date=" + lastYearStart + "&to_date=" + lastYearEnd)
  }

  // return Promise.all([currentMonth1, currentMonth2, lastMonth1, lastMonth2, lastYear, m1, m2])
  return Promise.all([currentMonth1, currentMonth2, lastMonth1, lastMonth2, m1, m2])
  .then(data => {
    var combine = new Array(4)

    var cM1S = sortValues(data[0]["data"]["values"][m1])
    combine[0] = cM1S
    var cM2S = sortValues(data[1]["data"]["values"][m2])
    combine[1] = cM2S
    var lM1S = sortValues(data[2]["data"]["values"][m1])
    combine[2] = lM1S
    var lM2S = sortValues(data[3]["data"]["values"][m2])
    combine[3] = lM2S

    // var mixpanelLastYear = sortValues(data[4]["data"]["values"][m1])
    var mixpanelCMLM = combinedData(combine)
    return {"mixpanelCMLM": mixpanelCMLM}
    // return {"mixpanelCMLM": mixpanelCMLM, "mixpanelLastYear": mixpanelLastYear}
  })
}

function getMixpanelLogin(login, parameter) {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: `https://api.vaavud.com/dashboard/mixpanel/segmentation/?${parameter}`,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          "Authorization": "Basic " + btoa(login.APISecret + ":" + '')
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

function sortValues(data){
  var arrayN = new Array(displayDays).fill(0)
  var count = 0
  for (let key in data) {
    arrayN[count] = new Array(1).fill(0)
    arrayN[count][0] = new Date(key)
    arrayN[count][1] = data[key]
    // console.log("test["+ key +"]=" + test[key])
    count++
  }
  // Sort array by date
  arrayN.sort(function(a, b) {
    if (a[0] === b[0]) {
      return 0;
    } else {
      return (a[0] < b[0]) ? -1 : 1
    }
  })

  // Return array only containing values
  var arrayV = new Array(displayDays).fill(0)
  for (var i = 0; i < arrayN.length; i++) {
    arrayV[i] = arrayN[i][1]
  }
  return arrayV
}

function combinedData(data) { // 1 Array of arrays of data
  var combined = new Array(displayDays).fill(0)
  var combinedLM = new Array(displayDays).fill(0)
  for (var i = 0; i < 2; i++) {
    var s = data[i]
    var t = data[i+2]
    for (var j = 0; j < s.length; j++) {
      combined[j] += s[j]
      combinedLM[j] += t[j]
    }
  }
  return {"combined": combined, "combinedLM": combinedLM}
}


module.exports = {
  getData: getData,
}
