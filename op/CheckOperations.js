/**
 * Data Access Object (DAO) para 'messages'
 * Debe ser construido con un objeto conectado a la
 * base de datos
 *
 * @Created on: 29 March, 2015
 */
function CheckOperation() {
  
  /**
   * Si el constructor es llamado sin el operados 'new'
   * entonces 'this' apunta al objeto global, muestra una advertencia
   * y lo llama correctamente.
   */
  if (false == (this instanceof CheckOperation)) {
    console.log('WARNING: MessageDAO constructor called without "new" operator');
    return new CheckOperation();
  }
  
  /** Colección 'messages' en la base de datos */
 // var messages = db.collection('messages');
  
  this.checkOnlines = function (onlineUsers,nuser,callback) {
   var found=false;
    
	  console.log(onlineUsers.length + ' users received');
	
    for (var i=0; i<onlineUsers.length; i++) 
    {	
		if(onlineUsers[i]._id==nuser._id){
		found=true;
		}
		
	}
	
	
	return callback(null,found);
	
	
  }
  
    
}

module.exports.CheckOperation = CheckOperation;