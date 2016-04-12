var $ = require('jquery')

/*
Retrieve Mailchimp data
*/
function getData(login){
  return new Promise((resolve,reject) => {
    getMailchimpLogin(login, "reports/f5270671d1")
    .then(data => {

      var title = data["campaign_title"]
      console.log(title)
      var emailsSent = data["emails_sent"]
      console.log(emailsSent)
      var openRate = parseFloat(data["opens"]["open_rate"]).toFixed(2)*100 + " %";
      console.log(openRate)
      var clickRate = parseFloat(data["clicks"]["click_rate"]).toFixed(2)*100 + " %";
      console.log(clickRate)
    })
    resolve()
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


module.exports = {
  getData: getData
}
