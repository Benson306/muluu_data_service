let express =  require('express');
let app =  express.Router();
const unirest = require('unirest');
const bodyParser = require('body-parser');
const urlEncoded = bodyParser.urlencoded({ extended: false})

function getAPIToken(callback){
    const request = unirest("POST", "https://app.boostramp.com/api/login.php")
    request.field("key",`${process.env.BOOSTRAMP_API_KEY}`)
    request.end( function(res){
        if (res.error) throw new Error(res.error); 
        callback(res.raw_body);
    })
}

app.post('/keyword_volume', urlEncoded, async (req, res)=>{
    let keyword  = req.body.keyword;
    let location = req.body.country;

    try {
        const token = await new Promise((resolve, reject) => {
            getAPIToken((key) => {
                const newToken = JSON.parse(key);
                resolve(newToken.token);
            });
        }); 


        //let request = unirest("POST", )

        res.json(token);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve API token' });
    }
})

module.exports = app;