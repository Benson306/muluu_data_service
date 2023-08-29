const axios = require('axios');
const natural = require('natural');
const { TfIdf } = natural;
let express =  require('express');
const cheerio = require('cheerio');
const LongtailModel = require('../models/LongtailModel');

const stopwords = require('natural').stopwords;

let app =  express.Router();

const bodyParser = require('body-parser');

let cron = require('node-cron');
const PagesModel = require('../models/PagesModel');
const IdsModel = require('../models/IdsModel');

const urlEncoded = bodyParser.urlencoded({extended: false});

//Scheduled longtail scrapper
function getLongtailFromScrappedDataInDb(scrapedData){
      // Initialize TF-IDF instance
      const tfidf = new TfIdf();

      const $ = cheerio.load(scrapedData);

      const textContent = $('p').text();

      // Tokenize the target keyword
      let tokenizer = new natural.WordTokenizer();

      //const tokens = tokenizer.tokenize(textContent);

      const filteredTokens = tokenizer.tokenize(textContent);

      //Remove stopwords
      //const filteredTokens = tokens.filter(token => !stopwords.includes(token.toLowerCase()));

      // Add documents (text) to the TF-IDF instance
      tfidf.addDocument(filteredTokens);

      // Calculate TF-IDF for the target keyword
      const keywords = [];

      const MIN_KEYWORD_LENGTH = 3;
      let currentKeyword = '';

      for (const word of filteredTokens) {
          if (word.length >= MIN_KEYWORD_LENGTH) {
            if (currentKeyword === '') {
              currentKeyword = word;
            } else {
              currentKeyword += ' ' + word;
            }
          } else if (currentKeyword !== '') {
            keywords.push(currentKeyword);
            currentKeyword = '';
          }
        }

      //Extract keywords with a minimum length of three words 
      const sensibleKeywords = [];

      keywords.forEach(phrase => {
        const words = phrase.split(' ');
          if(words.length > 3 && words.length < 12){

            let totalTfIdfScore = 0;

            words.forEach(token => {
              let score = tfidf.tfidfs(token, (i, measure) => measure);
              totalTfIdfScore += Number(score[0].toFixed(3));
            });

            sensibleKeywords.push({ longtail_keyword: phrase, score: Number(totalTfIdfScore.toFixed(3)) });

            //sensibleKeywords.push(phrase);
          }
      })

      // Sort keywords based on TF-IDF scores
      sensibleKeywords.sort((a, b) => b.score - a.score);
      
      //Save to DB
      sensibleKeywords.forEach((keyword)=>{
        if(keyword.score > 4){
          LongtailModel(keyword).save()
          .then(()=>{
            console.log('Longtail Data Saved');
          })
          .catch(()=>{
            console.log("Error in saving longtail keyword");
          })
        }
      })
}

function run_longtail_scrapper(){
  PagesModel.find({})
  .then((data)=>{   
    data.forEach(dt =>{
      //Check if id exists in page_ids collection
      IdsModel.find({page_id: dt._id})
      .then((idsData)=>{

        if(idsData.length == 0){
          
          getLongtailFromScrappedDataInDb(dt.page_html);

          IdsModel({page_id: dt._id}).save()
          .then(()=>{
            console.log("Page Id saved");
          })
          .catch(()=>{
            console.log("Error In Saving page Id");
          })
        }
      })

      
    })
  })
}

//Schedule the scrapper to check for changes after every 1 hour and scrape the longtail keywords from it.
let scheduled = cron.schedule('0 * * * *', () => {
  run_longtail_scrapper();
});

scheduled.start();

app.get('/longtail/:keyword',async (req, res)=>{
  try{
    const results = await LongtailModel.find({ longtail_keyword: { $regex : req.params.keyword, $options: 'i'}})
    .sort({ score: -1 })
    .limit(5)
    .toArray()

    res.json(results);
  } 
  catch(error){
    console.log("Error retrieving data" + error);
    res.status(500).send('Internal Server Error');
  }
     
})

module.exports = app;