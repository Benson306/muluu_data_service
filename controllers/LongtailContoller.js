const axios = require('axios');
const natural = require('natural');
const { TfIdf } = natural;
let express =  require('express');
const cheerio = require('cheerio');

const stopwords = require('natural').stopwords;

let app =  express.Router();

// async function scrapeKeywords(url, targetKeyword) {
//     try {
//       const response = await axios.get(url);
//       const html = response.data;
//       const $ = cheerio.load(html);
  
//       const allText = $('body').text();
//       const words = allText.split(/\s+/); // Split text into words
  
//       const keywordMap = new Map();
  
//       // Count occurrences of words containing the target keyword as a substring
//       words.forEach(word => {
//         const sanitizedWord = word.toLowerCase().replace(/[^\w\s]/gi, ''); // Remove non-alphanumeric characters
//         if (sanitizedWord.includes(targetKeyword) && sanitizedWord !== targetKeyword) {
//           if (keywordMap.has(sanitizedWord)) {
//             keywordMap.set(sanitizedWord, keywordMap.get(sanitizedWord) + 1);
//           } else {
//             keywordMap.set(sanitizedWord, 1);
//           }
//         }
//       });
  
//       const sortedKeywords = Array.from(keywordMap.entries()).sort((a, b) => b[1] - a[1]);
  
//       console.log(`Long-tail keywords related to "${targetKeyword}":`);
//       sortedKeywords.forEach(([keyword, count]) => {
//         console.log(`${keyword} (${count} occurrences)`);
//       });
//     } catch (error) {
//       console.error('Error scraping the web page:', error);
//     }
//   }
  
//   const targetUrl = 'https://moz.com';
  

app.get('/longtail/:keyword', (req, res)=>{
        //scrapeKeywords(targetUrl, req.params.keyword);

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

            // tfidf.listTerms(0).forEach(term =>{
            //     if(term.term.length >= 4 && term.term.includes(searchTerm)){
            //         keywords.push(term.term);
            //     }
            // })

            // const completeLongtailKeyword = [];
            
            // for(let i = 0; i < keywords.length; i++){
            //     for(let j = i + 1; j < keywords.length; j++){
            //         const phrase = `${keywords[i]} ${keywords[j]}`;
            //         completeLongtailKeyword.push(phrase);
            //     }
            // }
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

            res.json(keywords);
        })
        .catch(error => {
            console.error('Error scraping data:', error);
        });


})

module.exports = app;