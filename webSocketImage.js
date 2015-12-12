/**
 * Server.js
 * @author : Gabriel Pozo | 
 * @Created on: 1 Dec, 2015
 */


/* Librerias necesarias para la aplicación */
var bodyParser  = require('body-parser');
var express     = require('express');
var app         = express();
var http        = require('http').Server(app);
var io          = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient;
var userDAO     = require('./dao/UserDAO').UserDAO;
var messageDAO  = require('./dao/MessagesDAO').MessageDAO;
var checkOperation  = require('./op/CheckOperations').CheckOperation;
var fs=require('fs');
var multipart = require('connect-multiparty');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// ====================================================== //
// == MONGODB DATOS DE CONEXIÓN
// ====================================================== //
var mdbconf = {
  host: process.env.MONGODB_PORT_27017_TCP_ADDR || '172.17.0.3',
  port: '27017',
  db: 'chatSS'
};

// ====================================================== //
// == INICIALIZA LA CONEXIÓN A MONGODB Y EL SERVIDOR
// =====================================================  //
var mongodbURL = 'mongodb://' + mdbconf.host + ':' + mdbconf.port + '/' + mdbconf.db;
if (process.env.OPENSHIFT_MONGODB_DB_URL) {
  mongodbURL = process.env.OPENSHIFT_MONGODB_DB_URL
}
/* Get a mongodb connection and start application */
MongoClient.connect(mongodbURL, function (err, db) {
  
  var usersDAO = new userDAO(db); // Initialize userDAO
  var messagesDAO = new messageDAO(db);// Initialize messageDAO
  var checkOperations = new checkOperation();// Initialize checkOperation
  var dbR = db.collection('users');
  var onlineUsers = [];
  
  
  // example schema
var schema = new Schema({
    img: { data: Buffer, contentType: String }
});

// our model
var A = mongoose.model('A', schema);
  
var globalImage=null;
 var imageData=null;
 
/** *** *** ***
 * Configuramos la aplicación:
 */
 //  app.use(bodyParser()); Para acceder a 'req.body' en peticiones POST
  // Para acceder a los parametros de las peticiones POST
app.use(bodyParser.urlencoded({
   extended: true
}));
app.use(bodyParser.json());
  
 app.use(multipart()); 
  
/** *** *** ***
 *  Configuramos el sistema de ruteo para las peticiones web:
 */
  
  app.get('/signup', function (req, res) {
    res.sendFile( __dirname + '/views/signup.html');
  });
  
  app.post("/uploadpic",function(req, res)
  {
    var fileAvatar  = req.files.avatar.path;
	console.log(req.body, req.files);
	console.log("fichero con path="+fileAvatar);


var imageFile = req.files.avatar;
fs.readFile(imageFile.path, function (err, data) {
  
		  var newPath = __dirname + "/imagenes/fotes.png";
		  fs.writeFile(newPath, data, function (err) {
			//res.redirect("back");			
			
			imageData = fs.readFileSync(newPath);			
		console.log(imageData);
		
		
			var imageBson = {};
			/*
			imageBson.image = MongoClient.bson_serializer.Binary(imageData);
			imageBson.imageType = imageFile.type;
			*/
			/*imageBson.image = new request.mongo.Binary(imageData);
			imageBson.imageType = imageFile.type*/
			console.log('archivo guardado!');
			 
			
		  });
	  });
	
	

	
  });
  
  app.post('/signup', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email    = req.body.email;
	//var picture  = req.body.avatar;
	//console.log('PICTURE: '+picture);
	//var imageBSON = {};
	//		imageBSON.image = new req.mongo.Binary(picture);
	//		imageBSON.imageType= imageFile.mimetype;
	
	//var fileAvatar  = req.body.fileAvatar;
	//var fileAvatar  = req.files.Avatar.path;
	//console.log('VARIABLE FILE: '+fileAvatar);		
    //hacer cambios En DAO, añadir imagen de perfil a la BBDD
    usersDAO.addUser(username, password, email, function (err, user) {
      if (err) {
        res.send({ 'error': true, 'err': err});
      }
      else {
        user.password = null;
		globalImage = null;
        res.send({ 'error': false, 'user': user });
      }
    });
  });

  app.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    
    usersDAO.validateLogin(username, password, function (err, user) {
      if (err) {
        res.send({'error': true, 'err': err});
      }
      else {
        user.password = null;
        res.send({ 'error': false, 'user': user});
      }
    })
  });
  
  /** css and js requests */
  app.get('/css/foundation.min.css', function (req, res) {
    res.sendFile(__dirname + '/views/css/foundation.min.css');
  });

  app.get('/css/normalize.css', function (req, res) {
    res.sendFile(__dirname + '/views/css/normalize.css');
  });
  
 app.get('/css/chat.css', function (req, res) {
    res.sendFile(__dirname + '/views/css/chat.css');
  })
  
  app.get('/js/foundation.min.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/foundation.min.js');
  });
  
  app.get('/js/foundation.offcanvas.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/foundation.offcanvas.js');
  });
  
  app.get('/js/chat.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/chat.js');
  });
  
  
  app.get('/js/chat.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/chat.js');
  });
  
  app.get('/js/moment-with-locales.min.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/moment-with-locales.min.js')
  })
  /** *** *** */
  
  app.get('*', function(req, res) {
    res.sendFile( __dirname + '/views/chat.html');
  });


  /** *** *** ***
   *  Configuramos Socket.IO para estar a la escucha de
   *  nuevas conexiones. 
   */
  io.on('connection', function(socket) {
    
    console.log('New user connected');
    
    /**
     * Cada nuevo cliente solicita con este evento la lista
     * de usuarios conectados en el momento.
     */
    socket.on('all online users', function () {
      socket.emit('all online users', onlineUsers);
    });
    
    /**
     * Cada nuevo socket debera estar a la escucha
     * del evento 'chat message', el cual se activa
     * cada vez que un usuario envia un mensaje.
     * 
     * @param  msg : Los datos enviados desde el cliente a 
     *               través del socket.
     */
    socket.on('chat message', function(msg) {
      messagesDAO.addMessage(msg.username, Date.now(), msg.message, function (err, nmsg) {
        io.emit('chat message', msg);
      });
    });
    
    /**
     * Mostramos en consola cada vez que un usuario
     * se desconecte del sistema.
     */
    socket.on('disconnect', function() {
      onlineUsers.splice(onlineUsers.indexOf(socket.user), 1);
      io.emit('remove user', socket.user);
      console.log('User disconnected');
    });
    
    /**
     * Cada nuevo cliente solicita mediante este evento
     * los ultimos mensajes registrados en el historial
     */
    socket.on('latest messages', function () {
      messagesDAO.getLatest(50, function (err, messages) {
        if (err) console.log('Error getting messages from history');
        socket.emit('latest messages', messages);
      });
    });
    
    /**
     * Cuando un cliente se conecta, emite este evento
     * para informar al resto de usuarios que se ha conectado.
     * @param  {[type]} nuser El nuevo usuarios
     */
    socket.on('new user', function (nuser) {
      socket.user = nuser;
	  /**comprabamos si el nuevo user ya esta conectado anteriormente*/
	  checkOperations.checkOnlines(onlineUsers,nuser,function (err, found) {     
	  
		console.log('Valor encontrado'+found);
			 if(found==false){
				onlineUsers.push(nuser);
				io.emit('new user', nuser);
			 }	
      });
	  
      
    });
    
  });

// ====================================================== //
  // == APP STARTUP
  // ====================================================== //
  if (process.env.OPENSHIFT_NODEJS_IP && process.env.OPENSHIFT_NODEJS_PORT) {
    http.listen(process.env.OPENSHIFT_NODEJS_PORT, process.env.OPENSHIFT_NODEJS_IP, function() {
      console.log('Listening at openshift on port: ' + process.env.OPENSHIFT_NODEJS_PORT);
    });
  }
  else {
    http.listen(80, function () {
      console.log('Listing on port: 80')
    })
  }

});