"use strict";
/* Util para encriptar el password del usuario */
var bcrypt = require('bcrypt-nodejs');
var fs=require('fs');

/**
 * Data Access Object (DAO) para 'users',
 * Debe ser construido con un objeto conectado a la
 * base de datos
 */
function UserDAO(db) {
  
  /**
   * Si el constructor es llamado sin el operador 'new',
   * muestra una advertencia y lo llama correctamente.
   */
  if (false == (this instanceof UserDAO)) {
    console.log('WARNING: UserDAO constructor called without "new" operator');
    return new UserDAO(db);
  }
  
  /* Colección 'users' en la base de datos */
  var users = db.collection('users');
  
  this.addUser = function (username, password, email,callback) {//pasar parametro imagen-avatar qui
    
    // Verificamos que el usuario no exista aun
    users.findOne({'_id': username}, function (err, user) {
      if (err) throw err;
      
      if (user) {
        var user_yet_exist_error = new Error('User yet exists');
        user_yet_exist_error.msg = "User yet exists"
        return callback(user_yet_exist_error, null);
      }
      else {
        
        // Generate password hash
        var salt = bcrypt.genSaltSync();
        var password_hash = bcrypt.hashSync(password, salt);
		/*
		var path_images='C:\nodejs\imagenes';
		var image_read=fs.createReadStream(fileAvatar);
		var image_write=fs.createWriteStream(path_images);
		image_read.pipe(image_write);
		//fs.unlinkSync(image_read);
		*/
		
			
		
		// Librería GridFS especializada para imagenes, blobs binarios, BSON  en MongoDB tipo BinData
		
		
        // Crear el nuevo 'user' con los parametros dados.
        var user = {'_id': username, 'password': password_hash, 'email': email};//añadir imagen aqui
    

		//var dataImage = fs.readFileSync(globalimage);	
		//console.log('IMAGEN EN BINaRIO:  '+dataImage);
		
        // Insertar el nuevo usuario en la base de datos
        users.insert(user, function (err, result) {
          if (err) return callback(err, null);
          
          console.log('Nuevo usuario creado');
          //return callback(null, result[0]);
		  //return callback(Error("Error user"),null);
		  return callback(null, result);
        });
      }
    });
  }
  
  this.validateLogin = function (username, password, callback) {
    
    users.findOne({'_id': username}, function (err, user) {
      if (err) return callback(err, null);
      
      if (user) {
        if (bcrypt.compareSync(password, user.password)) {
          callback(null, user);
        }
        else {
          var invalid_password_error = new Error('Invalid password');
          invalid_password_error.msg = 'Invalid password';
          callback(invalid_password_error, null);
        }
      }
      else {
        var no_such_user_error = new Error('User not found');
        no_such_user_error.msg = 'User not found';
        callback(no_such_user_error, null);
      }
    });
  }
  
}

module.exports.UserDAO = UserDAO;