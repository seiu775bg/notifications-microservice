const _          = require('lodash');
const rp         = require('request-promise');
const rq         = require('request');
const Bottleneck = require('bottleneck');
const util       = require('util');
const Config  = require('../config/config');

const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 100
});

class EmailNotifier{
  constructor(opt){
    console.log("EmailNotifier options received are ", util.inspect(opt, {depth: null, colors: true}));

    this.url      = opt.uri;
    this.key      = opt.key;
    this.email    = opt.email;
    this.version     = opt.version || '4';
  }

  getUrl(endpoint, action) {
    let url = this.url.slice(-1) === '/' ? this.url : `${this.url}/`;
    if(action){
      url = `${url}/${endpoint}/version/${this.version}/do/${action}`;
    }else{
      // handle login (no action)
      url = `${url}/${endpoint}/version/${this.version}`;
    }

    return url;
  }

   request(method, endpoint, action, data) {
    const url = this.getUrl(endpoint);

    const options = {
      method: method,
      uri: url,
      json: true
    };

    return new Promise((resolve, reject) => {
      limiter.schedule(() => rp(options))
        .then((result) => {
          resolve(result);
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

  authorize(key, email, password){
    // 'form_params' => [
    //     'user_key' => 'da25de77d19015bf83af24822779944f',
    //     'email' => 'ian.follett+api@myseiubenefits.org',
    //     'password' => 'x$4z2Nr5f&FC&31AAOEp3WBIdZ37g2',
    //     'format' => 'json'
    // ]

    var params = {
      user_key: key,
      email: email,
      password: password,
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

        resolve(self.post('email', 'send', payload));
      });
    }).catch(function(err){
      throw err;
    });
  }
}

module.exports = EmailNotifier;
