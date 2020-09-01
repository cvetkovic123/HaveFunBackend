const 
    mongoose = require('mongoose'),
    express = require('express'),
    helmet = require('helmet'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    morgan = require('morgan'),
    passport = require('passport'),

    user = require('./routes/user'),
    post = require('./routes/post');
    
const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_URL + '/auth' || process.env.HOST_URL + '/auth'); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
  next();
});

app.use(morgan('dev'));
app.use(express.static('./public'));


var originsWhitelist = [
      //this is my front-end url for development
     process.env.CLIENT_URL || process.env.HOST_URL
  ];
  var corsOptions = {
    origin: function(origin, callback){
          var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
          callback(null, isWhitelisted);
    },
    credentials:true
  }

app.use(cors(originsWhitelist));

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

module.exports = app;