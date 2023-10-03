let mongoose = require('mongoose');

let express = require('express');
let app = express.Router();

let bodyParser = require('body-parser');

let urlEncoded = bodyParser.urlencoded({ extended: false});

let unirest = require('unirest');

function twitter_data(keyword, callback){
    //instagram
    unirest('GET', 'https://twitter-v23.p.rapidapi.com/Search/')
    .headers({
        'content-type': 'application/json',
        'X-RapidAPI-Key':  `${process.env.TWITTER_V2_API_KEY}`,
        'X-RapidAPI-Host': 'twitter-v23.p.rapidapi.com'
    })
    .query(`q=${keyword}`)
    .end(response => {  
        callback(response.body);
    })
}

function instagram_data(keyword, callback){
    //instagram
    unirest('POST', 'https://rocketapi-for-instagram.p.rapidapi.com/instagram/search')
    .headers({
        'content-type': 'application/json',
        'X-RapidAPI-Key': `${process.env.ROCKET_API_KEY_INSTAGRAM}`,
        'X-RapidAPI-Host': 'rocketapi-for-instagram.p.rapidapi.com'
    })
    .send(JSON.stringify({
        "query":`${keyword}`
    }))
    .end(response => {
        
        //Instagram Hastags - response.body.response.body.hashtags
        //Instagram Users - response.body.response.body.users

        callback(response.body.response.body)
    })
}

app.post('/socials/:keyword', urlEncoded, (req, res)=>{
    let keyword = req.params.keyword;
    let data = {};

    instagram_data(keyword, (insta_response)=>{
        data.instagram = insta_response;
        twitter_data(keyword, (x_response)=>{
            data.x = x_response;
            res.json(data.x);
        })
    })


})

module.exports = app;