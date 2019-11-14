var WebSocket = require("ws")
var mysql      = require('mysql');
var http = require('http')

var client_id = 'client1'

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : client_id
});
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  //console.log('connected as client_id ' + connection.threadId);
});

http.get('http://localhost:8999/register/client1', (resp) => {
  let data = '';

  // A chunk of data has been recieved.
  resp.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received. Print out the result.
  resp.on('end', () => {
    console.log(data);
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});

var ws = new WebSocket('ws://localhost:8999');
// event emmited when connected
ws.onopen = function () {
    console.log('websocket is connected ...')


    // sending a send event to websocket server
    ws.send("{\"message_type\": \"client_id\", \"client_id\": \""+client_id+"\"}")
}

var interval;

// event emmited when receiving message 
ws.onmessage = function (message) {
	console.log('Client received: %s', message["data"]);

    //console.log(message);
    msgJson = JSON.parse(message["data"])
    //console.log(typeof msgJson)
    switch (msgJson["operation"]) {
    	case 'test':
    		console.log("msg from server received");
    		break
    	case 'read':
    		read(msgJson["object_id"])
    		break
    	case 'write':
    		write(msgJson["object_id"], msgJson["new_value"])
    		break
    	case 'write_attributes':
    	    writeAttributes(msgJson["object_id"], msgJson["attributes"])
    		break
    	case 'discover':
    		discover(msgJson["object_id"])
    		break
    	case 'execute':
    		execute(msgJson["object_id"], msgJson["object_instance_id"], msgJson["resource_id"])
    		break
    	case 'create':
    		create(msgJson["object_id"], msgJson["new_value"])
    		break
    	case 'delete':
    		deleteObject(msgJson["object_id"], msgJson["object_instance_id"])
    		break
    	case 'observe':
    		interval = setInterval(notify, 3000)
    		break
    	case 'cancel_observation':
    		cancelObservation();
    		break
    	default:
    		break
    }
}

function read(object_id) {
	var query = 'SELECT * FROM object WHERE object_id = ' + object_id;
	connection.query(query, function (error, results, fields) {
		if (error) throw error;

		//console.log(results)
		var read_response = "{\"message_type\": \"read_response\", \"read_response\": "+JSON.stringify(results[0]) + ", \"client_id\": \""+client_id+"\"}"
		ws.send(read_response);
	});

}

function write(object_id, new_value) {
	var query = 'UPDATE object SET value = ' + new_value + ' WHERE object_id = ' + object_id;
	
	connection.query(query, function(err, res, fields) {
		if (err) throw err;

		console.log(res.affectedRows + " record(s) updated");
		var select = 'SELECT * FROM object WHERE object_id = ' + object_id;
		connection.query(select, function (error, results, fields) {
			if (error) throw error;

			//console.log(results)
			var last_update = new Date()
			var write_response = "{\"message_type\": \"write_response\", \"write_response\": "+JSON.stringify(results[0]) + ", \"client_id\": \""+client_id+"\", \"last_update\": \""+ last_update +"\"}"
			ws.send(write_response);
		});
	})

	 
}

function writeAttributes(object_id, attributes) {
	var query = 'UPDATE object SET attributes = ' + attributes + ' WHERE object_id = ' + object_id;
	
	connection.query(query, function(err, res, fields) {
		if (err) throw err;

		console.log(res.affectedRows + " record(s) updated");
	})

	var select = 'SELECT * FROM object WHERE object_id = ' + object_id;
	connection.query(select, function (error, results, fields) {
		if (error) throw error;

		//console.log(results)
		var last_update = new Date()
		var write_attributes_response = "{\"message_type\": \"write_attributes_response\", \"write_attributes_response\": "+JSON.stringify(results[0]) + ", \"client_id\": \""+client_id+"\", \"last_update\": \""+ last_update +"\"}"
		ws.send(write_attributes_response);
	}); 
}

function discover(object_id) {
	var query = 'SELECT attributes FROM object WHERE object_id = ' + object_id;
	connection.query(query, function (error, results, fields) {
		if (error) throw error;

		var discover_response = "{\"message_type\": \"discover_response\", \"discover_response\": "+JSON.stringify(results[0]) + ", \"client_id\": \""+client_id+"\"}"
		ws.send(discover_response);
	});
}

function execute(object_id, object_instance_id, resource_id) {
	if (object_instance_id==null || resource_id == null) {
		ws.send("{\"message_type\": \"execute_response\", \"execute_response\": \"execute failed\",  \"client_id\": \""+client_id+"\"}")

	}
	var last_update = new Date()
    ws.send("{\"message_type\": \"execute_response\", \"execute_response\": \"execute success\",  \"client_id\": \""+client_id+"\", \"last_update\": \""+ last_update +"\"}")
}

function deleteObject(object_id, object_instance_id) {
	var query = 'DELETE FROM object WHERE object_id = ' + object_id +' AND object_instance_id = '+object_instance_id;

	connection.query(query, function(err, res, fields) {
		if (err) throw err;

		console.log(res.affectedRows + " record(s) deleted");

		var last_update = new Date()
		var obj = {"object_id": object_id, "object_instance_id": object_instance_id, "client_id": client_id}
		var delete_response = "{\"message_type\": \"delete_response\", \"delete_response\": "+JSON.stringify(obj) + ", \"client_id\": \""+client_id+"\", \"last_update\": \""+ last_update +"\"}"
		
		ws.send(delete_response);
	}) 
}

function create(object_id, new_value) {
	var query = 'INSERT INTO object(object_id, value) VALUES (' + object_id +', '+new_value+')';

	connection.query(query, function(err, res, fields) {
		if (err) throw err;

		console.log(res.affectedRows + " record(s) created");
		var select = 'SELECT * FROM object WHERE object_id = ' + object_id;
		connection.query(select, function (error, result, fields) {
			if (error) throw error;

			console.log(result)
			var last_update = new Date()
			var create_response = "{\"message_type\": \"create_response\", \"create_response\": "+JSON.stringify(result[0]) + ", \"client_id\": \""+client_id+"\", \"last_update\": \""+ last_update +"\"}"
			ws.send(create_response);
		});

	}) 
	}

function cancelObservation() {
	clearInterval(interval)
	ws.send("{\"message_type\": \"cancel_observation_response\"}")
}

function notify() {

	var last_update = new Date()
	ws.send("{\"message_type\": \"notify\", \"client_id\": \""+client_id+"\", \"last_update\": \""+ last_update +"\"}")
}

ws.onclose = function () {
	console.log('websocket closed...')
}