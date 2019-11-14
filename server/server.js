const http = require('http')
const express = require('express')
const ws = require('ws')

var app = express()

//initialize a simple http server
const server = http.createServer(app)

//initialize the WebSocket server instance
const wss = new ws.Server({ server });

var MongoClient = require('mongodb').MongoClient
var db

MongoClient.connect('mongodb://localhost:27017/serverdb', {useUnifiedTopology: true}, function (err, client) {
  if (err) throw err
  
  db = client.db('serverdb')
  //db.collection('register').createIndex( { "client_id": 1 }, { unique: true } )

  db.collection('register').find().toArray(function (err, result) {
    if (err) throw err

    console.log(result)
  })
})

var sessions = new Map()
var notification = 0
wss.on('connection', function (ws) {

	ws.send("{\"operation\": \"test\"}")


    //connection is up, let's add a simple simple event
    ws.on('message', function (message) {
        //log the received message and send it back to the client
        //console.log('Server received: %s', message);

        var msgJson = JSON.parse(message)
        //console.log(typeof msgJson)
        //console.log(msgJson.message_type)
        switch(msgJson["message_type"]) {
        	case 'client_id':
		    	//create another function that handles parsing id and saving session
		    	console.log('Server received id: ' + msgJson["client_id"]);
		    	sessions.set(msgJson["client_id"], ws);

		    	readClient(msgJson["client_id"], "1")
        		break
        	case 'read_response':
        		console.log(msgJson["read_response"]);

        		updatedb({"client_id": msgJson["client_id"]}, msgJson["read_response"])

        		writeClient(msgJson["client_id"], "1", "10")
        		break;
        	case 'write_response':
        		console.log(msgJson["write_response"]);

        		var query = {"client_id": msgJson["client_id"]}
        		var update = Object.assign({"last_update": msgJson["last_update"]}, msgJson["write_response"])
        		updatedb(query, update)

        		writeAttributesClient(msgJson["client_id"], "1", "1")
        		break;
        	case 'write_attributes_response' :
        		console.log(msgJson["write_attributes_response"]);

        		var query = {"client_id": msgJson["client_id"]}
        		var update = Object.assign({"last_update": msgJson["last_update"]}, msgJson["write_attributes_response"])
        		updatedb(query, update)

        		discoverClient(msgJson["client_id"], "1")
        		break;
        	case 'discover_response':
        		console.log(msgJson["discover_response"]);

        		updatedb({"client_id": msgJson["client_id"]}, msgJson["discover_response"])

        		executeClient(msgJson["client_id"], "1", "1", "1")
        		break;
        	case 'execute_response':
        		console.log(msgJson["execute_response"]);        		
        		createClient(msgJson["client_id"], "2", "88")
        		break;

        	case 'create_response':
        		console.log('create success')
        		console.log(msgJson["create_response"]);

        		var obj = Object.assign({"client_id": msgJson["client_id"]}, {"last_update": msgJson["last_update"]}, msgJson["create_response"])
        		insertdb(obj)  	

        		deleteClient(msgJson["client_id"], "1", "1")
        		break;
        	case 'delete_response':
        		console.log("delete success");
        		deletedb(msgJson["delete_response"])

        		observeClient(msgJson["client_id"])
        		break;
        	case 'success':
        		console.log("success");
        		break;
        	case 'notify':
        		notification++;
        		
        		if (notification>5) {
        			cancelObservation(msgJson["client_id"])
        			break
        		}
        		console.log(notification)
        		//console.log("server received the notification")
        		var obj = {"client_id": msgJson["client_id"], "last_update": msgJson["last_update"]}
        		updatedb({"client_id": msgJson["client_id"]}, obj) 		
        	 	break
        	 case 'cancel_observation_response':
        	 	console.log('observation cancelled')
        	 	break
        	default:
        		console.log(msgJson["message_type"])
        		break
        }
        
    });
    //send immediatly a feedback to the incoming connection    
   // ws.send('Hi there, I am a WebSocket server');
});

function operateClients() {
	for (client_id in sessions.keys()) {
    	readClient(client_id)
    }
}

function readClient(client_id, object_id){
	console.log('Requesting a read operation')

	var ws = sessions.get(client_id)
	ws.send("{\"operation\": \"read\", \"object_id\":"+object_id+"}")
}

function writeClient(client_id, object_id, new_value){
	console.log('Requesting a write operation')

	var ws = sessions.get(client_id)
	ws.send("{\"operation\": \"write\", \"object_id\":" + object_id + ", \"new_value\":"+new_value+"}")
}

function writeAttributesClient(client_id, object_id, attributes){
	console.log('Requesting a write attributes operation')

	var ws = sessions.get(client_id)
	ws.send("{\"operation\": \"write_attributes\", \"object_id\":" + object_id + ", \"attributes\":" + attributes+"}")
}

function discoverClient(client_id, object_id){
	console.log('Requesting a discover operation')

	var ws = sessions.get(client_id)
	ws.send("{\"operation\": \"discover\", \"object_id\":"+object_id+"}")
}

function executeClient(client_id, object_id, object_instance_id, resource_id){
	console.log('Requesting a execute operation')


	var ws = sessions.get(client_id)
	ws.send("{\"operation\": \"execute\", \"object_id\":"+object_id + ", \"object_instance_id\":" + object_instance_id + ", \"resource_id\":" + resource_id + "}")
}

function createClient(client_id, object_id, new_value){
	var ws = sessions.get(client_id)
	ws.send("{\"operation\": \"create\", \"object_id\":" + object_id + ", \"new_value\":"+new_value+"}")
}

function deleteClient(client_id, object_id, object_instance_id){
	var ws = sessions.get(client_id)
	ws.send("{\"operation\": \"delete\", \"object_id\":"+object_id + ", \"object_instance_id\":" + object_instance_id + "}")
}

function observeClient(client_id, message){
	var ws = sessions.get(client_id)
	ws.send("{\"operation\": \"observe\"}")
}

function cancelObservation(client_id){
	var ws = sessions.get(client_id)
	ws.send("{\"operation\": \"cancel_observation\"}")

}

app.get('/register/:client_id', function (req, res) {

	var date = new Date()
	var obj = {"client_id": req.params.client_id, "last_update": date}

	insertdb(obj)

	res.send('registered');
})

app.get('/deregister/:client_id', function(req, res) {
	var obj = {"client_id": req.params.client_id}

	db.collection('register').deleteOne(obj, function(err, result) {
		if (err) throw err;

		console.log('1 record deleted');
		db.collection('register').find().toArray(function (err, result) {
		    if (err) throw err

		    console.log(result)
		})
	})
	res.send('deregistered');
})

function updatedb(query, obj) {
	var new_val = {$set: obj}
	db.collection('register').updateOne(query, new_val, function(err, result) {
		if (err) throw err;

		console.log('1 record updated');
		db.collection('register').find().toArray(function (err, result) {
		    if (err) throw err

		    console.log(result)
		})
	})
}

function insertdb(obj) {
	db.collection('register').insertOne(obj, function(err, result) {
		if (err) throw err;

		console.log('1 record inserted.');
		db.collection('register').find().toArray(function (err, result) {
		    if (err) throw err

		    console.log(result)
		})
	})
}

function deletedb(obj) {
	db.collection('register').deleteOne(obj, function(err, result) {
		if (err) throw err;

		console.log('1 record deleted');
		db.collection('register').find().toArray(function (err, result) {
		    if (err) throw err

		    console.log(result)
		})
	})
}

//start our server
server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});


