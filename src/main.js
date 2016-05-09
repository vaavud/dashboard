"use strict"
var $ = require('jquery')
var Firebase = require('firebase')
var Highcharts = require('highcharts')

var Economic = require('./economic.js')
var Amplitude = require('./amplitude.js')
var Mailchimp = require('./mailchimp.js')
var Mixpanel = require('./mixpanel.js')

/* Vaavud colors */
// Red - Blue
new Highcharts.setOptions({
  chart: {
    style: {fontFamily: 'Open Sans Bold', fontWeight: 'Bold'}
  },
  colors: ['#d12a2f', '#00a1e1'],
})
// Light grey: '7a868c'
// Dark grey: '303e48'
// Style: 'Open Sans Bold', 'Open Sans Regular', 'Open Sans Light'
// Style: 'Roboto Black Italic'

/*
Login to firebase
*/
var ref = new Firebase('https://shining-torch-4752.firebaseio.com/');
$(document).ready(function() {
        var email = getQueryVariable('email');
        var password = getQueryVariable('password');

        // else login manual
        // if (email == false || password == false){
        //   $('#password').keypress(function(e) {
        //       if (e.keyCode == 13) {
        $('#submit').click(function() {
                var email = $('#email').val();
                var password = $('#password').val();

                ref.authWithPassword({
                  email: email,
                  password: password
                }, authHandler);

              })

        ref.authWithPassword({
          email: email,
          password: password
        }, authHandler);
});


// Read login credentials from URL
function getQueryVariable(variable) {
    var query = window.location.search.substring(1)
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair[0] == variable) {
        return pair[1];
      }
   }
   return (false);
 }


function authHandler(error, authData) {
  if (error) {
    console.log("Login Failed!", error);
    // alert("Login failed - please try again")
  } else {
    document.getElementById('login').style.visibility = 'hidden';
    console.log("Authenticated successfully with payload:", authData);

    get3PartyDetails()

    // Reload every 15 min (given in miliseconds)
    // setInterval(get3PartyDetails, 15*1000*60)
  }
}

/*
Retrive login credentials from firebase to 3rd Party Services
*/
function get3PartyDetails() {
  ref.child('/').once("value", function(snap) {
    console.log(`data loaded! ${Object.keys(snap.val()).length}`);

    // E-conomic data
    var economicData = Economic.getData(snap.val()["E-conomic"]);
    economicData.then(data => {
      var data1 = Economic.chartOptions(data)
      var ytdText = Economic.renderer(data)
      new Highcharts.chart('container1', data1, ytdText)
    })

    // Amplitude data
    getMeasurements()
    getActiveUsers()

    var downloads = Amplitude.getData(snap.val()["Amplitude-iOS"], snap.val()["Amplitude-Android"], "Downloads");
    downloads.then(data => {
      var data4 = Amplitude.chartOptions(data, "Downloads")
      new Highcharts.chart('container4', data4)
    })
    var notifications = Amplitude.getData(snap.val()["Amplitude-iOS"], snap.val()["Amplitude-Android"], "Notifications added");
    notifications.then(data => {
      var data5 = Amplitude.chartOptions(data, "Notifications added")
      new Highcharts.chart('container5', data5)
    })
    //
    //   // Mailchimp data
    var mailchimp = Mailchimp.getData(snap.val()["Mailchimp"]);
    mailchimp.then(data => {
      var data6 = Mailchimp.chartOptions(data)
      new Highcharts.chart('container6', data6)
    })

    // var mixpanel = Mixpanel.getData(snap.val()["Mixpanel"], "Measurements");
    // console.log(mixpanel)
      // something get other data here
  })
}

function getMeasurements() {
  ref.child('/').once("value", function(snap) {
    var mixActiveUsers = Mixpanel.getData(snap.val()["Mixpanel"], "ActiveUsers");
    var activeUsers = Amplitude.getData(snap.val()["Amplitude-iOS"], snap.val()["Amplitude-Android"], "ActiveUsers");
    return Promise.all([mixActiveUsers, activeUsers])
      .then (data => {
        var amplitudeCMLM = Amplitude.combineAll(data);
        return {"amplitudeCMLM": amplitudeCMLM}
      }).then(data => {
          var data2 = Amplitude.chartOptions(data, "Active users")
          new Highcharts.chart('container2', data2)
        })
    })
}

function getActiveUsers() {
  ref.child('/').once("value", function(snap) {
    var mixMeasurements = Mixpanel.getData(snap.val()["Mixpanel"], "Measurements");
    var measurements = Amplitude.getData(snap.val()["Amplitude-iOS"], snap.val()["Amplitude-Android"], "Measurements");
    return Promise.all([mixMeasurements, measurements])
      .then(data => {
        var amplitudeCMLM = Amplitude.combineAll(data);
        return {"amplitudeCMLM": amplitudeCMLM}
      }).then(data => {
          var data3 = Amplitude.chartOptions(data, "Measurements")
          new Highcharts.chart('container3', data3)
        })
    })
}
