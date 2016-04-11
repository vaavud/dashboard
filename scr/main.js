"use strict"
var $ = require('jquery')
var Firebase = require('firebase')
var Highcharts = require('highcharts')

var Economic = require('./economic.js')
var Amplitude = require('./amplitude.js')
var Mailchimp = require('./mailchimp.js')

/* Vaavud colors */
new Highcharts.setOptions({
  colors: ['#cb2c30', '#00a3e0']
})

/*
Login to firebase
*/

var ref = new Firebase('https://shining-torch-4752.firebaseio.com/');
$(document).ready(function() {
  ref.authWithPassword({
    email: "maria@vaavud.com",
    password: "1234"
  }, authHandler);
})

$('#password').keypress(function(e) {
  if (e.keyCode == 13) {
    var email = $('#email').val();
    var password = $('#password').val();

    ref.authWithPassword({
      email: email,
      password: password
    }, authHandler);

    $('#password').val('');
  }
});

function authHandler(error, authData) {
  if (error) {
    console.log("Login Failed!", error);
  } else {
    console.log("Authenticated successfully with payload:", authData);

    get3PartyDetails()
  }
}

/*
Retrive login credentials from firebase to 3Party Services
*/

function get3PartyDetails() {
  ref.child('/').once("value", function(snap) {
    console.log(`data loaded! ${Object.keys(snap.val()).length}`);
    var economicData = Economic.getData(snap.val()["E-conomic"]);
    economicData.then(data => {
      var data1 = Economic.chartOptions(data)

      new Highcharts.chart('container1', data1)
      // new Highcharts.chart('container3', data1)
      // new Highcharts.chart('container4', data1)
      // new Highcharts.chart('container5', data1)
      // new Highcharts.chart('container6', data1)
    })

    // Amplitude data
    var iOSData = Amplitude.getData(snap.val()["Amplitude-iOS"]);
    iOSData.then(data => {
    // console.log(iOSData) // UNDEFINED????
      var data2 = Amplitude.chartOptions(iOSData)
      new Highcharts.chart('container2', data2)
        //var androidData = Amplitude.getData(snap.val()["Amplitude-Android"]);
    });
      // Mailchimp data
    var mailchimp = Mailchimp.getData(snap.val()["Mailchimp"]);
      // something get other data here

  })
}
