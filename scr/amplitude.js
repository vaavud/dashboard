var $ = require('jquery')

/*
Retrieve Amplitude data
*/
function getData(login){

  getAmplitudeLogin(login, "users?m=active&start=20160101&end=20160301&i=1")
  .then(result => {
    console.log(result)
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

//         url: `https://localhost:8083/amplitude/api/2/${parameter}`,

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



// function getAmplitudeLogin(login, parameter) {
//   return new Promise((resolve, reject) => {
//     $.ajax({
//         url: `https://localhost:8083/amplitude/api/2/${parameter}`,
//         xhrFields: {
//           withCredentials: true
//         },
//         headers: {
//           "Authorization": "Basic " + btoa(login.APIKey + ":" + login.SecretKey)
//         },
//         type: "GET"
//       })
//       // .always( resolve ); // resolve is a function that takes one parameter (and passes on this value)
//       .always(function(result) {
//         resolve(result)
//       })
//   })
// }


//
// function getAmplitudeLogin(login, parameter) {
//   return new Promise((resolve, reject) => {
//     $.ajax({
//         url: `https://api.vaavud.com/dashboard/amplitude/api/2/${parameter}&apiKey=${login.APIKey}&secretKey=${login.SecretKey}`,
//         type: "GET"
//       })
//       // .always( resolve ); // resolve is a function that takes one parameter (and passes on this value)
//       .always(function(result) {
//         resolve(result)
//       })
//   })
// }

module.exports = {
  getData: getData
}
