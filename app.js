let express = require('express');

let app = express();

require('dotenv').config();

app.use(express.json())

let keywordsController = require('./controllers/KeywordsController');
app.use('/', keywordsController);

let port = 3000;

app.listen(port, ()=>{
    console.log(`Server is running on ${port}`);
});