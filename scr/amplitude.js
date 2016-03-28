/*
Retrieve Amplitude data
*/
function getAmplitudeData(login){
  getAmplitudeLogin(login, "users?m=active&start=20160101&end=20160327&i=1&g=country")
  .then(result => {
    console.log(result)
  })
  var measurementsTotal = getAmplitudeLogin(login, "events?e=Measure::Began&start=20160101&end=20160327")
  .then(result => {
    console.log(result)
  })

  // Promise.all([activeUsers, measurementsTotal])
  //   .then(data => {
  //
  //   })
}

function getAmplitudeLogin(login, parameter) {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: `https://amplitude.com/api/2/${parameter}`,
        dataType: "json",
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
