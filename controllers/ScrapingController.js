let express =  require('express');

let app =  express.Router();

const unirest = require('unirest');

const bodyParser = require('body-parser');

const urlEncoded = bodyParser.urlencoded({extended: false});

//Make request to scrapingbot
function make_request(url, callback){

    unirest('POST', `https://api.scrapingrobot.com/?token=${process.env.SCRAPING_TOKEN}`)
    .headers({
      'accept': 'application/json',
      'content-type': 'application/json'
    })
    .send(JSON.stringify({
      "url": `${url}`,
      "module": "HtmlRequestScraper"
    }))
    .end((response) => { 
      if (response.error) throw new Error(response.error); 

      callback(response.raw_body);
    });

}


app.post('/scrape', urlEncoded ,(req, res)=>{

  //Make request and receive date as a callback
  make_request(req.body.url,(data)=>{

    res.json(data);

  });

   
})

module.exports = app;