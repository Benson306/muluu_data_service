const axios = require('axios');
const natural = require('natural');
const { TfIdf } = natural;
let express =  require('express');
const cheerio = require('cheerio');
const LongtailModel = require('../models/LongtailModel');

const stopwords = require('natural').stopwords;

let app =  express.Router();

let cron = require('node-cron');
const PagesModel = require('../models/PagesModel');
const IdsModel = require('../models/IdsModel');

//Scheduled longtail scrapper
function getLongtailFromScrappedDataInDb(scrapedData){
      // Initialize TF-IDF instance
      const tfidf = new TfIdf();

      // Tokenize the target keyword
      let tokenizer = new natural.WordTokenizer();

      const $ = cheerio.load(scrapedData);

      const textContent = $('p').text();

      //Tokenize document
      const tokens = tokenizer.tokenize(textContent);
      
      // Add documents (text) to the TF-IDF instance
      tfidf.addDocument(tokens);

      let paragraphs = [];

      $('p').each((index, element)=>{
        const paragraphText = $(element).text().trim();
        if(paragraphText){
          paragraphs.push(paragraphText)
        }
      })
      
      // Filter Keywords with numbers
      //const sentences = paragraphs.filter(keyword => !/\d/.test(keyword));


      let phrases = [];
      // Get phrases with more than 3 words and less 
      paragraphs.forEach(sentence => {
        const words = sentence.split(' ');
           if(words.length > 3 && words.length < 12){
            const words = sentence.split(' ');
            if(words.length > 3 && words.length < 12){
                  let totalTfIdfScore = 0;
      
                  words.forEach(token => {
                    let score = tfidf.tfidfs(token, (i, measure) => measure);
                    totalTfIdfScore += Number(score[0].toFixed(3));
                  });
      
                  phrases.push({ longtail_keyword: sentence, score: Number(totalTfIdfScore.toFixed(3)) });
                }
          }
      })

      // Sort keywords based on TF-IDF scores
      phrases.sort((a, b) => b.score - a.score);


      //Save to DB
      phrases.forEach((keyword)=>{
        if(keyword.score > 4){
          //Check for duplicates
          LongtailModel.find({ longtail_keyword: { $regex : keyword.longtail_keyword, $options: 'i'}})
          .then((data)=>{
          
            if(data.length == 0){
              //Save if there are no duplicates
                LongtailModel(keyword).save()
                .then(()=>{
                  console.log('Longtail Data Saved');
                })
                .catch(()=>{
                  console.log("Error in saving longtail keyword");
                })
            }else{
              console.log('keyword not found')
            }
            
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

//run_longtail_scrapper();
//Schedule the scrapper to check for changes after every 1 hour and scrape the longtail keywords from it.
let scheduled = cron.schedule('0 */6 * * *', () => {
  run_longtail_scrapper();
});


scheduled.start();

app.get('/longtail/:keyword', (req, res)=>{
  try{
    LongtailModel.find({ longtail_keyword: { $regex : req.params.keyword, $options: 'i'}})
    .then((data)=>{
      if(data.length > 0){
        let sortedData = data.sort((a,b) => b.score - a.score)
        let top10Data = sortedData.slice(0, 10);

        const nonDuplicates = [];

        top10Data.map((top)=>{
          if(!nonDuplicates.includes(top.longtail_keyword)){
            nonDuplicates.push(top.longtail_keyword);
          }
        })


        res.json(nonDuplicates);
      }else{
        res.status(300).json(`No longtail keyword associated with ${req.params.keyword}.`);
      }
      
      })
  }
  catch(error){
    console.log("Error retrieving data" + error);
    res.status(500).send('Internal Server Error');
  }
     
})

module.exports = app;


// const textContent = $('p').text();

      // // Tokenize the target keyword
      // let tokenizer = new natural.WordTokenizer();

      // //const tokens = tokenizer.tokenize(textContent);

      // const filteredTokens = tokenizer.tokenize(textContent);

      // //Remove stopwords
      // //const filteredTokens = tokens.filter(token => !stopwords.includes(token.toLowerCase()));

      // // Add documents (text) to the TF-IDF instance
      // tfidf.addDocument(filteredTokens);

      // // Calculate TF-IDF for the target keyword
      // const keywords = [];

      // const MIN_KEYWORD_LENGTH = 3;
      // let currentKeyword = '';

      // for (const word of filteredTokens) {
      //     if (word.length >= MIN_KEYWORD_LENGTH) {
      //       if (currentKeyword === '') {
      //         currentKeyword = word;
      //       } else {
      //         currentKeyword += ' ' + word;
      //       }
      //     } else if (currentKeyword !== '') {
      //       keywords.push(currentKeyword);
      //       currentKeyword = '';
      //     }
      //   }

      //   const filteredSensibleKeywords = keywords.filter(keyword => !/\d/.test(keyword));

      // //Extract keywords with a minimum length of three words 
      // const sensibleKeywords = [];

      // filteredSensibleKeywords.forEach(phrase => {
      //   const words = phrase.split(' ');
      //     if(words.length > 3 && words.length < 12){

      //       let totalTfIdfScore = 0;

      //       words.forEach(token => {
      //         let score = tfidf.tfidfs(token, (i, measure) => measure);
      //         totalTfIdfScore += Number(score[0].toFixed(3));
      //       });

      //       sensibleKeywords.push({ longtail_keyword: phrase, score: Number(totalTfIdfScore.toFixed(3)) });

      //       //sensibleKeywords.push(phrase);
      //     }
      // })

      // // Sort keywords based on TF-IDF scores
      // sensibleKeywords.sort((a, b) => b.score - a.score);
      // //Save to DB
      // sensibleKeywords.forEach((keyword)=>{
      //   if(keyword.score > 4){
      //     //Check for duplicates
      //     LongtailModel.find({ longtail_keyword: { $regex : keyword.longtail_keyword, $options: 'i'}})
      //     .then((data)=>{
          
      //       if(data.length == 0){
      //         //Save if there are no duplicates
      //           LongtailModel(keyword).save()
      //           .then(()=>{
      //             console.log('Longtail Data Saved');
      //           })
      //           .catch(()=>{
      //             console.log("Error in saving longtail keyword");
      //           })
      //       }else{
      //         console.log('keyword not found')
      //       }
            
      //     })

      //   }
      // })