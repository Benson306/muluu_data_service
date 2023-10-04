let mongoose = require('mongoose');

let express = require('express');
let app = express.Router();

let bodyParser = require('body-parser');

let urlEncoded = bodyParser.urlencoded({ extended: false});

let unirest = require('unirest');

function tiktok_data(keyword, callback){

    unirest('GET', 'https://scraptik.p.rapidapi.com/search-posts')
    .headers({
        'X-RapidAPI-Key':  `${process.env.TWITTER_V2_API_KEY}`,
        'X-RapidAPI-Host': 'scraptik.p.rapidapi.com'
    })
    .query(`keyword=${keyword}`)
    .query('count=3')
    .end( response =>{
        let data = {};
        let hashtags = [];
        let newArray = [];
        response.body.aweme_list.forEach( data => {
            let obj = { };

            obj.url = data.share_url;
            obj.post = data.search_desc;
            obj.username = data.author.nickname;
            obj.user_id = data.author.uid;

            let post_hastags = data.desc.match(/#\w+/g);

            hashtags.push(...post_hastags);

            newArray.push(obj)
        })
        data.hashtags = hashtags;
        data.posts = newArray;
        callback(data);
    })

}

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

app.get('/socials/:keyword', urlEncoded, (req, res)=>{
    let keyword = req.params.keyword;
    let data = {};

    instagram_data(keyword, (insta_response)=>{
        data.instagram = insta_response;
        tiktok_data(keyword, (result)=>{
            data.tiktok = result;
            res.json(data)
        })
        // twitter_data(keyword, (x_response)=>{
        //     data.x = x_response;
        //     res.json(data.x);
        // })
    })


})

module.exports = app;