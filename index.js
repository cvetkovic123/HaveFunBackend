require('dotenv').config();
const app = require('./server/app');
const port = process.env.PORT | 3300;

app.listen(port, () => { console.log(`Listening to port ${port}`)}); 