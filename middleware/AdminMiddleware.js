const jwt = require('jsonwebtoken')

const requireA = (req,res,next) => {
    const {token} = req.body
    if (token){
        jwt.verify(token,'been working since the jump', (err,decodedToken) => {
            if(err){
                //use decodedToks
               
            }
            else{
                if(decodedToken.admin){
                    next()
                }
            }
        })
    }
}

module.exports = {requireA}

