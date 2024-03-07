let express =  require('express');

let app =  express.Router();

const unirest = require('unirest');

const bodyParser = require('body-parser');
const PagesModel = require('../models/PagesModel');
const SitesModel = require('../models/SitesModel');

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
  try{
    make_request(req.body.url,(data)=>{

      const domainName = new URL(req.body.url);
      const jsonData = JSON.parse(data);
  
      let savedData = {
        page_link: req.body.url,
        domain: domainName.hostname,
        page_html: jsonData.result
      }
  
      PagesModel.find({page_link: req.body.url})
      .then(data => {
        if(data.length > 0){
          res.status(200).json(savedData);
        }else{
          PagesModel(savedData).save()
          .then(()=>{
            //SitesModel.find({})
            res.status(200).json(savedData);
          })
        }
      })
  
  
    });
  }
  catch(err){
    res.json(500).json('Failed. Server Error');
  }
  
})

module.exports = app;