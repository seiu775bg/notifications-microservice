const EmailNotifier = require('./email-notifications');

module.exports = function(opt){
  return {
    emailNotifier: new EmailNotifier(opt)

  }
};
