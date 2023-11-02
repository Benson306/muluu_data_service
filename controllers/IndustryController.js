let express =  require('express');
let app =  express.Router();
const bodyParser = require('body-parser');
const IndustryModel = require('../models/IndustryKeywordsModel');

const urlEncoded = bodyParser.urlencoded({ extended: false })

app.post('/add_industries', urlEncoded, (req, res)=>{
    try{
        req.body.map( data =>{
            IndustryModel(data).save()
            .then(()=>{
                //console.log(`${data.industry} industry saved`);
            })
        })

        res.status(200).json('Industries Added');
    }
    catch(err){
        res.status(500).json('Failed. Server Error');
    }   
    
})
    
module.exports = app;