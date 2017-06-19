'use strict';
var Alexa = require('alexa-sdk');
var AWS = require('aws-sdk');

var APP_ID = 'XXXXXXXXXX';
var HELP_MESSAGE = "You can say when was the last time I, or, you can say exit... What can I help you with?";
var HELP_REPROMPT = "What can I help you remember?";
var STOP_MESSAGE = "Bye Bye!";
var ACTION = '';


/**
 * Creates a user friendly date used
 * in the 'tell'
 *
 * @param String Date
 * @return String Thursday, June 18, 2017
 */
function getUserFriendlyDate(date) {
  var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(parseInt(date)).toLocaleString('en-US', options)
}


/**
 * Creates the JSON payload used to query DynamoDB
 *
 * @param action
 * @returns JSON
 */
function getDynamoRequestPayload(action) {
  return {
    TableName: 'lasttimei_events',
    KeyConditionExpression: 'ActionTaken = :action',
    ExpressionAttributeValues: {
      ':action': { S: action }
    },
    Limit: 1,
    ScanIndexForward: false // Descending order
  }
}

exports.handler = function(event, context, callback) {
  // Set the action
  var slots = event.request.intent.slots;
  ACTION = slots['GENERAL_ACTION'].value;
  console.log("Uttered Action", ACTION)
  var alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

// Holds incoming action taken to an associated action used in the DB
// which is tied to a button.

// @todo Look into parsing this using NLP {verb} {pronoun} {noun}
const ACTIONS = {
  'washed babies bed sheets': 'ACTION_WASHED_KIDS_BED_SHEETS',
  'washed baby\'s bed sheets': 'ACTION_WASHED_KIDS_BED_SHEETS',
  'washed the babies bed sheets': 'ACTION_WASHED_KIDS_BED_SHEETS',
  'washed the kids bed sheets': 'ACTION_WASHED_KIDS_BED_SHEETS',
  'washed kids bed sheets': 'ACTION_WASHED_KIDS_BED_SHEETS',
  'wash the kids bed sheets': 'ACTION_WASHED_KIDS_BED_SHEETS',
  'wash the baby\'s bed sheets': 'ACTION_WASHED_KIDS_BED_SHEETS'
}

var handlers = {
  'Unhandled': function () {
    this.emit(':ask', "I'm sorry, but I'm not sure what you asked me.")
  },
  'LaunchRequest': function () {
    this.emit('GetLastTimeIIntent');
  },
  'GetLastTimeIIntent': function () {
    // Set the Action to get internal variables
    var action = ACTIONS[ACTION]

    // Pull info from dynamoDB if present
    if (!action) return this.emit(':tell', 'Sorry. I don\'t know when you last '+ACTION)

    var DynamoDB = new AWS.DynamoDB()
    var lookupPayload = getDynamoRequestPayload(action)

    DynamoDB.query(lookupPayload, function(err, resp) {
      console.log("resp", resp)
      console.log("error", err)
      if (err || resp.Items.length === 0) this.emit(':tell', 'Im sorry.  I dont know when you last, '+ACTION)

      // Respond to the user
      // Get date and format for speech
      var date = resp.Items[0].TimeStamp.N
      var userFriendlyDate = getUserFriendlyDate(date)

      var tell = 'You last '+ACTION+' on '+userFriendlyDate
      this.emit(':tell', tell)
    }.bind(this))
  },
  'AMAZON.HelpIntent': function () {
    var speechOutput = HELP_MESSAGE;
    var reprompt = HELP_REPROMPT;
    this.emit(':ask', speechOutput, reprompt);
  },
  'AMAZON.CancelIntent': function () {
    this.emit(':tell', STOP_MESSAGE);
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', STOP_MESSAGE);
  }
};