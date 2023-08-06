let express =  require('express');

let app =  express.Router();

const unirest = require('unirest');
const KeywordsModel = require('../models/KeywordsModel');

//Make request to serper
function make_request(keyword, callback){

    unirest('POST', `https://google.serper.dev/search`)
    .headers({
      'X-API-KEY': process.env.API_KEY,
      'Content-Type': 'application/json'
    })
    .send(JSON.stringify({
      "q": `${keyword}`
    }))
    .end((response) => { 
      if (response.error) throw new Error(response.error); 

      callback(response.raw_body);
    });

}

//get timestamp
function getFormattedDate() {
  const now = new Date();
  
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is zero-based
  const year = String(now.getFullYear());

  return day + month + year;
}


app.get('/keyword/:word',(req, res)=>{

  const formattedDate = getFormattedDate();

  //Make request and receive date as a callback
  make_request(req.params.word,(data)=>{

    let dbData = {
      keyword: req.params.word,
      timestamp: formattedDate,
      result: JSON.parse(data)
    }

    KeywordsModel(dbData).save()
    .then(()=>{
      res.json(dbData);
    })
    .catch(err => {
      console.log('Error in sending Data to db');
    })

  });

   
})

module.exports = app;