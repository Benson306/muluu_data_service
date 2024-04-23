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

// function getAPIToken(callback){
//     const request = unirest("POST", "https://app.boostramp.com/api/login.php")
//     request.field("key",`${process.env.BOOSTRAMP_API_KEY}`)
//     request.end( function(res){
//         if (res.error) throw new Error(res.error);
//         callback(res.raw_body);
//     })
// }

// async function getAPIToken() {
//     return new Promise((resolve, reject) => {
//         const request = unirest("POST", "https://app.boostramp.com/api/login.php");
//         request.field("key",`${process.env.BOOSTRAMP_API_KEY}`);
//         request.end(function(res) {
//             if (res.error) {
//                 reject(res.error);
//             } else {
//                 const newToken = JSON.parse(res.raw_body);
//                 resolve(newToken.token);
//             }
//         });
//     });
// }

let cachedToken = null;
let tokenLock = false;

// Function to fetch the API token
async function getAPIToken() {
    if (cachedToken) {
        return cachedToken;
    } else {
        if (!tokenLock) {
            tokenLock = true;
            try {
                const newToken = await new Promise((resolve, reject) => {
                    const request = unirest("POST", "https://app.boostramp.com/api/login.php");
                    request.field("key", `${process.env.BOOSTRAMP_API_KEY}`);
                    request.end(function(res) {
                        if (res.error) {
                            reject(res.error);
                        } else {
                            const token = JSON.parse(res.raw_body).token;
                            resolve(token);
                        }
                    });
                });
                cachedToken = newToken;
                return newToken;
            } catch (error) {
                throw new Error("Failed to fetch API token.");
            } finally {
                tokenLock = false;
            }
        } else {
            // Wait for token to be fetched by another request
            await new Promise(resolve => setTimeout(resolve, 100));
            return getAPIToken();
        }
    }
}

function addHttpsToDomain(domain) {
    if (domain.startsWith("https://")) {
        return domain;
    } else if (domain.startsWith("http://")) {
        return "https://" + domain.substring(7);
    } else {
        return "https://" + domain;
    }
}

function removeHttpFromDomain(domain) {
    if (domain.startsWith("https://")) {
        return domain.substring(8);
    } else if (domain.startsWith("http://")) {
        return domain.substring(7);
    } else {
        return domain;
    }
}

app.post('/backlinks', urlEncoded, (req, res)=>{
    let domain = removeHttpFromDomain(req.body.domain);
    let results = { }
    BacklinksModel.findOne({ domain : domain})
    .then( async data =>{
        if(data){
            res.json(data);
        }else{
            // const token = await new Promise((resolve, reject) => {
            //     getAPIToken((key) => {
            //         const newToken = JSON.parse(key);
            //         resolve(newToken.token);
            //     });
            // }); 
            let token = await getAPIToken();

            let request = unirest("POST", `https://app.boostramp.com/api/tools.php?token=${token}&func=getBacklinks`)
            request.field("domain", domain)
            request.end(function (response){
                console.log({ type: "Backlinks",  token,  "data" : response.body})
                if (response.error || response.body.error || response.body == false) {
                    res.status(500).json(`Failed to fetch ${response.error || response.body.error || response.body == false}`)
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
        }
    })
})


app.post('/website_traffic', urlEncoded, async (req, res)=>{
    let domain  = removeHttpFromDomain(req.body.domain);
    let language_code = "en";

    WebsiteTrafficModel.findOne({ domain : domain})
    .then(async data =>{
        if(data){
            res.json(data);
        }else{
            // const token = await new Promise((resolve, reject) => {
            //     getAPIToken((key) => {
            //         const newToken = JSON.parse(key);
            //         resolve(newToken.token);
            //     });
            // });
            let token = await getAPIToken();

            let request = unirest("POST", `https://app.boostramp.com/api/tools.php?token=${token}&func=getWebsiteTraffic`)
            request.field("domain", domain)
            request.field("language_code", language_code)
            request.field("location_code", 2404)
            request.end(function (response){
                console.log({ type: "Website Traffic",  token, "data" : response.body})
                if (response.error || response.body.error || response.body == false) {
                    res.status(500).json(`Failed to fetch ${response.error || response.body.error || response.body == false}`)
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
    let domain  = addHttpsToDomain(req.body.domain);

    PageSEOModel.findOne({ domain : domain})
    .then(async data =>{
        if(data){
            res.json(data);
        }else{
            // const token = await new Promise((resolve, reject) => {
            //     getAPIToken((key) => {
            //         const newToken = JSON.parse(key);
            //         resolve(newToken.token);
            //     });
            // });
            let token = await getAPIToken();

            let request = unirest("POST", `https://app.boostramp.com/api/tools.php?token=${token}&func=pageSEOCheck`)
            request.field("url", domain)
            request.end(function (response){
                console.log({ type: "Page seo",  token, "data" : response.body})
                if (response.error || response.body.error || response.body == false) {
                    res.status(500).json(`Failed to fetch ${response.error || response.body.error || response.body == false}`)
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
    let domain = removeHttpFromDomain(req.body.domain);

    CompetitorRankingModel.findOne({ domain: domain})
    .then(async( data) =>{
        if(data){
            res.json(data);
        }else{
            // const token = await new Promise((resolve, reject) => {
            //     getAPIToken((key) => {
            //         const newToken = JSON.parse(key);
            //         resolve(newToken.token);
            //     });
            // });
            let token = await getAPIToken();
        
            let request = unirest("POST", `https://app.boostramp.com/api/tools.php?token=${token}&func=getCompetitorsRanking`)
            request.field("country", 2404)
            request.field("domain", domain)
            request.end(function (response){
                console.log({ type: "Competitor Ranking",  token, "data" : response.body})
                if (response.error || response.body.error || response.body == false) {
                    res.status(500).json(`Failed to fetch ${response.error || response.body.error || response.body == false}`)
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
    let domain = removeHttpFromDomain(req.body.domain);

    KeywordsRankingInDomainModel.findOne({ domain : domain})
    .then(async data =>{
        if(data){
            res.json(data);
        }else{
            // const token = await new Promise((resolve, reject) => {
            //     getAPIToken((key) => {
            //         const newToken = JSON.parse(key);
            //         resolve(newToken.token);
            //     });
            // });
            let token = await getAPIToken();
        
            let request = unirest("POST", `https://app.boostramp.com/api/tools.php?token=${token}&func=getWebsiteKeywords`)
            request.field("country", 2404)
            request.field("domain", domain)
            request.end(function (response){
                console.log({ type: "keywords_ranking_in_domain",  token, "data" : response.body})
                if (response.error || response.body.error || response.body == false) {
                    res.status(500).json(`Failed to fetch ${response.error || response.body.error || response.body == false}`)
                }else{               
                    const completeResult = {};
                    completeResult.domain = domain;
                    completeResult.result = JSON.parse(response.body);

                    if(completeResult.result.keywords.length < 1){
                        res.status(404).json("No keywords for this domain")
                    }else{
                        KeywordsRankingInDomainModel(completeResult).save()
                        .then(newData => {
                            res.json(newData);
                        })
                        .catch(err => {
                            res.status(400).json('failed');
                        })
                    }
                    
                }  
            })      
        }
    })
})

module.exports = app;