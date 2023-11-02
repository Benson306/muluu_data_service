const natural = require('natural');
const { TfIdf } = natural;
let express =  require('express');
const cheerio = require('cheerio');
const LongtailModel = require('../models/LongtailModel');


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
      const sentences = paragraphs.filter(keyword => !/\d/.test(keyword));

      //Remove keywords with special characters
      //const filteredKeywords = sentences.filter(keyword => !/[^a-zA-Z0-9]/.test(keyword));

      let phrases = [];
      // Get phrases with more than 3 words and less 
      sentences.forEach(sentence => {
        const words = sentence.split(' ');
           if(words.length > 3 && words.length < 7){
            const words = sentence.split(' ');
            if(words.length > 3 && words.length < 7){
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
          const sanitizedKeyword = escapeRegExp(keyword.longtail_keyword);
          //Check for duplicates
          LongtailModel.find({ longtail_keyword: { $regex : sanitizedKeyword, $options: 'i'}})
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
            }
            
          })
        }
      })
      
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const BATCH_SIZE = 100; // Adjust the batch size as needed

async function run_longtail_scrapper() {
  getCurrentTime();
  try {
    const data = await PagesModel.find({}).lean().exec();
    const totalRecords = data.length;
    let processedCount = 0;

    for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async dt => {
          // Check if id exists in page_ids collection
          const idsData = await IdsModel.find({ page_id: dt._id }).lean().exec();

          if (idsData.length === 0) {
            await getLongtailFromScrappedDataInDb(dt.page_html);

            await IdsModel.create({ page_id: dt._id });
            console.log("Page Id saved - " + dt._id);
          }
        })
      );

      processedCount += batch.length;
      console.log(`Processed ${processedCount} out of ${totalRecords}`);
    }

    console.log("All records processed.");
  } catch (error) {
    console.error("Error:", error);
  }
}

//run_longtail_scrapper();

function getCurrentTime(){
  const currentDate = new Date();

  // Get the individual components
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  const seconds = currentDate.getSeconds();

  // Format the components as HH:MM:SS
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  console.log(formattedTime);
}

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


        res.status(200).json(nonDuplicates);
      }else{
        res.status(404).json(`No longtail keyword associated with ${req.params.keyword}.`);
      }
      
      })
  }
  catch(error){
    console.log("Error retrieving data" + error);
    res.status(500).send('Internal Server Error');
  }
     
})

module.exports = app;

