const 
    mongoose = require('mongoose'),
    express = require('express'),
    helmet = require('helmet'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    morgan = require('morgan'),

// routes require
    user = require('./routes/user');

const app = express();

app.use(morgan('dev'));

app.use(express.static('/public'));

app.use(cors({ credentials: true, origin: true }));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false}));

mongoose.set('useFindAndModify', false);

if (process.env.NODE_ENV == 'test') {
    mongoose.connect('mongodb://localhost/haveFunDEV', { useNewUrlParser: true, useCreateIndex: true, poolSize: 10, useUnifiedTopology: true })
        .then(() => { console.log("Connecting to MongoDb...") })
        .catch((err) => { console.log("Error while connecting to MongoDb", err) });
} else {
    mongoose.connect('mongodb://localhost/haveFunPROD', { useNewUrlParser: true, useCreateIndex: true, poolSize: 10, useUnifiedTopology: true })
        .then(() => { console.log("Connecting to MongoDb...") })
        .catch((err) => { console.log("Error while connecting to MongoDb", err) });
}

// routes   

app.use('/users', user)

module.exports = app;