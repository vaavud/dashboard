var $ = require('jquery')

/*
Retrieve Mailchimp data
*/
function getData(login){

  getMailchimpLogin(login, "reports/f5270671d1")
  .then(result => {
    console.log(result)
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
        type: "GET"
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
