let express = require('express');
let app = express.Router();

let bodyParser = require('body-parser');

let urlEncoded = bodyParser.urlencoded({ extended: false});

let unirest = require('unirest');
const SocialMediaModel = require('../models/SocialMediaModel');

function tiktok_data(keyword, count, callback){

    //unirest('GET', 'https://scraptik.p.rapidapi.com/search-posts')
    unirest('GET', 'https://tokapi-mobile-version.p.rapidapi.com/v1/search/post')
    .headers({
        'X-RapidAPI-Key':  `${process.env.NEW_TITOK_KEY}`,
        'X-RapidAPI-Host': 'tokapi-mobile-version.p.rapidapi.com'
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

            let post_hashtags = data.desc.match(/#\w+/g);

            if (post_hashtags !== null) {
                
                hashtags.push(...post_hashtags);
            }

            newArray.push(obj)
        })

        const uniqueHashtags = [];

        for (const item of hashtags) {
        if (!uniqueHashtags.includes(item)) {
            uniqueHashtags.push(item);
        }
        }
            
        // Get Hashtag View and use_count
        // uniqueHashtags.forEach((hashtag)=>{
        //     let cleanHashtag = hashtag.substring(1);
        //     unirest('GET', 'https://scraptik.p.rapidapi.com/search-hashtags')
        //     .headers({
        //         'X-RapidAPI-Key':  `${process.env.NEW_TITOK_KEY}`,
        //         'X-RapidAPI-Host': 'scraptik.p.rapidapi.com'
        //     })
        //     .query(`keyword=${cleanHashtag}`)
        //     .query('count=1')
        //     .end( response =>{
        //         console.log(`${hashtag} - ${response.body.challenge_list}`);
        //     });
        // })
        
        data.hashtags = uniqueHashtags;
        data.posts = newArray;
        callback(data);
    })

}

function linkedin_data(keyword, count, callback){
    unirest('GET', 'https://linkedin-public-search.p.rapidapi.com/postsearch')
    .headers({
        'X-RapidAPI-Key':  `${process.env.NEW_TITOK_KEY}`,
        'X-RapidAPI-Host': 'linkedin-public-search.p.rapidapi.com'
    })
    .query(`keyword=${keyword}`)
    .query(`count=${1}`)
    .end( response =>{
        let data = { }
        let posts = [];
        let users = [];

        if(response.body.dataCount > count){
            let linkedInPosts = response.body.result.slice(0, count);

            linkedInPosts.forEach( data => {
                let user_obj = { };
                
                user_obj.username = data.nameSurname;
                user_obj.profileTitle = data.profileTitle;
                user_obj.profileUrl = data.profileURL;
    
                users.push(user_obj)
    
                let post_obj = { }
                post_obj.postId = data.postID;
                post_obj.postDescription = data.postDescription;
                post_obj.reactionsCount = data.reactionCount;
                post_obj.commentsCount = data.commentCount;
                post_obj.postUrl = data.postUrl;
    
                posts.push(post_obj)
            })
    
            data.users = users;
            data.posts = posts;
    
            callback(data);
        }else{
            response.body.result.forEach( data => {
                let user_obj = { };
    
                user_obj.profileUrl = data.profileURL;
                user_obj.username = data.nameSurname;
                user_obj.profileTitle = data.profileTitle;
    
                users.push(user_obj)
    
                let post_obj = { }
                post_obj.postId = data.postID;
                post_obj.postDescription = data.postDescription;
                post_obj.reactionsCount = data.reactionCount;
                post_obj.commentsCount = data.commentCount;
                post_obj.postUrl = data.postUrl;
    
                posts.push(post_obj)
            })
    
            data.users = users;
            data.posts = posts;
    
            callback(data);
        }

       
    })
}

function twitter_data(keyword, count, callback){
    //instagram
    unirest('GET', 'https://twitter-api45.p.rapidapi.com/search.php')
    .headers({
        'content-type': 'application/json',
        'X-RapidAPI-Key':  `${process.env.TWITTER_V2_API_KEY}`,
        'X-RapidAPI-Host': 'twitter-api45.p.rapidapi.com'
    })
    .query(`query=${keyword}`)
    .end(response => {
        let hashtags = [];
        let posts = [];

        let tweets = response.body.timeline.slice(0, count);

        tweets.forEach(tweet =>{
            let obj  = { }
            obj.username = tweet.screen_name;
            obj.user_profile_pic = tweet.user_info.avatar;
            obj.post = tweet.text;

            let post_hashtags = tweet.text.match(/#\w+/g);
            
            if (post_hashtags !== null) {
                hashtags.push(...post_hashtags);
            }

            posts.push(obj);

        })

        const uniqueHashtags = [];

        for (const item of hashtags) {
            if (!uniqueHashtags.includes(item)) {
                uniqueHashtags.push(item);
            }
        }

        let data = { };
        data.hashtags = uniqueHashtags;
        data.posts = posts;

        callback(data);

    })
}

function instagram_data(keyword, count, callback){
    //instagram
    unirest('POST', 'https://rocketapi-for-instagram.p.rapidapi.com/instagram/search')
    .headers({
        'content-type': 'application/json',
        'X-RapidAPI-Key': `${process.env.NEW_TITOK_KEY}`,
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

        const uniqueHashtags = [];

        for (const item of hashtags) {
            if (!uniqueHashtags.includes(item)) {
                uniqueHashtags.push(item);
            }
        }

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

    let currentDate  = new Date();

    data.keyword = keyword;

    data.timestamp = currentDate;

    // Find if it has been queried recently
    SocialMediaModel.find({ keyword : keyword})
    .then(response =>{
        if(response.length > 0){
            let dataTimestamp = new Date(response[0].timestamp);

            // Calculate the difference in months
            let monthDifference = (dataTimestamp.getFullYear() - currentDate.getFullYear()) * 12 + (dataTimestamp.getMonth() - currentDate.getMonth());

            if(monthDifference < -2){
                // Data is more than two months old
                instagram_data(keyword, count, (insta_response)=>{
                    data.instagram = insta_response;
                    tiktok_data(keyword, count, (result)=>{
                        data.tiktok = result;
                        twitter_data(keyword, count, (x_response)=>{
                            data.x = x_response;
                            SocialMediaModel.findByIdAndDelete(response[0]._id)
                            .then(()=>{
                                // Save to DB
                                SocialMediaModel(data).save()
                                .then(()=>{
                                    res.json(data);
                                })
                            })
                            
                        })
                    })
                    
                })

            }else{
                res.json(response)
            }
        }else{
            instagram_data(keyword, count, (insta_response)=>{
                data.instagram = insta_response;
                tiktok_data(keyword, count, (result)=>{
                    data.tiktok = result;
                    twitter_data(keyword, count, (x_response)=>{
                        data.x = x_response;

                        linkedin_data(keyword, count, (linked_response)=>{
                            data.linkedIn = linked_response;
                            // Save to DB
                            SocialMediaModel(data).save()
                            .then(()=>{
                                res.json(data);
                            })
                        })
                        
                    })
                })
                
            })

        }
    })

    


})

module.exports = app;