"use strict"
var $ = require('jquery')
var Firebase = require('firebase')
var Highcharts = require('highcharts')

var Economic = require('./economic.js')
var Amplitude = require('./amplitude.js')
var Mailchimp = require('./mailchimp.js')
var Mixpanel = require('./mixpanel.js')

require("babel-polyfill")

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

  // ref.authWithPassword({
  //   email: email,
  //   password: password
  // }, authHandler);

  ref.authWithPassword({
    email: 'maria@vaavud.com',
    password: '1234'
  }, authHandler);
});

/*
Handle the authentication response
*/
function authHandler(error, authData) {
  if (error) {
    console.log("Login Failed!", error);
    // alert("Login failed - please try again")
  } else {
    document.getElementById('login').style.visibility = 'hidden';
    console.log("Authenticated successfully with payload:", authData);

    retriveCredentials()
  }
}

/*
retriveCredentials
*/
function retriveCredentials() {
  ref.child('/').once("value", function(snap) {
    var credentials = snap.val()
    loadAndDisplayExternalData(credentials)

    // Reload every 15 min (given in miliseconds)
    setInterval(function(){ loadAndDisplayExternalData(credentials) }, 15*1000*60)
  })
}

/*
Retrive external data and display it.
*/
function loadAndDisplayExternalData(credentials) {
    sales(credentials)
    activeUsers(credentials)
    downloads(credentials)
    measurements(credentials)
    notifications(credentials)
    mailCampaign(credentials)
}

// E-conomic data
function sales(credentials) {
  Economic.getData(credentials["E-conomic"])
    .then(data => {
      var chartOptions = Economic.chartOptions(data)
      var ytdText = Economic.renderer(data)
      new Highcharts.chart('container1', chartOptions, ytdText)
    })
}

// Active users from Amplitude and compared to last year data from Mixpanel
function activeUsers(credentials) {
  var mixActiveUsers = Mixpanel.getData(credentials["Mixpanel"], "activeUsers");
  var activeUsers = Amplitude.getData(credentials["Amplitude-iOS"], credentials["Amplitude-Android"], "activeUsers");
  Promise.all([mixActiveUsers, activeUsers])
    .then(data => {
      console.log("test1" + data)
      return Amplitude.joinMixpanelAndAmplitude(data)

    })
    .then(data => {
      console.log("test2" + data)
      var chartOptions = Amplitude.chartOptions(data, "Active users")
      new Highcharts.chart('container2', chartOptions)
    })
}

// Notifications added from Amplitude
function notifications(credentials) {
  Amplitude.getData(credentials["Amplitude-iOS"], credentials["Amplitude-Android"], "notifications")
  .then(data => {
    var chartOptions = Amplitude.chartOptions(data, "Notifications added")
    new Highcharts.chart('container5', chartOptions)
  })
}

// Measurements from Amplitude nd compared to last year data from Mixpanel
function measurements(credentials) {
  var mixMeasurements = Mixpanel.getData(credentials["Mixpanel"], "measurements");
  var measurements = Amplitude.getData(credentials["Amplitude-iOS"], credentials["Amplitude-Android"], "measurements");
  Promise.all([mixMeasurements, measurements])
    .then(data => {
      return Amplitude.joinMixpanelAndAmplitude(data)
    })
    .then(data => {
      var chartOptions = Amplitude.chartOptions(data, "Measurements")
      new Highcharts.chart('container3', chartOptions)
    })
}

// Downloads from Apmplitude
function downloads(credentials) {
  Amplitude.getData(credentials["Amplitude-iOS"], credentials["Amplitude-Android"], "downloads")
  .then(data => {
    var chartOptions = Amplitude.chartOptions(data, "Downloads")
    new Highcharts.chart('container4', chartOptions)
  })
}

// mail campagin reports from Mailchimp
function mailCampaign(credentials) {
  Mailchimp.getData(credentials["Mailchimp"])
  .then(data => {
    var chartOptions = Mailchimp.chartOptions(data)
    new Highcharts.chart('container6', chartOptions)
  })
}


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

/* Vaavud colors */
// Red - Blue
new Highcharts.setOptions({
    chart: {
      style: {
        fontFamily: 'Open Sans Bold',
        fontWeight: 'Bold'
      }
    },
    colors: ['#d12a2f', '#00a1e1'],
  })
  // Light grey: '7a868c'
  // Dark grey: '303e48'
  // Style: 'Open Sans Bold', 'Open Sans Regular', 'Open Sans Light'
  // Style: 'Roboto Black Italic'
