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
    mongoose.connect('mongodb://localhost/haveFunDEV', { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
        .then(() => { console.log("Connecting to MongoDb...") })
        .catch((err) => { console.log("Error while connecting to MongoDb", err) });
} else if (process.env.NODE_ENV == 'prod') {
    mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
        .then(() => { console.log("Connecting to online MongoDb Atlas...") })
        .catch((err) => { console.log("Error while connecting to MongoDb Atlas", err) });
}

// routes   

app.use('/users', user)

module.exports = app;