const 
    mongoose = require('mongoose'),
    express = require('express'),
    helmet = require('helmet'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    morgan = require('morgan'),
    passport = require('passport'),

    user = require('./routes/user'),
    comments = require('./routes/comments')
    post = require('./routes/post');
    
const app = express();
// var allowCrossDomain = function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');  
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
//   if ('OPTIONS' == req.method) {
//     res.send(200);
//   }
//   else {
//     next();
//   }
// }; 
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
//   res.header("Access-Control-Allow-Headers", "content-type, Access-Control-Allow-Origin");
//   next();
// });

// app.all('/*', function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   next();
// });

app.use(morgan('dev'));
app.use(express.static('./public'));


var originsWhitelist = [
      //this is my front-end url for development
     process.env.CLIENT_URL || process.env.HOST_URL,
     
  ];
  var corsOptions = {
    origin: function(origin, callback){
          var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
          callback(null, isWhitelisted);
    },
    credentials:true
  }

app.use(cors(corsOptions));

app.use(bodyParser.json());



app.use(bodyParser.urlencoded({ extended: false}));

mongoose.set('useFindAndModify', false);

if (process.env.NODE_ENV == 'test') {
    mongoose.connect('mongodb://localhost/haveFunDEV', { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
        .then(() => { console.log("Connecting to MongoDb...") })
        .catch((err) => { console.log("Error while connecting to MongoDb", err) });
} else if (process.env.NODE_ENV == 'prod') {
    mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
        .then(() => { console.log("Connecting to online MongoDb Atlas...") })
        .catch((err) => { console.log("Error while connecting to MongoDb Atlas", err) });
}

// routes   

app.use('/users', user);
app.use('/posts', post);
app.use('/comments', comments);

module.exports = app;