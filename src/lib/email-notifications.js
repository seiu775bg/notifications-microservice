const _           = require('lodash');
const rp          = require('request-promise');
const rq          = require('request');
const Bottleneck  = require('bottleneck');
const util        = require('util');
const Config      = require('../config/config');
const axios       = require('axios');
const parseString = require('xml2js').parseString;

const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 100
});

class EmailNotifier{
  constructor(opt){
    // console.log("EmailNotifier options received are ", util.inspect(opt, {depth: null, colors: true}));

    this.url      = opt.uri;
    this.key      = opt.key;
    this.email    = opt.email;
    this.version     = opt.version || '4';
  }

  getUrl(endpoint, action) {
    let url = this.url.slice(-1) === '/' ? this.url : `${this.url}/`;
    if(action){
      url = `${url}${endpoint}/version/${this.version}/do/${action}`;
    }else{
      // handle login (no action)
      url = `${url}${endpoint}/version/${this.version}`;
    }

    return url;
  }

  request(method, endpoint, action, data, userKey, apiKey) {
    let url = this.getUrl(endpoint, action);

    const options = {
      url: url,
      method: method,
      json: true,
      transformResponse: [function (data) {
        // pull out Pardot response data from their weird XML
        return parseString(data, function (err, result) {
          return result;
        });
      }]
    };

    // handle login
    if(action){
      options.data = data;

      _.set(options, 'headers', { 'Authorization': `Pardot user_key=${userKey},api_key=${apiKey}` });
    }else{
      // Object.assign(params, { params: { email: _.get(data, 'email'), password: _.get(data, 'password'), user_key: _.get(data, 'user_key')  }});
      Object.assign(options, { params: { email: 'ian.follett+api@myseiubenefits.org', password: 'x$4z2Nr5f&FC&31AAOEp3WBIdZ37g2', user_key: 'da25de77d19015bf83af24822779944f'  }});
    }

    return new Promise((resolve, reject) => {
      limiter.schedule(() => axios(options))
        .then((response) => {

          
        })
        .catch(function(err){
          throw err;
        });
    });
  }

  get(endpoint, action, qs) {
    return this.request('GET', endpoint, action, qs);
  }

  post(endpoint, action, data) {
    return this.request('POST', endpoint, action, data);
  }

  put(endpoint, action, data) {
    return this.request('POST', endpoint, action, data);
  }

  patch(endpoint, action, data) {
    return this.request('PATCH', endpoint, action, data);
  }

  delete(endpoint, action) {
    return this.request('DELETE', endpoint, action, null);
  }

  options(endpoint, action) {
    return this.request('OPTIONS', endpoint, action, null);
  }

  authorize(credentials){
    // 'form_params' => [
    //     'user_key' => 'da25de77d19015bf83af24822779944f',
    //     'email' => 'ian.follett+api@myseiubenefits.org',
    //     'password' => 'x$4z2Nr5f&FC&31AAOEp3WBIdZ37g2',
    //     'format' => 'json'
    // ]

    var params = {
      user_key: _.get(credentials, 'key'),
      email: _.get(credentials, 'email'),
      password: _.get(credentials, 'password'),
      format: 'json'
    };

    return this.request('POST', 'login', null, params);
  }

  send(credentials, params){
    var payload = {};

    // 'form_params' => [
    //     'user_key' => 'da25de77d19015bf83af24822779944f',
    //     'api_key' => $this->auth(),
    //     'campaign_id' => $request->campaign?:'7339',
    //     'prospect_email' => $request->email,
    //     'from_user_id' => 17490373,
    //     'email_template_id' => $request->template,
    //     'operational_email' => true,
    //     'format' => 'json'
    // ]

    var self = this;

    return new Promise((resolve, reject) => {
      self.authorize(credentials).then(function(data){
        payload = {
          'user_key': _.get(credentials, 'key'),
          'api_key': _.get(data, 'apiKey'),
          'campaign_id': _.get(params, 'campaignId', '7339'),
          'prospect_email': _.get(params, 'email'),
          'from_user_id': _.get(credentials, 'userId'),
          'email_template_id': _.get(credentials, 'templateId'),
          'operational_email': true,
          'format': 'json'
        };

        resolve(self.post('email', 'send', payload, _.get(credentials, 'key'), _.get(data, 'apiKey')));
      }).catch(function(err){
        throw err;
      });
    }).catch(function(err){
      throw err;
    });
  }
}

module.exports = EmailNotifier;
