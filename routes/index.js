var express = require('express');
var Twitter = require('twitter');
var config = require('../config');

var router = express.Router(); 
var client = new Twitter(config.twitter);

function parseTwitterDate(tdate) {
    var system_date = new Date(Date.parse(tdate));
    var user_date = new Date();
    var diff = Math.floor((user_date - system_date) / 1000);
    if (diff <= 1) {return "just now";}
    if (diff < 20) {return diff + " seconds ago";}
    if (diff < 40) {return "half a minute ago";}
    if (diff < 60) {return "less than a minute ago";}
    if (diff <= 90) {return "one minute ago";}
    if (diff <= 3540) {return Math.round(diff / 60) + " minutes ago";}
    if (diff <= 5400) {return "1 hour ago";}
    if (diff <= 86400) {return Math.round(diff / 3600) + " hours ago";}
    if (diff <= 129600) {return "1 day ago";}
    if (diff < 604800) {return Math.round(diff / 86400) + " days ago";}
    if (diff <= 777600) {return "1 week ago";}
    return "on " + system_date;
}

router.get('/', function(req, res, next) {
  // https://dev.twitter.com/rest/reference/get/statuses/user_timeline
  var trends = []
  client.get('statuses/user_timeline', { screen_name: 'CNNMoney', count: 20 }, function(error, tweets, response) {
    client.get('trends/place.json', { id:23424977, count: 10 }, function(error, trends, response) {
    trends = trends[0].trends.map((trend)=> {
      if(trend.name && trend.name[0] == '#' && trend.name.length > 1){
        trend.href = 'http://localhost:3000/search?q=' + trend.query
        return trend
      }})
    trends = trends.filter(function( element ) {
      return element !== undefined;
    });
      // res.status(200).render('trends', { title: 'Express', tweets: trends });
    if (!error) {
      user = tweets[1].user
      tweets.forEach((tweet)=> {
        tweet.created_at = parseTwitterDate(tweet.created_at)
        tweet.tweetText = tweet.text.split("http")[0]
        setMedia(tweet)
      })
      res.status(200).render('index', { title: 'Express', tweets: tweets, user: user, trends: trends });
    }
    else {
      res.status(500).json({ error: error });
    }})
  });
});

router.get('/search', function(req, res, next){
  client.get('search/tweets.json', req.query , function(error, tweets, response){
    client.get('trends/place.json', { id:23424977, count: 10 }, function(error, trends, response) {
    trends = trends[0].trends.map((trend)=> {
      trend.href = 'http://localhost:3000/search?q=' + trend.query
      if(trend.name && trend.name[0] == '#' && trend.name.length > 1){
        return trend
      }})
    trends = trends.filter(function( element ) {
      return element !== undefined;
    });
      // res.status(200).render('trends', { title: 'Express', tweets: trends });
    if (!error) {
      tweets = tweets.statuses
      tweets.forEach((tweet)=> {
        tweet.created_at = parseTwitterDate(tweet.created_at)
        tweet.tweetText = tweet.text.split("http")[0]
        setMedia(tweet)
      })
      res.status(200).render('index', { title: 'Express', tweets: tweets, trends: trends });
    }
    else {
      res.status(500).json({ error: error });
    }})
  });
});

var setMedia = function(tweet){
  if(tweet.entities.media){
    if(tweet.entities.media[0].type == 'photo'){
      tweet.embedPhoto = tweet.entities.media[0].media_url + ":thumb"
    }else if(tweet.entities.media[0].type == 'video'){
      tweet.embedVideo = tweet.entities.media[0].media_url
    }
  }
}

module.exports = router;
