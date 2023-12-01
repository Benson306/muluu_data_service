let express = require('express');

let app = express();

require('dotenv').config();

app.use(express.json());

let cors = require('cors')
 
app.use(cors())

let mongoose = require('mongoose');

//Connect to mongoDb using mongoose library
let mongoURI = process.env.DEV_MONGO_URI;

mongoose.connect(mongoURI);

let keywordsController = require('./controllers/KeywordsController');
app.use('/', keywordsController);

let longtailController = require('./controllers/LongtailController');
app.use('/', longtailController);

let scrapingController = require('./controllers/ScrapingController');
app.use('/', scrapingController);

let industryController = require('./controllers/IndustryController');
app.use('/', industryController);

let socialsController = require('./controllers/SocialMediaController');
app.use('/', socialsController);

let port = 3000;

app.listen(port, ()=>{
    console.log(`Server is running on ${port}`);
});
