let express =  require('express');
let app =  express.Router();
const unirest = require('unirest');
const bodyParser = require('body-parser');
const KeywordsCompetitionModel = require('../models/KeywordCompetitionModel');
const urlEncoded = bodyParser.urlencoded({ extended: false });

app.post('/keyword_competition', urlEncoded, (req, res)=>{
    let keyword = req.body.keyword;
    let country = req.body.country;
    let results = { };

    KeywordsCompetitionModel.findOne({ $and: [{keyword: keyword}, {country: country}]})
    .then(data => {
        if(data){
            res.json(data);
        }else{
            const request = unirest('GET', 'https://seo-keyword-research.p.rapidapi.com/keynew.php');
            request.query({
                keyword: keyword,
                country: country,
            });
            request.headers({
                'X-RapidAPI-Key': `${process.env.NEW_KEY}`,
                'X-RapidAPI-Host': 'seo-keyword-research.p.rapidapi.com'
            });
            request.end(function (response) {
                if (response.error){
                    console.log(response.error)
                    res.status(400).json('Failed');
                }

                results.keyword = keyword;                   
                results.country = country;
                if(response.body.length > 5){
                    results.result = response.body.slice(0 , 11);
                }else{
                    results.result = response.body;
                }

                KeywordsCompetitionModel(results).save()
                .then(newData => {
                    res.json(newData);
                })
                .catch(err => {
                    res.status(400).json('failed');
                })

            });
        }
    })
    .catch(err => {
        res.status(400).json('Failed');
    })

    
})

module.exports = app;
