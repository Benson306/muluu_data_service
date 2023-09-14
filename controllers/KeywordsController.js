let express =  require('express');

let app =  express.Router();

const unirest = require('unirest');
const KeywordsModel = require('../models/KeywordsModel');

const bodyParser = require('body-parser');

const urlEncoded = bodyParser.urlencoded({ extended: false })

const cheerio = require('cheerio');
const axios = require('axios');
const natural = require('natural');
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



async function fetchAndExtractKeywords(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Extract full paragraphs from the webpage
    const paragraphs = [];
    $('p').each((index, element) => {
      const paragraphText = $(element).text().trim();
      if (paragraphText) {
        paragraphs.push(paragraphText);
      }
    });

    return paragraphs;

    //return tokens;
  } catch (error) {
    console.error(`Error fetching or processing page ${url}:`, error);
    return ""; // Return an empty array if there's an error
  }
}


app.post('/keyword_opportunity', urlEncoded, async (req, res)=>{

  const url = req.body.url;
  const industry = req.body.industry;
  
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  let visitedUrls = [];
  // Find and follow links on the page
  $('a').each((index, element) => {
    const link = $(element).attr('href');
    if(link !== undefined && link.includes(url) && !visitedUrls.includes(link))
    {
      visitedUrls.push(link);
    }
  });

  const paragraphsArray = [];

  for (const _link of visitedUrls) {
    const paragraphs = await fetchAndExtractKeywords(_link);
    paragraphsArray.push(...paragraphs);
  }

  const filteredParagraphs = paragraphsArray.filter(paragraph => {
    const words = paragraph.split(' ');
    return  words.length >= 4 && words.length <= 10 ;
});

  res.json(filteredParagraphs)

})

module.exports = app;