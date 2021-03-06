var express = require('express');
var app = express();
var http = require('http');
var info = require('./var.js');
var request = require('request');
var slack = require('express-slack');
var parser = require('xml2json');
const bodyParser = require('body-parser');
const curl = new (require( 'curl-request' ))();


var air_channel = 'G6XGMATUP'; //#responding
var dispatch_channel = 'GAG3D0EBF'; //#dispatch
var rpialert_channel = 'C6WT63HM3';

// var air_channel = 'C71B0PRDW'; //#development_scratch
// var rpialert_channel = 'C71B0PRDW'; //#development_scratch


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use('/slack', slack({
  scope: info.scope,
  token: info.token,
  store: 'data.json',
  client_id: info.client_id,
  client_secret: info.client_secret
}));

app.post('/whoson', function(req, res) {
  var done = false;
  if (req.body.text === "" || req.body.text.toLowerCase() === "today") {
    request("https://rpiambulance.com/slack-whoson.php?token=" + info.slash_command_token, function(error, response, body) {
      res.status(200).send(body);
    });
  } else if (req.body.text.toLowerCase() === "week") {
    request("https://rpiambulance.com/slack-whoson.php?token=" + info.slash_command_token + "&week=1", function(error, response, body) {
      res.status(200).send(body);
    });
  } else {
    var d = new Date();
    var o = new Date();

    switch (req.body.text.toLowerCase()) {
      case "yest":
      case "yesterday":
      o.setDate(d.getDate() - 1);
      var date = makeWhosonDate(o) + "&yesterday=1";
      break;

      case "tom":
      case "tomorrow":
      o.setDate(d.getDate() + 1);
      var date = makeWhosonDate(o) + "&tomorrow=1";
      break;

      case "sun":
      case "sunday":
      o.setDate(d.getDate() + (7 - d.getDay()));
      var date = makeWhosonDate(o);
      break;

      case "mon":
      case "monday":
      if (d.getDay() < 1) {
        o.setDate(d.getDate() + (1 - d.getDay()));
      } else {
        o.setDate(d.getDate() + (7 - (d.getDay() - 1)));
      }
      var date = makeWhosonDate(o);
      break;

      case "tues":
      case "tuesday":
      if (d.getDay() < 2) {
        o.setDate(d.getDate() + (2 - d.getDay()));
      } else {
        o.setDate(d.getDate() + (7 - (d.getDay() - 2)));
      }
      var date = makeWhosonDate(o);
      break;

      case "wed":
      case "wednesday":
      if (d.getDay() < 3) {
        o.setDate(d.getDate() + (3 - d.getDay()));
      } else {
        o.setDate(d.getDate() + (7 - (d.getDay() - 3)));
      }
      var date = makeWhosonDate(o);
      break;

      case "thurs":
      case "thursday":
      if (d.getDay() < 4) {
        o.setDate(d.getDate() + (4 - d.getDay()));
      } else {
        o.setDate(d.getDate() + (7 - (d.getDay() - 4)));
      }
      var date = makeWhosonDate(o);
      break;

      case "fri":
      case "friday":
      if (d.getDay() < 5) {
        o.setDate(d.getDate() + (5 - d.getDay()));
      } else {
        o.setDate(d.getDate() + (7 - (d.getDay() - 5)));
      }
      var date = makeWhosonDate(o);
      break;

      case "sat":
      case "saturday":
      o.setDate(d.getDate() + (6 - d.getDay()));
      var date = makeWhosonDate(o);
      break;

      default:
      res.status(200).send("Please enter a valid day parameter and try again.");
      done = true;
    }

    if (!done) {
      request("https://rpiambulance.com/slack-whoson.php?token=" + info.slash_command_token + "&date=" + date, function(error, response, body) {
        res.status(200).send(body);
      });
    }
  }
});

function makeWhosonDate(date) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  month = (month < 10) ? "0" + month : month;
  var day = date.getDate();
  day = (day < 10) ? "0" + day : day;
  return year + "-" + month + "-" + day;
}

function compareTime(hr, min, direction) {

  var now = new Date();
  nowhr = now.getHours();
  nowmin = now.getMinutes();

  if (direction == "lt") {
    return (nowhr < hr) || ((nowhr == hr) && (nowmin < min));
  } else if (direction == "gt") {
    return (nowhr > hr) || ((nowhr == hr) && (nowmin > min));
  }

}

function makeDate() {
  var now = new Date();
  return [
    now.getFullYear(),
    '-',
    now.getMonth() + 1 < 10 ? "0" + (now.getMonth() + 1) : (now.getMonth() + 1),
    '-',
    now.getDate() < 10 ? "0" + (now.getDate()) : (now.getDate()),
    ' at ',
    now.getHours() < 10 ? "0" + (now.getHours()) : (now.getHours()),
    ':',
    now.getMinutes() < 10 ? "0" + (now.getMinutes()) : (now.getMinutes()),
    ':',
    now.getSeconds() < 10 ? "0" + (now.getSeconds()) : (now.getSeconds())
  ].join('');
}

app.post('/tmd_slack_notification', function(req, res) {

  if (req.body.verification == info.verification_email) {

    var air_message = "";
    var dispatch_message = "";

    if (compareTime(05, 55, "gt") && compareTime(18, 05, "lt")) {
      air_message = {
        unfurl_links: true,
        channel: air_channel,
        token: info.token,
        "attachments": [
          {
            "text": "RPI Ambulance dispatched on " + makeDate(),
            "fallback": req.body.dispatch,
            "callback_id": "responding",
            "color": "#F35A00",
            "attachment_type": "default",
            "fields": [
              {
                "title": req.body.dispatch,
                "value": "Are you responding?",
                "short": true
              }
            ],
            "actions": [
              {
                "name": "status",
                "text": "Yes",
                "style": "danger",
                "type": "button",
                "value": "yes"
              },
              {
                "name": "status",
                "text": "No",
                "type": "button",
                "value": "no"
              }
            ]
          }
        ]
      };
      dispatch_message =  {
        unfurl_links: false,
        channel: dispatch_channel,
        token: info.token,
        "text": "RPI Ambulance dispatched on " + makeDate(),
        "fallback": req.body.dispatch,
        "attachments": [
          {
            "title": req.body.dispatch,
            "short": true
          }
        ]
      };
    } else {
      air_message = {
        unfurl_links: true,
        channel: air_channel,
        token: info.token,
        "attachments": [
          {
            "text": "RPI Ambulance dispatched on " + makeDate(),
            "fallback": req.body.dispatch,
            "callback_id": "responding",
            "color": "#F35A00",
            "attachment_type": "default",
            "fields": [
              {
                "title": req.body.dispatch,
                "value": "Night crew call. No response is needed.",
                "short": true
              }
            ]
          }
        ]
      };
      dispatch_message =  {
        unfurl_links: false,
        channel: dispatch_channel,
        token: info.token,
        "text": "RPI Ambulance dispatched on " + makeDate(),
        "fallback": req.body.dispatch,
        "attachments": [
          {
            "text": "RPI Ambulance dispatched on " + makeDate(),
            "fallback": req.body.dispatch,
            "callback_id": "responding",
            "color": "#F35A00",
            "attachment_type": "default",
            "fields": [
              {
                "title": req.body.dispatch,
                "value": "Night crew call. No response is needed.",
                "short": true
              }
            ]
          }
        ]
      };
    }
    slack.send('chat.postMessage', air_message);
    slack.send('chat.postMessage', dispatch_message);
    res.status(200).send(req.body.dispatch);
  } else {
    res.status(401).send();
  }
});

app.post('/tmd_slack_notification_long', function(req, res) {

  if (req.body.verification == info.verification_email) {

    var air_message = {
      unfurl_links: true,
      channel: air_channel,
      token: info.token,
      "attachments": [
        {
          "text": "Rensslaer County longtone on " + makeDate(),
          "fallback": req.body.dispatch,
          "callback_id": "responding",
          "color": "#F35A00",
          "attachment_type": "default",
          "fields": [
            {
              "title": req.body.dispatch,
              "value": "",
              "short": true
            }
          ]
        }
      ]
    };
    var dispatch_message = {
      unfurl_links: true,
      channel: dispatch_channel,
      token: info.token,
      "attachments": [
        {
          "text": "Rensslaer County longtone on " + makeDate(),
          "fallback": req.body.dispatch,
          "callback_id": "responding",
          "color": "#F35A00",
          "attachment_type": "default",
          "fields": [
            {
              "title": req.body.dispatch,
              "value": "",
              "short": true
            }
          ]
        }
      ]
    };
    slack.send('chat.postMessage', air_message);
    slack.send('chat.postMessage', dispatch_message);
    res.status(200).send(req.body.dispatch);
  } else {
    res.status(401).send();
  }
});

app.post("/slack_response", function(req, res) {
  var strReq = req.body.payload.toString();
  var strReq = JSON.parse(strReq);

  var maxElapsedTime = 12; //minutes to allow responses
  maxElapsedTime *= 60 * 1000;

  var messageTime = new Date(strReq.message_ts * 1000);
  var actionTime = new Date(strReq.action_ts * 1000);

  userID = strReq.user.id;

  if ((actionTime - messageTime) < maxElapsedTime) {

    request.post({url:'https://slack.com/api/users.info', form: {token:info.token,user:userID}}, function(error, response, body){
      var userinfo = response.body.toString();
      var userinfo = JSON.parse(userinfo);

      abbrname = userinfo.user.profile.first_name.charAt(0).toUpperCase() + ". " + userinfo.user.profile.last_name;
      var response_message = "";
      if (strReq.actions[0].value == "yes") {
        console.log(abbrname + " replied yes");
        response_message = {
          unfurl_links: true,
          channel: air_channel,
          token: info.token,
          "mrkdwn": true,
          "attachments": [
            {
              "fallback": abbrname + " is RESPONDING",
              "text": "*" + abbrname + "*" + " is *RESPONDING*",
              "color": "#7CD197",
              "mrkdwn_in": ["text"]
            }
          ]
        };
      } else {
        console.log(abbrname + " replied no");
        response_message = {
          unfurl_links: true,
          channel: air_channel,
          token: info.token,
          "mrkdwn": true,
          "attachments": [
            {
              "fallback": abbrname + " is not responding",
              "text": abbrname + " is NOT RESPONDING"
            }
          ]
        };
      }
      res.status(200).send();
      slack.send('chat.postMessage', response_message);
    });

  } else {
    var response_message = {
      channel: air_channel,
      token: info.token,
      user: userID,
      as_user: true,
      text: "Sorry, your response was logged too long after the dispatch went out."
    };
    res.status(200).send();
    slack.send('chat.postEphemeral', response_message);
  }

});

app.listen(5939, function () {
  console.log('Server up');
});

//app.use(express.static('.'));

text = "";
oldtext = "";

const parseAlertData = body => {
  console.log(body.indexOf("alert_content = "));
  return body.substring(
    body.indexOf("alert_content = ") + 17,
    body.indexOf("alert_default = ") - 4
  );
};

function rpialert() {

  curl.setHeaders(['user-agent: nodejs'])
  .get('https://alert.rpi.edu/alerts.js')
  .then(({statusCode, body, headers}) => {
    const alert = parseAlertData(body);

    text = alert;

    if (text != oldtext && text != "") {
      var message =  {
        unfurl_links: false,
        channel: rpialert_channel,
        token: info.token,
        "username": "RPI AlertBot",
        "text": "RPI ALERT - <!channel>",
        "fallback": "RPI ALERT: " + text,
        "attachments": [
          {
            "text": text,
            "color": "#f00",
            "footer": "More info: http://alert.rpi.edu",
            "footer_icon": "https://emoji.slack-edge.com/T351C3UGL/rpi/a494ab4a33755c38.png"
          }
        ]
      };
      oldtext = text;
    }

    slack.send('chat.postMessage', message);
  })
  .catch((e) => {
    console.log(e);
    return;
  });
}

setInterval(function() {rpialert();}, 10000);
