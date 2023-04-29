const multer = require('multer');
//objet de format d'image
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

const storage = multer.diskStorage({
    //definir la destination 
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  //le nom de fichier a utilisé 
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    //appliquer extension au fichier qui correspond au mimetype
    const extension = MIME_TYPES[file.mimetype];
    //créer filename entier 
    callback(null, name + Date.now() + '.' + extension);
  }
});
//exporter middleware multer / single => fichier unique 
module.exports = multer({storage: storage}).single('image');