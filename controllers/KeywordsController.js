let express =  require('express');

let app =  express.Router();

const unirest = require('unirest');

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


app.get('/keyword/:word',(req, res)=>{

   make_request(req.params.word,(data)=>{
    res.json(data);
   });

   
})

module.exports = app;