let express = require('express');

let app = express();

require('dotenv').config();

app.use(express.json());

let mongoose = require('mongoose');

//Connect to mongoDb using mongoose library
let mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI);

let keywordsController = require('./controllers/KeywordsController');
app.use('/', keywordsController);

let longtailController = require('./controllers/LongtailContoller');
app.use('/', longtailController);

let scrapingController = require('./controllers/ScrapingController');
app.use('/', scrapingController);

let port = 3000;

app.listen(port, ()=>{
    console.log(`Server is running on ${port}`);
});
