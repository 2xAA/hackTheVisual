var Firebase = require('firebase');
'use strict';
/*jslint browser: true */

var clouds = new Firebase("https://splatmap.firebaseio.com/clouds");
var player = new Firebase("https://splatmap.firebaseio.com/player");

var imagesTaken = 0;
var maxImages = 5;
var nameCloud = [];
var watchPositionID;
var orientation;
var playerID;
var started = false;

var position;
var playerName;
var playerState;
var playerTeam;

var gameID;

function createNewCloud(images) {
	var cloud = {
		coordinates: [
			position.latitude,
			position.longitude,
			position.altitude
		],
		orientation: orientation,
		images: images,
		player: {
			id: playerID,
			name: 'Sam'
		}
	};

	clouds.push(cloud);
}

function getUserLocation(cb) {
	if(navigator.geolocation) navigator.geolocation.getCurrentPosition(cb);
}

var consoleLogIt = function(name) {
	return function() {
		console.log(name, arguments);
	};
};

function dataURItoBlob(dataURI) {
		// convert base64/URLEncoded data component to raw binary data held in a string
		var byteString;
		if (dataURI.split(',')[0].indexOf('base64') >= 0)
			byteString = atob(dataURI.split(',')[1]);
		else
			byteString = unescape(dataURI.split(',')[1]);

		// separate out the mime component
		var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

		// write the bytes of the string to a typed array
		var ia = new Uint8Array(byteString.length);
		for (var i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}

		return new Blob([ia], {type:mimeString});
	}

	function upload(options) {
		var file = options.file;
		var data = new FormData();

		data.append('key', 'images/' + options.filename);
		data.append('acl', 'public-read');
		data.append('Content-Type', file.type);
		data.append('AWSAccessKeyId', 'AKIAJQRHD64IH6IEIUOA');
		data.append('Policy', 'eyJleHBpcmF0aW9uIjoiMjAyMC0xMi0wMVQxMjowMDowMC4wMDBaIiwiY29uZGl0aW9ucyI6W3siYnVja2V0Ijoic3BsYXRtYXAifSxbInN0YXJ0cy13aXRoIiwiJGtleSIsIiJdLHsiYWNsIjoicHVibGljLXJlYWQifSxbInN0YXJ0cy13aXRoIiwiJENvbnRlbnQtVHlwZSIsCiIiXSxbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwwLDUyNDI4ODAwMF1dfQ==');
		data.append('Signature', '0eaGdJXamO7lYTVDBkMKOh68Dx4=');
		data.append('file', file);

		var xhr = new XMLHttpRequest();

		xhr.upload.addEventListener('progress', options.onUploadProgress || consoleLogIt('progress'), false);
		xhr.addEventListener('load', options.onLoad || consoleLogIt('load'), false);
		xhr.addEventListener('error', options.onError || consoleLogIt('error'), false);
		xhr.addEventListener('abort', options.onAbort || consoleLogIt('abort'), false);

		xhr.open('POST', 'http://splatmap.s3-eu-west-1.amazonaws.com', true);

		xhr.send(data);
	}

	var $ = document;

	var videoElement = $.querySelector('video'),
	canvas = $.querySelector('canvas'),
	ctx = canvas.getContext('2d'),
		// audioSelect = $.querySelector('select#audioSource'),
		videoSelect = $.querySelector('select#videoSource');

		canvas.addEventListener('click', function() {

			var dataURL = canvas.toDataURL('image/jpeg', 80);
			var blob = dataURItoBlob(dataURL);
			var filename = 'teamname-teammember-' + Date.now()  + '.jpg';
			nameCloud.push('https://s3-eu-west-1.amazonaws.com/splatmap/images/' + filename);

			imagesTaken++;
			if(imagesTaken == maxImages) {
				createNewCloud(nameCloud);
				imagesTaken = 0;
				nameCloud = [];
			}

			upload({
				file: blob,
				filename: filename
			});
		});

		navigator.getUserMedia = navigator.getUserMedia ||
		navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

		function gotSources(sourceInfos) {
			for (var i = 0; i !== sourceInfos.length; ++i) {
				var sourceInfo = sourceInfos[i];
				var option = $.createElement('option');
				option.value = sourceInfo.id;
				if (sourceInfo.kind === 'video') {
					option.text = sourceInfo.label || 'camera ' + (videoSelect.length + 1);
					videoSelect.appendChild(option);
				} else {
					console.log('Some other kind of source: ', sourceInfo);
				}
			}

			startStream();
		}

		function canvasLoop() {
			requestAnimationFrame(canvasLoop);
			
			if(canvas.width === 0) {

				canvas.width = videoElement.videoWidth;
				canvas.height = videoElement.videoHeight;

				canvas.style.width = window.innerWidth + 'px';
				canvas.style.height = window.innerWidth * 1.3333333333333333 + 'px';


			}

			ctx.drawImage(videoElement, 0, 0);
		}

		function successCallback(stream) {
		window.stream = stream; // make stream available to console
		videoElement.src = window.URL.createObjectURL(stream);
		videoElement.play();

		canvas.width = videoElement.videoWidth;
		canvas.height = videoElement.videoHeight;

		requestAnimationFrame(canvasLoop);
	}

	function errorCallback(error) {
		console.log('navigator.getUserMedia error: ', error);
	}

	function startStream() {
		if (!!window.stream) {
			videoElement.src = null;
			window.stream.stop();
		}

		var videoSource;
		if(videoSelect.length > 1 && !started) {
			videoSource = videoSelect.querySelector('option:nth-child(2)').value;
		} else {
			videoSource = videoSelect.value;
		}

		started = true;

		console.log(videoSelect.length, videoSource);

		var constraints = {
			audio: false,
			video: {
				optional: [
					{sourceId: videoSource},
					{minHeight: 1280}
				]
			}
		};
		navigator.getUserMedia(constraints, successCallback, errorCallback);
	}

	videoSelect.onchange = startStream;

	function handleOrientation(event) {
		var absolute = event.absolute;

		var alpha    = event.alpha; // Z In degree in the range [0,360]
		var beta     = event.beta; // X In degree in the range [-180,180]
 		var gamma    = event.gamma; // Y In degree in the range [-90,90]

 		orientation = [alpha, beta, gamma];

 		player.set({
 			id: playerID,
 			name: 'Danny',
 			orientation: orientation,
 			coordinates: [
	 			position.latitude,
	 			position.longitude,
	 			position.altitude
 			]
 		});
 	}

 	function doOnStateUpdate(state, data) {
 		switch(state) {
 			case 'waiting for server response':
 					
 				break;

 			case 'waiting for game':
 					console.log('still waiting');
 				break;

 			case 'in game':
 					playerTeam = data.team_name;
 					gameID = data.game_id;
  					console.log('Assigned a game!', 'On team:', playerTeam, 'and have game ID:', gameID);
 				break;
 		}

 	}

 	function boot() {
		// Get orientation
		window.addEventListener('deviceorientation', handleOrientation);

		// Get MediaStreamTrack
		if (typeof MediaStreamTrack === 'undefined' || typeof MediaStreamTrack.getSources === 'undefined') {
			alert('This browser does not support MediaStreamTrack.\n\nTry Chrome.');
		} else {
			MediaStreamTrack.getSources(gotSources);
		}

		// Set position options
		var PositionOptions = {
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0
		};

		// Request constant position updates
		watchPositionID = navigator.geolocation.watchPosition(function(pos) {
			position = pos.coords;
		}, function(e) {
			console.error('watchPosition error', e);
		}, PositionOptions);

		// Register player with Firebase
		var players = new Firebase('https://splatmap.firebaseio.com/players');

		// Grab random name
		var script = document.createElement("script");
		script.src = "http://randomword.setgetgo.com/get.php?callback=randomName";
		window.randomName = function(name) {
			playerName = name.Word.toLowerCase().replace('\r\n', '');
			playerState = 'waiting for server to call';

			var myref = players.push({name: playerName/*, state: 'waiting for server to call'*/}); // must have something

			myref.on('value', function(data) {
				playerID = data.key();
				playerState = data.val().state;

				doOnStateUpdate(playerState, data.val());

				console.log(data.val());

			});
		};
		document.body.appendChild(script);

		document.getElementById('dropdown').addEventListener('click', function() {
			var controlsSection = document.querySelector("section.controls");
			this.classList.toggle('active');
			controlsSection.classList.toggle('hidden');
		});
	}

	boot();
	