const Confidence = require('confidence');

const internals = {
  criteria: {
    env: process.env.NODE_ENV,
  },
};

internals.config = {
  $meta: 'App configuration file',
  pardot: {
    $filter: 'env',
    production: {
      api_url: process.env.PARDOT_API_URL,
      email: process.env.PARDOT_USER_EMAIL_PROD,
      password: process.env.PARDOT_USER_PASSWORD_PROD,
      user_key: process.env.USER_KEY_PROD,
      from_user_id: process.env.FROM_USER_ID_PROD,
      email_template_id: process.env.EMAIL_TEMPLATE_ID_PROD
    },
    $default: {
      api_url: process.env.PARDOT_API_URL,
      email: process.env.PARDOT_USER_EMAIL_DEV,
      password: process.env.PARDOT_USER_PASSWORD_DEV,
      user_key: process.env.USER_KEY_DEV,
      from_user_id: process.env.FROM_USER_ID_DEV,
      email_template_id: process.env.EMAIL_TEMPLATE_ID_DEV
    }    
  }
};

internals.store = new Confidence.Store(internals.config);

exports.get = function(key) {
  return internals.store.get(key, internals.criteria);
};

exports.meta = function(key) {
  return internals.store.meta(key, internals.criteria);
};
