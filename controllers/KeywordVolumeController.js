let express =  require('express');
let app =  express.Router();
const unirest = require('unirest');
const bodyParser = require('body-parser');
const KeywordVolumeModel = require('../models/KeywordVolumeModel');
const urlEncoded = bodyParser.urlencoded({ extended: false})

function getAPIToken(callback){
    const request = unirest("POST", "https://app.boostramp.com/api/login.php")
    request.field("key",`${process.env.BOOSTRAMP_API_KEY}`)
    request.end( function(res){
        if (res.error) throw new Error(res.error); 
        callback(res.raw_body);
    })
}

app.post('/keyword_volume', urlEncoded,  (req, res)=>{
    let keyword  = req.body.keyword;
    let location = req.body.country;

    let countryCode = 2404;

    KeywordVolumeModel.findOne({ keyword: keyword})
    .then( async savedData => {
        if(savedData){
            res.json(savedData)
        }else{
            try {
                const token = await new Promise((resolve, reject) => {
                    getAPIToken((key) => {
                        const newToken = JSON.parse(key);
                        resolve(newToken.token);
                    });
                }); 
        
        
                let request = unirest("POST", `https://app.boostramp.com/api/tools.php?token=${token}&func=getKeywordsClassic`)
                request.field("keyword", keyword)
                request.field("location", countryCode)
                request.end(function (response){
                    if (response.error) {
                        res.status(500).json("Failed to fetch")
                    };
        
                    const result = JSON.parse(response.raw_body);
                    const newResult = JSON.parse(result);
                    
                    const completeResult = {};
                    completeResult.keyword = keyword;
                    completeResult.keywords = newResult.keywords;

                    KeywordVolumeModel(completeResult).save()
                    .then( savedResult => {
                       res.json(savedResult);
                    } )
                    .catch(err => {
                        res.status(500).json("Error saving data")
                    })
                    
                })
            } catch (error) {
                res.status(500).json({ error: 'Failed to retrieve API token' });
            }
        }
    })


    
})

module.exports = app;