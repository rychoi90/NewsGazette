// var Twitter = require('twitter');
// var Promise = require('bluebird');
// var keys = require('./twitterAPIKey');
// var bodyParser = require('body-parser');

// var twitter = new Twitter({
//   'consumer_key': keys.consumer_key,
//   'consumer_secret': keys.consumer_secret,
//   'access_token_key': keys.access_token_key,
//   'access_token_secret': keys.access_token_secret
// });

// twitter = Promise.promisifyAll(twitter);

// exports.getTweetsOnTopic = function(req, res, next) {
//   // var keywords = res.compoundContent.title.title.slice(0,20);
//   // console.log('twitter search titel: ', typeof res.compoundContent.title.title);
//   twitter.getAsync('search/tweets', {q: res.compoundContent.title.title, result_type: 'popular', count: 100})
//   .then(function(data) {
//     console.log(data);
//     res.compoundContent['twitter'] = data;
//     next();
//     //res.send(data);
//   })
//   .catch(function(err) {
//     console.error('Error with Twitter GET request', err);
//   });
// };
