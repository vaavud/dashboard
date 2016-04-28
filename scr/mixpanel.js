var $ = require('jquery')
var displayDays = 28;
var todayOj = new Date()
var _MS_PER_DAY = 1000*60*60*24
/*
Retrieve Mixpanel data
*/
function getData(login, title){
  var todaysDate = todayOj.toISOString().slice(0,10).replace(/-/g, "")
  var fourWeeksAgo = new Date(new Date().setDate(new Date().getDate()-27))
  var startDate = fourWeeksAgo.toISOString().slice(0,10).replace(/-/g, "")
  var endDate = new Date(new Date().setDate(new Date().getDate()-(27*2+1)))


  // Measurements - Defined as Start Measurement in Mixpanel
  if (title == "Measurements") {
    var measurements = getMixpanelLogin(login, "type=total&event=Start Measurement&unit=day&from_date=" + startDate + "&to_date=" + endDate)
  }
  // Active Users - Defined as unique Open App in Mixpanel
  if (title == "ActiveUsers") {
    var activeUsers = getMixpanelLogin(login, "type=unique&event=Open App&unit=day&from_date=" + startDate + "&to_date=" + endDate)
  }

  return Promise.all([measurements, activeUsers])
  .then(data => {
    var MixuserData = combinedData(data)
    return {"MixUserData": MixUserData}
  })
}

function getMixpanelLogin(login, parameter) {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: `https://api.vaavud.com/dashboard/mixpanel/api/2.0/segmentation/${parameter}`,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          "APISecret": login.APISecret
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

// We switched to Amplitude in November 2015, so data prior
// from Mixpanel is saved in Firebase with data from
// April 7th 2014 until 31st of December 2015
// All old data is stored in arrays
// [268] = 31.12.2014
// Only to be used through all of 2016
function getLastYear(data){
  // Match day of the week
  var START_2015 = 268
  var DAYS_IN_YEAR = 365
  var weekDay = new Date(new Date().setDate(new Date().getDate()-DAYS_IN_YEAR)).getDay()
  console.log("weekDay2015: " + weekDay)
  console.log("dayOfWeek2016: " + todayOj.getDay())
  var diff = weekDay - todayOj.getDay()
  // Week days goes from 0 to 6
  if (Math.abs(diff) > 3) {
    var actualDiff = 7 - Math.abs(diff)
    if (diff < -3){
    var dateLY = new Date(new Date().setDate(new Date().getDate()-DAYS_IN_YEAR-actualDiff))
    console.log("diff < -3, new date: " + dateLY)
  } else if (diff > 3) {
    var dateLY = new Date(new Date().setDate(new Date().getDate()-DAYS_IN_YEAR+actualDiff))
    console.log("diff > 3, new date: " + dateLY)
    }
  } else {
  var dateLY = new Date(new Date().setDate(new Date().getDate()-DAYS_IN_YEAR-diff))
  // console.log("new date: " + dateLY)
}
  // Months goes from 0-11 - 01.01.2015 = 2015,00,01
  var array = Math.round(Math.abs((dateLY.getTime()-new Date(2015,00,01).getTime())/(_MS_PER_DAY)))+START_2015
  // var endDate = data[array]
  // console.log("endDate " + endDate + ", " + array)
  // var startDate = data[array-27]
  // console.log("startDate " + startDate + ", " + (array-27))
  var newArray = data.slice((array-27),array+1)
  var sum = 0
  for (var i = 0; i < newArray.length; i++) {
    sum += newArray[i]
  }
  // console.log(newArray)
  return newArray
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


module.exports = {
  getData: getData,
}
