const axios = require('axios');
const natural = require('natural');
const { TfIdf } = natural;
let express =  require('express');
const cheerio = require('cheerio');

const stopwords = require('natural').stopwords;

let app =  express.Router();
  

app.get('/longtail', (req, res)=>{
        // Define the URL to scrape
        const url = 'https://moz.com/help';

        let searchTerm = req.params.keyword;
        
        // Initialize TF-IDF instance
        const tfidf = new TfIdf();

        // Fetch the data using axios
        axios.get(url)
        .then(response => {
            const scrapedData = response.data;

            const $ = cheerio.load(scrapedData);

            const textContent = $('p').text();

            // Tokenize the target keyword
            let tokenizer = new natural.WordTokenizer();
            const filteredTokens = tokenizer.tokenize(textContent);
            
            //Remove stopwords
            //const filteredTokens = tokens.filter(token => !stopwords.includes(token.toLowerCase()));

            // Add documents (text) to the TF-IDF instance
            tfidf.addDocument(filteredTokens);

            // Calculate TF-IDF for the target keyword
            const keywords = [];
            
            const MIN_KEYWORD_LENGTH = 4;
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
            
            keywords.map(phrase => {
              const words = phrase.split(' ');
                if(words.length > 3){
                  sensibleKeywords.push(phrase);
                }
            })

            res.json(sensibleKeywords);
        })
        .catch(error => {
            console.error('Error scraping data:', error);
        });


})

module.exports = app;