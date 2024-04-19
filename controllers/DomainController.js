let express =  require('express');
let app =  express.Router();
const unirest = require('unirest');
const bodyParser = require('body-parser');
const KeywordsRankingInDomainModel = require('../models/KeywordRankingInDomainModel');
const BacklinksModel = require('../models/BacklinksModel');
const WebsiteTrafficModel = require('../models/WebsiteTrafficModel');
const PageSEOModel = require('../models/PageSEOModel');
const CompetitorRankingModel = require('../models/CompetitorRanking');
const urlEncoded = bodyParser.urlencoded({ extended: false });

// app.post('/keywords_ranking_in_domain', urlEncoded, (req, res)=>{
//     let domain = req.body.domain;
//     let results = { }
//     KeywordsRankingInDomainModel.findOne({ domain : domain})
//     .then(data =>{
//         if(data){
//             res.json(data);
//         }else{
//             const request = unirest('GET', 'https://seo-website-ranking-keywords.p.rapidapi.com/');
//             request.query({
//                 domain: domain,
//             });
//             request.headers({
//                 'X-RapidAPI-Key': `${process.env.RAPID_API_KEY}`,
//                 'X-RapidAPI-Host': 'seo-website-ranking-keywords.p.rapidapi.com'
//             });
//             request.end(function (response) {
//                 if (response.error){
//                     res.status(400).json('Failed');
//                 }else{
//                     results.domain = domain;
//                     if(response.body.keywords.length > 10){
//                         results.keywords = response.body.keywords.slice(1, 11);
//                     }else{
//                         results.keywords = response.body.keywords;
//                     }
    
//                     KeywordsRankingInDomainModel(results).save()
//                     .then(newData => {
//                         res.json(newData);
//                     })
//                     .catch(err => {
//                         res.status(400).json('failed');
//                     })
//                 }
//             });
//         }
//     })
// })

function getAPIToken(callback){
    const request = unirest("POST", "https://app.boostramp.com/api/login.php")
    request.field("key",`${process.env.BOOSTRAMP_API_KEY}`)
    request.end( function(res){
        if (res.error) throw new Error(res.error);
        callback(res.raw_body);
    })
}

app.post('/backlinks', urlEncoded, (req, res)=>{
    let domain = req.body.domain;
    let results = { }
    BacklinksModel.findOne({ domain : domain})
    .then(async data =>{
        if(data){
            res.json(data);
        }else{
            const token = await new Promise((resolve, reject) => {
                getAPIToken((key) => {
                    const newToken = JSON.parse(key);
                    resolve(newToken.token);
                });
            }); 

            let request = unirest("POST", `https://app.boostramp.com/api/tools.php?token=${token}&func=getBacklinks`)
            request.field("domain", domain)
            request.end(function (response){
                if (response.error || response.body.error) {
                    res.status(500).json(`Failed to fetch ${response.error || response.body.error}`)
                }else{
                    const result = JSON.parse(response.body);

                    const completeResult = {};
                    completeResult.domain = domain;
                    completeResult.result = result;
    
                    BacklinksModel(completeResult).save()
                    .then(newData => {
                        res.json(newData);
                    })
                    .catch(err => {
                        res.status(400).json('failed');
                    })
                }
            })

            // const request = unirest('GET', 'https://seo-api-get-backlinks.p.rapidapi.com/backlinks.php');
            // request.query({
            //     domain: domain,
            // });
            // request.headers({
            //     'X-RapidAPI-Key': `${process.env.RAPID_API_KEY}`,
            //     'X-RapidAPI-Host': 'seo-api-get-backlinks.p.rapidapi.com'
            // });
            // request.end(function (response) {
            //     if (response.error){
            //         console.log(response.body)
            //         res.status(400).json('Failed');
            //     }

            //     results.domain = domain;
            //     let cleanJson = JSON.parse(response.body);

            //     if(cleanJson.backlinks.length > 10){
            //         results.backlinks = cleanJson.backlinks.slice(1, 11);
            //     }else{
            //         results.backlinks = cleanJson.backlinks;
            //     }

            //     BacklinksModel(results).save()
            //     .then(newData => {
            //         res.json(newData);
            //     })
            //     .catch(err => {
            //         res.status(400).json('failed');
            //     })

            // });
        }
    })
})


app.post('/website_traffic', urlEncoded, async (req, res)=>{
    let domain  = req.body.domain;
    let language_code = "en";

    WebsiteTrafficModel.findOne({ domain : domain})
    .then(async data =>{
        if(data){
            res.json(data);
        }else{
            const token = await new Promise((resolve, reject) => {
                getAPIToken((key) => {
                    const newToken = JSON.parse(key);
                    resolve(newToken.token);
                });
            });

            let request = unirest("POST", `https://app.boostramp.com/api/tools.php?token=${token}&func=getWebsiteTraffic`)
            request.field("domain", domain)
            request.field("language_code", language_code)
            request.field("location_code", 2404)
            request.end(function (response){
                if (response.error || response.body.error) {
                    res.status(500).json(`Failed to fetch ${response.error || response.body.error}`)
                }else{
                    const result = JSON.parse(response.body);
                
                    const completeResult = {};
                    completeResult.domain = domain;
                    completeResult.result = result;
    
                    WebsiteTrafficModel(completeResult).save()
                    .then(newData => {
                        res.json(newData);
                    })
                    .catch(err => {
                        res.status(400).json('failed');
                    })
                }
                  
            })
        }
    })    
})

app.post('/page_seo', urlEncoded, (req, res)=>{
    let domain  = req.body.domain;

    PageSEOModel.findOne({ domain : domain})
    .then(async data =>{
        if(data){
            res.json(data);
        }else{
            const token = await new Promise((resolve, reject) => {
                getAPIToken((key) => {
                    const newToken = JSON.parse(key);
                    resolve(newToken.token);
                });
            });

            let request = unirest("POST", `https://app.boostramp.com/api/tools.php?token=${token}&func=pageSEOCheck`)
            request.field("url", domain)
            request.end(function (response){
                if (response.error || response.body.error) {
                    res.status(500).json(`Failed to fetch ${response.error || response.body.error}`)
                }else{               
                    const completeResult = {};
                    completeResult.domain = domain;
                    completeResult.result = response.body;
    
                    PageSEOModel(completeResult).save()
                    .then(newData => {
                        res.json(newData);
                    })
                    .catch(err => {
                        res.status(400).json('failed');
                    })
                }
                  
            })
        }
    })
})

app.post('/competitors_ranking', urlEncoded , (req, res)=>{
    let domain = req.body.domain;

    CompetitorRankingModel.findOne({ domain: domain})
    .then(async( data) =>{
        if(data){
            res.json(data);
        }else{
            const token = await new Promise((resolve, reject) => {
                getAPIToken((key) => {
                    const newToken = JSON.parse(key);
                    resolve(newToken.token);
                });
            });
        
            let request = unirest("POST", `https://app.boostramp.com/api/tools.php?token=${token}&func=getCompetitorsRanking`)
            request.field("country", 2404)
            request.field("domain", domain)
            request.end(function (response){
                if (response.error || response.body.error) {
                    res.status(500).json(`Failed to fetch ${response.error || response.body.error}`)
                }else{              
                    const completeResult = {};
                    completeResult.domain = domain;
                    completeResult.result = JSON.parse(response.body);
        
                    CompetitorRankingModel(completeResult).save()
                    .then(newData => {
                        res.json(newData);
                    })
                    .catch(err => {
                        res.status(400).json('failed');
                    })
                }
                    
            });
        }
    })
    
    
})

app.post('/keywords_ranking_in_domain', urlEncoded , (req, res)=>{
    let domain = req.body.domain;

    KeywordsRankingInDomainModel.findOne({ domain : domain})
    .then(async data =>{
        if(data){
            res.json(data);
        }else{
            const token = await new Promise((resolve, reject) => {
                getAPIToken((key) => {
                    const newToken = JSON.parse(key);
                    resolve(newToken.token);
                });
            });
        
            let request = unirest("POST", `https://app.boostramp.com/api/tools.php?token=${token}&func=getWebsiteKeywords`)
            request.field("country", 2404)
            request.field("domain", domain)
            request.end(function (response){
                if (response.error || response.body.error) {
                    res.status(500).json(`Failed to fetch ${response.error || response.body.error}`)
                }else{               
                    const completeResult = {};
                    completeResult.domain = domain;
                    completeResult.result = JSON.parse(response.body);

                    KeywordsRankingInDomainModel(completeResult).save()
                    .then(newData => {
                        res.json(newData);
                    })
                    .catch(err => {
                        res.status(400).json('failed');
                    })
                }  
            })      
        }
    })
    
})

module.exports = app;