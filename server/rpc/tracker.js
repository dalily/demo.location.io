// Server-side Code
var LocationIo = require('location.io');
var HashMap = require('hashmap').HashMap;
var ss = require('socketstream').api;

var locationIo = new LocationIo();

var trackers = {};

locationIo.on("tracker-connected", function(id, protocol) {

	console.log('new connection ' + id + ' protocol ' + protocol);
	var tracker = {};
	tracker.protocol = protocol;
	tracker.id = id;
	trackers[id] = tracker;
	ss.publish.all('tracker-connected', tracker);
});

locationIo.on("tracker-disconnected", function(id) {
	console.log('connection closed ' + id);
	ss.publish.all('tracker-disconnected', id);
	delete trackers[id];
});

locationIo.on("message", function(id, message) {
	console.log('message from ' + id);
    console.log(message);
    if (trackers[id] === undefined) {
        console.log('message from unknown id ' + id);
    } else {
       if (message.location !== undefined) {
           trackers[id].location = message.location;
       }
    }

	ss.publish.all('message', id, message);
	
});

// Define actions which can be called from the client using ss.rpc('demo.ACTIONNAME', param1, param2...)
exports.actions = function(req, res, ss) {

	console.log('tracker-event-router init');
	req.use('session');
	
	return {

		getConnectedTrackers : function(message) {
			console.log('get connected trackers');
			return res(trackers);
			
		},
		sendCommand : function(trackerId, commandName, parameters) {
			locationIo.sendMessage(trackerId, commandName, parameters, function(err) {
				res(err);
			});
		},
		getCapabilities : function(protocolName) {
			var capabilities = locationIo.getApi(protocolName);
			return res(capabilities);
		}

	};

};

locationIo.createServer(1337);