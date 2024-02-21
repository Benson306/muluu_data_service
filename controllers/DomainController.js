let express =  require('express');
let app =  express.Router();
const unirest = require('unirest');
const bodyParser = require('body-parser');
const KeywordsRankingInDomainModel = require('../models/KeywordRankingInDomainModel');
const urlEncoded = bodyParser.urlencoded({ extended: false });

app.post('/keywords_ranking_in_domain', urlEncoded, (req, res)=>{
    let domain = req.body.domain;
    let results = { }
    KeywordsRankingInDomainModel.findOne({ domain : domain})
    .then(data =>{
        if(data){
            res.json(data);
        }else{
            const request = unirest('GET', 'https://seo-website-ranking-keywords.p.rapidapi.com/');
            request.query({
                domain: domain,
            });
            request.headers({
                'X-RapidAPI-Key': `${process.env.NEW_KEY}`,
                'X-RapidAPI-Host': 'seo-website-ranking-keywords.p.rapidapi.com'
            });
            request.end(function (response) {
                if (response.error){
                    console.log(response.error)
                    res.status(400).json('Failed');
                }

                results.domain = domain;
                if(response.body.keywords.length > 10){
                    results.keywords = response.body.keywords.slice(1, 11);
                }else{
                    results.keywords = response.body.keywords;
                }

                KeywordsRankingInDomainModel(results).save()
                .then(newData => {
                    res.json(newData);
                })
                .catch(err => {
                    res.status(400).json('failed');
                })

            });
        }
    })
})

module.exports = app;