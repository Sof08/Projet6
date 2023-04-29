const jwt = require('jsonwebtoken');
 
module.exports = (req, res, next) => {
   try {
        //Récupérer token en enlevant la première partie bearer
       const token = req.headers.authorization.split(' ')[1];
       //décoder token (token + clé secrete)
       const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
       //recupérer userID 
       const userId = decodedToken.userId;
       //rajouter la valeur userID à l'objet auth pour transférer aux autres middleware ou gestionnaire de routes
       req.auth = {
           userId: userId
       };
	next();
   } catch(error) {
       res.status(401).json({ error });
   }
};