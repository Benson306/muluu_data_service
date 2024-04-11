let express = require('express');
let app = express.Router();

let bodyParser = require('body-parser');

let urlEncoded = bodyParser.urlencoded({ extended: false});

let unirest = require('unirest');
const TiktokModel = require('../models/TiktokModel');
const LinkedinModel = require('../models/LinkedinModel');
const TwitterModel = require('../models/TwitterModel');
const InstagramModel = require('../models/InstagramModel');

// Sort Posts
function comparePosts(a, b) {
    // Handle null values by treating them as 0
    const aTotal = (a.reactionsCount || 0) + (a.commentsCount || 0);
    const bTotal = (b.reactionsCount || 0) + (b.commentsCount || 0);

    // Sort in descending order
    return bTotal - aTotal;
}

function compareHashtags(a, b) {
    // Handle null values by treating them as 0
    const aTotal = (a.use_count || 0) + (a.view_count || 0);
    const bTotal = (b.use_count || 0) + (b.view_count || 0);

    // Sort in descending order
    return bTotal - aTotal;
}

function tiktok_data(keyword, count, callback){
    unirest('GET', 'https://tokapi-mobile-version.p.rapidapi.com/v1/search/post')
    .headers({
        'X-RapidAPI-Key':  `${process.env.RAPID_API_KEY}`,
        'X-RapidAPI-Host': 'tokapi-mobile-version.p.rapidapi.com'
    })
    .query(`keyword=${keyword}`)
    .query(`count=${count}`)
    .end( response =>{
        if(!response.body.message){
            let data = {};
            let hashtags = [];
            let newArray = [];
            response.body.search_item_list.forEach( data => {
                let obj = { };
                obj.url = data.aweme_info.share_url;
                obj.post = data.aweme_info.search_desc;
                obj.username = data.aweme_info.author.nickname;
                obj.user_id = data.aweme_info.author.uid;
                let post_hashtags = data.aweme_info.desc.match(/#\w+/g);
                if (post_hashtags !== null) {
                    hashtags.push(...post_hashtags);
                }
                newArray.push(obj)
            })
            const uniqueHashtags = [];
            for (const item of hashtags) {
                if (!uniqueHashtags.includes(item) ) {
                    if(item.includes(keyword) && item.length > 4){
                        uniqueHashtags.push(item);
                    }
                }
            }
            let maxHashtags = uniqueHashtags.slice(0, count);
            let completeHashtags = [];
            let promises = [];
            //Get Hashtag View count
            maxHashtags.forEach((hashtag)=>{
                let cleanHashtag = hashtag.substring(1);
                let promise = new Promise((resolve, reject) => {
                    unirest('GET', 'https://tokapi-mobile-version.p.rapidapi.com/v1/search/hashtag')
                    .headers({
                        'X-RapidAPI-Key':  `${process.env.RAPID_API_KEY}`,
                        'X-RapidAPI-Host': 'tokapi-mobile-version.p.rapidapi.com'
                    })
                    .query(`keyword=${cleanHashtag}`)
                    .query('count=1')
                    .end( response =>{
                        let use_count = response.body.challenge_list[0].challenge_info.use_count;
                        let view_count = response.body.challenge_list[0].challenge_info.view_count;
                        let newHashtagData = { }
                        newHashtagData.hashtag = hashtag;
                        newHashtagData.use_count = use_count;
                        newHashtagData.view_count = view_count;
                        completeHashtags.push(newHashtagData);
                        resolve();
                    });
                })
                promises.push(promise)
            })
    
            Promise.all(promises)
            .then(() => {
                data.hashtags = completeHashtags.sort(compareHashtags);
                data.posts = newArray;
                callback(data, false);
            })
            .catch((error) => {
                console.error("Error fetching hashtag data:", error);
            });
        }else{
            callback(`Failed to fetch: ${response.body.message}`, true)
        }
        
    })

}

app.post("/tiktok_social", urlEncoded, (req, res)=>{
    let keyword = req.body.keyword.toLowerCase();
    let count = req.body.count;
    let data = {};
    let currentDate  = new Date();
    data.keyword = keyword;
    data.timestamp = currentDate;

    // Find if it has been queried recently
    TiktokModel.findOne({ keyword : keyword})
    .then(response =>{
    
        try{  
            if(response){
                let dataTimestamp = new Date(response.timestamp);

                // Calculate the difference in months
                let monthDifference = (dataTimestamp.getFullYear() - currentDate.getFullYear()) * 12 + (dataTimestamp.getMonth() - currentDate.getMonth());

                if(monthDifference < -2){

                    tiktok_data(keyword, count, (result, err)=>{
                        if(!err){
                            data.result = result;
                            TiktokModel.findByIdAndDelete({ _id: response._id})
                            .then(()=>{
                                TiktokModel(data).save()
                                .then(()=>{
                                    res.status(200).json(data);
                                })
                            })
                        }else{
                            res.status(500).json(result)
                        }
                    }) 
                }else{
                    res.status(200).json(response)
                }
            }else{
                tiktok_data(keyword, count, (result, err)=>{
                    if(!err){
                        data.result = result;
                        TiktokModel(data).save()
                        .then(()=>{
                            res.status(200).json(data);
                        })
                    }else{
                        res.status(500).json(result)
                    }
                })
            }
        }
        catch(err){
            res.status(500).json('Rate Limit exceeded');
        }

    })
});

function twitter_data(keyword, count, callback){
    unirest('GET', 'https://twitter-api45.p.rapidapi.com/search.php')
    .headers({
        'content-type': 'application/json',
        'X-RapidAPI-Key':  `${process.env.RAPID_API_KEY}`,
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
            obj.replies = tweet.replies;
            obj.retweets = tweet.retweets;
            obj.quotes = tweet.quotes;
            obj.bookmarks = tweet.bookmarks;
            obj.favorites = tweet.favorites;
            obj.totalEngagements = tweet.replies + tweet.retweets + tweet.quotes + tweet.bookmarks + tweet.favorites
            let post_hashtags = tweet.text.match(/#\w+/g);
            if (post_hashtags !== null) {
                post_hashtags.map( htg => {
                    let newPostHashtag = {
                        htg,
                        use_count: obj.totalEngagements
                    }
                    hashtags.push(newPostHashtag);
                })
            }
            posts.push(obj);
        })
        const uniqueHashtags = [];
        for (const item of hashtags) {
            if (!uniqueHashtags.includes(item)) {
                uniqueHashtags.push(item);
            }
        }
        let maxHastags = uniqueHashtags.slice(0, count);

        let data = { };
        data.posts = posts.sort((a, b) => b.totalEngagements - a.totalEngagements);
        data.hashtags = maxHastags.sort((a, b) => b.use_count - a.use_count);
        callback(data);
    })
}

app.post("/twitter_social", urlEncoded, (req, res)=>{
    let keyword = req.body.keyword.toLowerCase();
    let count = req.body.count;
    let data = {};
    let currentDate  = new Date();
    data.keyword = keyword;
    data.timestamp = currentDate;

    // Find if it has been queried recently
    TwitterModel.findOne({ keyword : keyword})
    .then(response =>{
    
        try{  
            if(response){
                let dataTimestamp = new Date(response.timestamp);

                // Calculate the difference in months
                let monthDifference = (dataTimestamp.getFullYear() - currentDate.getFullYear()) * 12 + (dataTimestamp.getMonth() - currentDate.getMonth());

                if(monthDifference < -2){

                    twitter_data(keyword, count, (result)=>{
                        data.result = result;

                        TwitterModel.findByIdAndDelete({ _id: response._id})
                        .then(()=>{
                            TwitterModel(data).save()
                            .then(()=>{
                                res.status(200).json(data);
                            })
                        })
                    }) 
                }else{
                    res.status(200).json(response)
                }
            }else{
                twitter_data(keyword, count, (result)=>{
                    data.result = result;

                    TwitterModel(data).save()
                    .then(()=>{
                        res.status(200).json(data);
                    })
                })
            }
        }
        catch(err){
            res.status(500).json('Rate Limit exceeded');
        }

    })
});

function instagram_data(keyword, count, callback){
    unirest('POST', 'https://rocketapi-for-instagram.p.rapidapi.com/instagram/search')
    .headers({
        'content-type': 'application/json',
        'X-RapidAPI-Key': `${process.env.RAPID_API_KEY}`,
        'X-RapidAPI-Host': 'rocketapi-for-instagram.p.rapidapi.com'
    })
    .send(JSON.stringify({
        "query":`${keyword}`
    }))
    .end(response => {
        console.log(response.error)
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
        let maxHashtags = uniqueHashtags.slice(0, count);
        let completeHashtags = [];
        let promises = [];

        maxHashtags.forEach((hashtag)=>{
            let cleanHashtag = hashtag.substring(1);
            let promise = new Promise((resolve, reject)=>{
                unirest('POST', 'https://rocketapi-for-instagram.p.rapidapi.com/instagram/hashtag/get_info')
                .headers({
                    'content-type': 'application/json',
                    'X-RapidAPI-Key':  `${process.env.RAPID_API_KEY}`,
                    'X-RapidAPI-Host': 'rocketapi-for-instagram.p.rapidapi.com'
                })
                .send({
                    name: cleanHashtag
                })
                .end( response => {
                    let view_count = response.body.response.body.count;
                    let newTag = { }
                    newTag.hashtag = hashtag;
                    newTag.view_count = view_count;
                    completeHashtags.push(newTag); 
                    resolve();
                })
            });
            promises.push(promise);
        })

        Promise.all(promises)
        .then(() => {
            data.users = users;
            data.hashtags = completeHashtags.sort((a, b) => b.view_count - a.view_count);
            callback(data); 
        })
        .catch((error) => {
            console.error("Error fetching hashtag data:", error);
        });
            
    })
}

app.post("/instagram_social", urlEncoded, (req, res)=>{
    let keyword = req.body.keyword.toLowerCase();
    let count = req.body.count;
    let data = {};
    let currentDate  = new Date();
    data.keyword = keyword;
    data.timestamp = currentDate;

    // Find if it has been queried recently
    InstagramModel.findOne({ keyword : keyword})
    .then(response =>{
    
        try{  
            if(response){
                let dataTimestamp = new Date(response.timestamp);

                // Calculate the difference in months
                let monthDifference = (dataTimestamp.getFullYear() - currentDate.getFullYear()) * 12 + (dataTimestamp.getMonth() - currentDate.getMonth());

                if(monthDifference < -2){

                    instagram_data(keyword, count, (result)=>{
                        data.result = result;

                        InstagramModel.findByIdAndDelete({ _id: response._id})
                        .then(()=>{
                            InstagramModel(data).save()
                            .then(()=>{
                                res.status(200).json(data);
                            })
                        })
                    }) 
                }else{
                    res.status(200).json(response)
                }
            }else{
                instagram_data(keyword, count, (result)=>{
                    data.result = result;

                    InstagramModel(data).save()
                    .then(()=>{
                        res.status(200).json(data);
                    })
                })
            }
        }
        catch(err){
            res.status(500).json('Rate Limit exceeded');
        }

    })
});

function linkedin_data(keyword, count, callback){
    unirest('GET', 'https://linkedin-public-search.p.rapidapi.com/postsearch')
    .headers({
        'X-RapidAPI-Key':  `${process.env.RAPID_API_KEY}`,
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
            data.posts = posts.sort(comparePosts);
    
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

app.post("/linkedin_social", urlEncoded, (req, res)=>{
    let keyword = req.body.keyword.toLowerCase();
    let count = req.body.count;
    let data = {};
    let currentDate  = new Date();
    data.keyword = keyword;
    data.timestamp = currentDate;

    // Find if it has been queried recently
    LinkedinModel.findOne({ keyword : keyword})
    .then(response =>{
    
        try{  
            if(response){
                let dataTimestamp = new Date(response.timestamp);

                // Calculate the difference in months
                let monthDifference = (dataTimestamp.getFullYear() - currentDate.getFullYear()) * 12 + (dataTimestamp.getMonth() - currentDate.getMonth());

                if(monthDifference < -2){

                    linkedin_data(keyword, count, (result)=>{
                        data.result = result;

                        LinkedinModel.findByIdAndDelete({ _id: response._id})
                        .then(()=>{
                            LinkedinModel(data).save()
                            .then(()=>{
                                res.status(200).json(data);
                            })
                        })
                    }) 
                }else{
                    res.status(200).json(response)
                }
            }else{
                linkedin_data(keyword, count, (result)=>{
                    data.result = result;

                    LinkedinModel(data).save()
                    .then(()=>{
                        res.status(200).json(data);
                    })
                })
            }
        }
        catch(err){
            res.status(500).json('Rate Limit exceeded');
        }

    })
});

app.get('/get-image/:url', async (req, res) => {
    try {
      const imageUrl = req.params.url;
      
      const response = await fetch(imageUrl);
      const imageBuffer = await response.buffer();
  
      res.set('Content-Type', 'image/jpeg');
      res.send(imageBuffer);
    } catch (error) {
      res.status(500).send('Error fetching image');
    }
});

module.exports = app;