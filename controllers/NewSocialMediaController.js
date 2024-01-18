let express =  require('express');

let app =  express.Router();

const unirest = require('unirest');

const bodyParser = require('body-parser');

const urlEncoded = bodyParser.urlencoded({ extended: false })

const NewSocialMediaModel = require('../models/NewSocialMediaModel');

app.post('/new_socials', urlEncoded, (req, res)=>{
    let keyword = req.body.keyword;
    let country= req.body.country;

    let data = {};

    let currentDate  = new Date();
    data.keyword = keyword;
    data.country = country;
    data.timestamp = currentDate;

    NewSocialMediaModel.find({ $and:[ {keyword: keyword}, {country: country} ] })
    .then(dbResponse =>{
        if(dbResponse.length > 0){
            let dataTimestamp = new Date(dbResponse[0].timestamp);

            // Calculate the difference in months
            let monthDifference = (dataTimestamp.getFullYear() - currentDate.getFullYear()) * 12 + (dataTimestamp.getMonth() - currentDate.getMonth());

            if(monthDifference < -2){
                // Data is more than two months old
                const request = unirest('GET', 'https://instagram-statistics-api.p.rapidapi.com/search');
                request.query({
                    page: '1',
                    perPage: '10',
                    q: keyword,
                    sort: '-score',
                    locations: country,
                    socialTypes: 'INST,FB,TW,TT',
                    trackTotal: 'true'
                });
                request.headers({
                    'X-RapidAPI-Key': `${process.env.NEW_KEY}`,
                    'X-RapidAPI-Host': 'instagram-statistics-api.p.rapidapi.com'
                });
                request.end(function (response) {
                    if (response.error){
                        console.log(response.error)
                        res.status(400).json('Failed');
                    } 
                    //throw new Error(response.error);

                    data.result = response.body.data;

                    NewSocialMediaModel.findByIdAndDelete(dbResponse[0]._id)
                    .then(()=>{
                        NewSocialMediaModel(data).save()
                        .then((newData)=>{
                            res.json(newData);
                        })
                        .catch(err => {
                            res.status(400).json('Failed');
                        })
                    })

                });
                
            }else{
                //Data is up to date
                res.json(dbResponse[0]);
            }

        }else{
                const request = unirest('GET', 'https://instagram-statistics-api.p.rapidapi.com/search');
                request.query({
                    page: '1',
                    perPage: '10',
                    q: keyword,
                    sort: '-score',
                    locations: country,
                    socialTypes: 'INST,FB,TW,TT',
                    trackTotal: 'true'
                });
                request.headers({
                    'X-RapidAPI-Key': `${process.env.TWITTER_V2_API_KEY}`,
                    'X-RapidAPI-Host': 'instagram-statistics-api.p.rapidapi.com'
                });
                request.end(function (response) {
                    if (response.error){
                        console.log(response.error)
                        res.status(400).json('Failed');
                    } 
                    //throw new Error(response.error);

                    data.result = response.body.data;

                    NewSocialMediaModel(data).save()
                    .then((newData)=>{
                        res.json(newData);
                    })
                    .catch(err => {
                        res.status(400).json('Failed');
                    })

                });
        }
    })

    
})

module.exports = app;