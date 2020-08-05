const 
    mongoose = require('mongoose'),
    express = require('express'),
    helmet = require('helmet'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    morgan = require('morgan'),

    user = require('./routes/user');
    
const app = express();

app.use(morgan('dev'));
app.use(express.static('./public'));

app.use(cors({ credentials: true, origin: true }));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false}));

mongoose.set('useFindAndModify', false);

if (process.env.NODE_ENV == 'test') {
    mongoose.connect('mongodb://localhost/haveFunDEV', { useNewUrlParser: true, useCreateIndex: true, poolSize: 10, useUnifiedTopology: true })
        .then(() => { console.log("Connecting to MongoDb...") })
        .catch((err) => { console.log("Error while connecting to MongoDb", err) });
} else {
    mongoose.connect('mongodb://heroku_jgrc9kdw:105ef5rr7m56d7emcotf1pgjjo@ds261136.mlab.com:61136/heroku_jgrc9kdw', { useNewUrlParser: true, useCreateIndex: true, poolSize: 10, useUnifiedTopology: true })
        .then(() => { console.log("Connecting to online MongoDb Atlas...") })
        .catch((err) => { console.log("Error while connecting to MongoDb Atlas", err) });
}

// routes   

app.use('/users', user)

module.exports = app;