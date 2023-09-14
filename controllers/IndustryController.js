let express =  require('express');
let app =  express.Router();
const bodyParser = require('body-parser');
const IndustryModel = require('../models/IndustryKeywordsModel');

const urlEncoded = bodyParser.urlencoded({ extended: false })

app.post('/add_multiple_industries', urlEncoded, (req, res)=>{
    req.body.data.map( data =>{
        IndustryModel(data).save()
        .then(()=>{
            //console.log(`${data.industry} industry saved`);
        })
    })
    res.json('Industries Added');
    
})

app.post('/add_single_industry', urlEncoded, (req, res)=>{
        IndustryModel(req.body).save()
        .then(()=>{
            res.json('Industry Added');
        })
})
    
module.exports = app;