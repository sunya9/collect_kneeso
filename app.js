var Twitter = require('twitter');
var settings = require('./config');
var twit = new Twitter(settings);
var fs = require('fs');
var request = require('request');
var path = require('path');

const KNEEHIGH = '#いいニーハイの日';
const SAVE_DIR = path.join(__dirname, 'pictures');
const IGNORE_BIO_KEYWORD = [
  '女装',
  '男の娘'
];

twit.stream('statuses/filter', {track: KNEEHIGH, include_rts: false}, stream =>{
  stream.on('data', receiveTweet);

  stream.on('error', errorHandle);
});

function receiveTweet(tweet){
  var user = tweet.user;
  var isContain = IGNORE_BIO_KEYWORD.findIndex(keyword =>{
    var bio = user.description && user.description.indexOf(keyword) >= 0;
    var body = tweet.text && tweet.text.indexOf(keyword) >= 0;
    return bio || body;
  });
  if(isContain >= 0) return ignoreMessage(user);
  if(!tweet.extended_entities && typeof tweet.extended_entities.media !== 'object') return;
  getPictures(tweet.extended_entities.media);
}

function getPictures(media){
  console.log('getPictures', media.length);
  media.forEach(getPicture);
}

function getPicture(medium){
  var name = path.basename(medium.media_url);
  var url = `${medium.media_url}:orig`;
  console.log('url:', url);
  var savePath = path.join(SAVE_DIR, name);
  fs.stat(savePath, (err, stats)=>{
    if(err || !stats.isFile()){
      var ws = fs.createWriteStream(savePath);
      request.get(url).pipe(ws);
    }
  });
}

function errorHandle(error){
  console.error(error);
}

function ignoreMessage(user){
  console.log('Ignore', user.screen_name, user.name);
}