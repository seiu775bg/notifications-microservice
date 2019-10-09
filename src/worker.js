const dotenvJSON = require("dotenv-json");
dotenvJSON({ path: "/var/secrets/env/dotenv.json"});

const _       = require('lodash');
const moment  = require('moment');
const Config  = require('./config/config');
const {PubSub} = require('@google-cloud/pubsub');
const Notifiers = require('./lib/')

const pubsub = new PubSub();

const credentials = {
  pardot: {
    uri: Config.get('/pardot/api_url'),
    key: Config.get('/pardot/user_key'),
    userId: Config.get('/pardot/from_user_id'),
    templateId: Config.get('/pardot/email_template_id')
  }
};

const notifiers = new Notifiers(credentials.pardot);

// TODO move to config?
if (process.env.NODE_ENV === "production") {
  subscriptionNames = ['projects/seiu-demo-jenkins-x/subscriptions/prod-notifications-microservice'];
}else{
  subscriptionNames = ['projects/seiu-demo-jenkins-x/subscriptions/dev-notifications-microservice'];
}

_.each(subscriptionNames, function(subscriptionName){
  console.log("Subscribing to ", subscriptionName);

  // References an existing subscription
  const subscription = pubsub.subscription(subscriptionName);

  const messageHandler = message => {
    console.log(`Received message: ${message.id}`);
    console.log(`Data: ${message.data}`);
    console.log(`Attributes: ${message.attributes}`);
    
    // switch email template ID based on message attribute
    switch(_.get(message, 'attributes.emailType')){
    case 'student_eligible':
      notifiers.emailNotifier.send(credentials.pardot, { 
        campaignId: 7339, 
        email: _.get(message.attributes, 'email'),
      });
      break;
    }    

    message.ack();
  }


  // Listen for new messages forever and ever
  subscription.on(`message`, messageHandler);
  console.log("Subscribed to ", subscriptionName);

});
