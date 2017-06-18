'use strict';
var Alexa = require('alexa-sdk');
var AWS = require('aws-sdk');

var APP_ID = 'amzn1.ask.skill.acd405a6-1db8-4169-87ed-72862d3b04a3';
var SKILL_NAME = "My Reminder";
var HELP_MESSAGE = "You can say tell me a space fact, or, you can say exit... What can I help you with?";
var HELP_REPROMPT = "What can I help you with?";
var STOP_MESSAGE = "Goodbye!";
var ACTION = '';

exports.handler = function(event, context, callback) {
    // Set the action
    var slots = event.request.intent.slots
    ACTION = slots['GENERAL_ACTION'].value
    
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const ACTIONS = {
    'washed babies bed sheets': 'ACTION_WASHED_KIDS_BED_SHEETS',
    'washed the babies bed sheets': 'ACTION_WASHED_KIDS_BED_SHEETS',
    'washed the kids bed sheets': 'ACTION_WASHED_KIDS_BED_SHEETS',
    'washed kids bed sheets': 'ACTION_WASHED_KIDS_BED_SHEETS'
}

var handlers = {
    'Unhandled': function () {
        this.emit(':ask', "I'm sorry, but I'm not sure what you asked me.")
    },
    'LaunchRequest': function () {
        this.emit('GetLastTimeIIntent');
    },
    'GetLastTimeIIntent': function () {
        // Set the Action to out internal variables
        var action = ACTIONS[ACTION]
        
        // Pull info from dynamoDB if present
        if (!action) this.emit(':tell', 'Im sorry.  I dont know when you last, '+ACTION)
        
        var DynamoDB = AWS.DynamoDB()
        var lookupPayload = {
            
        }
        DynamoDB.getItem(lookupPayload, function(err, resp){
            if (err) if (!action) this.emit(':tell', 'Im sorry.  I dont know when you last, '+ACTION)
            // Respond to the user
            this.emit(':tellWithCard', 'I am an output', SKILL_NAME, 'I am the random fact - '+ACTION+' '+action)
        })
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
