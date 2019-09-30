const _          = require('lodash');
const rp         = require('request-promise');
const rq         = require('request');
const Bottleneck = require('bottleneck');
const util       = require('util');

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
    this.password = opt.password;

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
    // const queryString = { login: this.login, password: this.password, criterion: { "Bookmark":"null", "ComparisonOperator":"Equal", "Value":"null" } };

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
    var params = {
      user_key: key,
      email: email,
      password: password,
      format: 'json'
    };

    this.request('POST', 'login', null, params);    
  }

  send(payload){
    return this.authorize.then(data) => {
      let key = _.get(data, 'apiKey');
      _.set(payload, { 'api_key', key });

      this.post('email', 'send', payload);
    }
  }
  
}

module.exports = EmailNotifier;
