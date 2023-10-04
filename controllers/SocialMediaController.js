let mongoose = require('mongoose');

let express = require('express');
let app = express.Router();

let bodyParser = require('body-parser');

let urlEncoded = bodyParser.urlencoded({ extended: false});

let unirest = require('unirest');

function tiktok_data(keyword, count, callback){

    unirest('GET', 'https://scraptik.p.rapidapi.com/search-posts')
    .headers({
        'X-RapidAPI-Key':  `${process.env.TWITTER_V2_API_KEY}`,
        'X-RapidAPI-Host': 'scraptik.p.rapidapi.com'
    })
    .query(`keyword=${keyword}`)
    .query(`count=${count}`)
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

        const uniqueHashtags = [];

        for (const item of hashtags) {
        if (!uniqueHashtags.includes(item)) {
            uniqueHashtags.push(item);
        }
        }
        data.hashtags = uniqueHashtags;
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

function instagram_data(keyword, count, callback){
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
        let raw_users = response.body.response.body.users.slice(0, count);

        let users = [];

        raw_users.forEach( user =>{
            let obj = { };
            obj.user_id = user.user.pk_id;
            obj.fullname = user.user.full_name;
            obj.username = user.user.username;
            obj.profile_pic_url = user.user.profile_pic_url;
            users.push(obj);
        })

        let hashtags = [];
        response.body.response.body.hashtags.forEach(hashtag =>{
            hashtags.push("#"+hashtag.hashtag.name);
        })

        let data = { };

        data.users = users;
        data.hastags = hashtags;


        callback(data)
    })
}

app.post('/socials', urlEncoded, (req, res)=>{
    let keyword = req.body.keyword;
    let count = req.body.count;
    let data = {};

    instagram_data(keyword, count, (insta_response)=>{
        data.instagram = insta_response;
        tiktok_data(keyword, count, (result)=>{
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