const Sauce = require('../models/sauce');
const fs = require('fs');

//fonction pour créer une sauce POST
exports.createSauce = (req, res, next) => {
    //parser objet req sous forme json 
    const sauceObject = JSON.parse(req.body.sauce );
    //_id supprimer deux champs dans cette objet qui es généré automatiquement 
    //userID ne pas faire confiance au données envoyées par client => utiliser userID qui vient du token 
    delete sauceObject._id;
    delete sauceObject._userId;
    // un nouvel objet sauce est crée avec le model Sauce
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        // Génerer l'url de l'image enregistrée dans le dossier images du serveur 
        //url est  stockée dans la bdd
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    //enregistrer l'objet dans la BDD
    sauce.save()
    .then(() => { res.status(201).json({message: 'Objet Sauce crée '})})
    .catch(error => { res.status(400).json( { error })})
 };

//fonction pour modifier une sauce PUT
exports.modifySauce = (req, res, next) => {
//véifier si il y'a un champs file 
//récuperer l'objet en recréant l'url de l'image 
//sinon récupérer l'objet directement dans le corps de la req
const sauceObject = req.file ? {
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
} : { ...req.body };
//supprimer userid pour eviter qu'une personne crée un objet a son nom 
//puis l'attribut a quelqu'un d'autres => mesure de sécurité 
delete sauceObject._userId;
//chercher la donnée dans la BDD 
//pour vérifier si c'est bien user qui a crée la donnée => qui souhaite la modifié 
Sauce.findOne({_id: req.params.id})
    .then((sauce) => {
        //vérfier que ça appartient bien a l'ustilisateur qui envoie la req 
        if (sauce.userId != req.auth.userId) {
            res.status(401).json({ message : 'Non Autorisé'});
        } else {
            Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
            .then(() => res.status(200).json({message : 'Objet sauce modifié'}))
            .catch(error => res.status(401).json({ error }));
        }
    })
    .catch((error) => {
        res.status(400).json({ error });
    });
};
//fonction pour supprimer une sauce
exports.deleteSauce = (req, res, next) => {
    //récupérer la données en BDD
    //vérifier les droits de l'utilisateur 
    Sauce.findOne({ _id: req.params.id})
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({message: 'Non Autorisé'});
            } else {
                //récupérer le nom du fichier 
                const filename = sauce.imageUrl.split('/images/')[1];
                //méthode unlink de fs afin de supprimer l'image du dossier images
                fs.unlink(`images/${filename}`, () => {
                    //supprimer l'enregistrement dans la BDD
                    Sauce.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Objet sauce supprimé'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
 };

 //fonction pour récupérer toutes les sauces de la BDD
 exports.getAllSauces = (req, res) => {
    Sauce.find()
        .then(response => res.status(200).json(response))
        .catch(error => res.status(404).json({error}))
};

//fonction pour afficher une seule sauce sélectionnée 
// Lecture d'une sauce avec son ID (Get/:id)
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => res.status(200).json(sauce))
      .catch(error => res.status(404).json({ error }));
};

//fonction pour Définir le statut « Like » pour un userID
//like et dislike
exports.likeDislikeSauce = (req, res, next) => {    
    const like = req.body.like;
    /*le cas ou l'utilisatuer ajoute un like ou un dislike*/
    //Si like = 1 l'utilisateur aime (= like) la sauce
    //Utilisation du $PUSH => L'opérateur ajoute une valeur spécifiée à un tableau.
    if(like === 1) { 
        console.log('Like');
        Sauce.updateOne({_id: req.params.id}, { $push: { usersLiked: req.body.userId}, $inc: { likes: 1}})
        .then( () => res.status(200).json({ message: 'Like sauvegardé' }))
        .catch( error => res.status(400).json({ error}))

    } else if(like === -1) { 
        // Si like = -1 l'utilisateur n'aime pas (=dislike) la sauce
        Sauce.updateOne({_id: req.params.id}, { $push: { usersDisliked: req.body.userId},$inc: { dislikes: 1}  })
        .then( () => res.status(200).json({ message: 'Dislike sauvegardé' }))
        .catch( error => res.status(400).json({ error}))
        console.log('DISLike');


    } else {
        /* le cas ou l'utilisateur annule son like ou dislike*/
        // Si like = 0s
        Sauce.findOne( {_id: req.params.id})
        .then( sauce => {
            // Si le tableau "userliked" contient l'ID de l'utilisateur => Retirer like du tableau "userliked"
            //Utilisation du $PULL pour cette partie => L'opérateur supprime d'un tableau existant toutes les instances d'une valeur ou de valeurs qui correspondent à une condition spécifiée.
            if( sauce.usersLiked.indexOf(req.body.userId)!== -1){
                    console.log('suppLike');
                 Sauce.updateOne({_id: req.params.id}, { $pull: { usersLiked: req.body.userId}, $inc: { likes: -1}})
                .then( () => res.status(200).json({ message: 'Like Supprimé' }))
                .catch( error => res.status(400).json({ error}))
            }else if(sauce.usersDisliked.includes(req.body.userId)) {
                // Si le tableau "userDisliked" contient l'ID de l'utilisateur => Retirer dislike du tableau "userDisliked"
                console.log('suppDISLike');
                Sauce.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: req.body.userId }, $inc: { dislikes: -1 } })
                  .then((sauce) => { res.status(200).json({ message: 'Dislike Supprimé !' }) })
                  .catch(error => res.status(400).json({ error }))
            }      
        })
        .catch( error => res.status(400).json({ error}))             
    }   
};


