const express = require('express');
const router = express.Router();

// middleware qui permet d'authentifier les pages de l'application
const auth = require('../middleware/auth'); 
// middleware qui définit la destination et le nom de fichier des images
const multer = require('../middleware/multer-config'); 
const sauceCtrl = require('../controllers/sauce');

//appeler auth avant gestionnaire de route
//récuperer token d'identification + infos  et vérifier le tout 
router.post('/', auth, multer, sauceCtrl.createSauce);
router.put('/:id', auth, multer, sauceCtrl.modifySauce);
router.delete('/:id', auth, sauceCtrl.deleteSauce);
router.post('/:id/like', auth, sauceCtrl.likeDislikeSauce);
router.get('/', auth, sauceCtrl.getAllSauces);
router.get('/:id', auth, sauceCtrl.getOneSauce);

module.exports = router;


