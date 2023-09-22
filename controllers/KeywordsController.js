let express =  require('express');

let app =  express.Router();

const unirest = require('unirest');
const KeywordsModel = require('../models/KeywordsModel');

const bodyParser = require('body-parser');

const urlEncoded = bodyParser.urlencoded({ extended: false })

const cheerio = require('cheerio');
const axios = require('axios');
const natural = require('natural');
const SitesModel = require('../models/SitesModel');
const PagesModel = require('../models/PagesModel');
const IndustryKeywordsModel = require('../models/IndustryKeywordsModel');
const KeywordOpportunityModel = require('../models/KeywordsOpportunityModel');
const stopwords = require('natural').stopwords;

//Make request to serper
function make_request(keyword, callback){

    unirest('POST', `https://google.serper.dev/search`)
    .headers({
      'X-API-KEY': process.env.API_KEY,
      'Content-Type': 'application/json'
    })
    .send(JSON.stringify({
      "q": `${keyword}`,
      "gl": "ke"
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

app.get('/keyword/:word', urlEncoded, (req, res)=>{

  const formattedDate = getFormattedDate();

  const keyword =  req.params.word;

  //Make request and receive date as a callback
  make_request(keyword,(data)=>{

    let dbData = {
      keyword: keyword,
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


function fetchAndExtractKeywords(data) {
  try {
    const $ = cheerio.load(data);

    // Extract full paragraphs from the webpage
    let pageText = "";
    $('p').each((index, element) => {
      const paragraphText = $(element).text().trim();
      if (paragraphText) {
        pageText = pageText.concat(paragraphText);
      }
    });

    return pageText;

  } catch (error) {
    console.error(`Error fetching or processing page ${data}:`, error);
    return ""; // Return an empty array if there's an error
  }
}

// Shuffle function to randomize the array order
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
}

app.post('/keyword_opportunity', urlEncoded, (req, res)=>{

  const url = req.body.url;
  const selected_industry = req.body.industry;

  //Check if industry and site has been queried before
  KeywordOpportunityModel.find({$and: [ {site : { $regex : url, $options: 'i'}}, {industry : { $regex : selected_industry, $options: 'i'}} ] })
  .then((opportunity_data)=>{
    if(opportunity_data.length > 0){
      res.json(opportunity_data[0])
    }else{
            //find url in sites collection
            PagesModel.find({ domain : { $regex : url, $options: 'i'} })
            .then(async (response) => {
              if(response.length !== 0){

                let siteText = "";

                //Find the scraped data from this sites
                response.map((data) => {
                  siteText =  siteText.concat(fetchAndExtractKeywords(data.page_html))
                })

                //Find Keywords related to the industry
                let keyword_opportunity = [];
                
                const industryResponses = await IndustryKeywordsModel.find({
                  industry: { $regex: selected_industry, $options: 'i' }
                });

                if (industryResponses.length > 0) {
                  industryResponses[0].keywords.forEach(keyword => {
                    //Remove special characters and numbers from text
                    const filteredParagraph = siteText.replace(/[^a-zA-Z\s]/g, '');

                    // Convert the paragraph to lowercase for case-insensitive comparison
                    const lowercasedParagraph = filteredParagraph.toLowerCase();

                    const keywordWords = keyword.split(' ');
                    // Check if keyword exists in the site

                    for (const word of keywordWords) {
                      if (lowercasedParagraph.includes(word.toLowerCase())) {
                        return true; // At least one word from the keyword is found
                      }else{
                        keyword_opportunity.push(keyword)
                      }
                    }

                  });
                }

                shuffleArray(keyword_opportunity);

                //Add To Db
                let dbData = {
                  site : url,
                  industry: selected_industry,
                  keywords: keyword_opportunity
                }

                KeywordOpportunityModel(dbData).save()
                .then((responseData)=>{
                  
                  res.json(responseData);
                })
                
              }else{
                //Implement Redis Part
                res.json('not found')
              }
            })
    }
  })

})

const redis = require("redis")

// initialize using default config
const RedisClient = redis.createClient()

const connectRedis = async () => {
    // connect to redis
    await RedisClient.connect()

    // handle error
    RedisClient.on('error', (err) => {
        console.error(`An error occurred with Redis: ${err}`)
    })

    console.log('Redis connected successfully...')
}
connectRedis();
module.exports = app;
