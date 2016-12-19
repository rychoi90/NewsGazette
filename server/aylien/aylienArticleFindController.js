/*
Aylien News API - related news

For more information, see: https://newsapi.aylien.com/docs/endpoints/related_stories/nodejs
*/

var Promise = require('bluebird');
var aylienNewsApi = require('aylien-news-api');
var aylienNonpromise = new aylienNewsApi.DefaultApi();
var aylienGoop = require('../keys/keylist.js').aylienKey;


// GOOP EXAMPLE: {
//   application_id: 'YOUR_APP_ID',
//   application_key: 'YOUR_APP_KEY'
// }

// Configure API key authorization: app_id
var app_id = aylienNonpromise.apiClient.authentications['app_id'];
app_id.apiKey = aylienGoop.application_id;


// Configure API key authorization: app_key
var app_key = aylienNonpromise.apiClient.authentications['app_key'];
app_key.apiKey = aylienGoop.application_key;

var aylienArticles = Promise.promisifyAll(aylienNonpromise);

module.exports.findRelatedArticles = function(req, res, next) {
// console.log("IN RELATED ARTICLES");
  if (!res.compoundContent.entities) {
    var topKeywords = [];
    res.compoundContent.keywords.map(function(item) {
      topKeywords.push(JSON.stringify(item.text));
    });
    topKeywords = (topKeywords.join(' OR '));

  } else if (!!res.compoundContent.entities) {
    var topEntities = [];
    res.compoundContent.entities.map(function(item) {
      if (!!item.disambiguated) {
        topEntities.push(item.disambiguated.name);
      } else {
        topEntities.push(item.text);
      }
    });
    topEntities = topEntities.join(' OR ');
  }

  var keywordsOrEntities = topEntities || topKeywords;
  console.log(keywordsOrEntities);
  var opts = {

    // 'entities.body.text': keywordsOrEntities,
    'body': keywordsOrEntities,
    'language': ['en'],
    'publishedAtStart': 'NOW-30DAYS',
    'publishedAtEnd': 'NOW',
    // 'cluster': true,
    // 'sentimentBodyPolarity': 'positive',
    // 'sentimentBodyPolarity': 'negative',
    // 'source.name[]': '[!thedailybeast]',
    '_return': ['id', 'title', 'sentiment', 'links'],
    // 'categoriesTaxonomy': 'iab-qag',
    // 'categoriesId': ['IAB17'],
    'perPage': 5
  };


  if (opts) {
    aylienArticles.listStoriesAsync(opts)
    .then(relatedArticles => {
      // relatedArticlesTitles = [];
      // relatedArticlesLinks = [];

      res.compoundContent = res.compoundContent || {};
      res.compoundContent['related'] = relatedArticles;
      // console.log(res.compoundContent.related, '<<=====RELATED ARTICLES=====');
      next();
    });
  }
};


