const axios = require('axios');
const natural = require('natural');
const { TfIdf } = natural;
let express =  require('express');
const cheerio = require('cheerio');

const stopwords = require('natural').stopwords;

let app =  express.Router();

app.get('/longtail/:keyword', (req, res)=>{
        // Define the URL to scrape
        const url = 'https://moz.com/help';
        
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
            const tokens = tokenizer.tokenize(textContent);
            
            //Remove stopwords
            const filteredTokens = tokens.filter(token => !stopwords.includes(token.toLowerCase()));

            // Add documents (text) to the TF-IDF instance
            tfidf.addDocument(filteredTokens);

            // Calculate TF-IDF for the target keyword
            const keywords = [];

            tfidf.listTerms(0).forEach(term =>{
                if(term.term.length >= 4){
                    keywords.push(term.term);
                }
            })

            res.json(keywords);
        })
        .catch(error => {
            console.error('Error scraping data:', error);
        });


})

module.exports = app;


