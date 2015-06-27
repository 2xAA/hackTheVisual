;(function () {
	'use strict';
	/*jslint browser: true */

	var clouds = new Firebase("https://splatmap.firebaseio.com/clouds");

	var imagesTaken = 0;
	var nameCloud = [];
	var watchPositionID;

	var position;

	function createNewCloud(images) {
		var cloud = {
			coordinates: [
				position.latitude,
				position.longitude
			],
			images: images,
			player: {
				id: 0,
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
		audioSelect = $.querySelector('select#audioSource'),
		videoSelect = $.querySelector('select#videoSource');

	canvas.addEventListener('click', function() {

		var dataURL = canvas.toDataURL('image/png');
		var blob = dataURItoBlob(dataURL);
		var filename = 'teamname-teammember-' + Date.now();
		nameCloud.push('https://s3-eu-west-1.amazonaws.com/splatmap/images/' + filename);

		imagesTaken++;
		if(imagesTaken == 3) {
			createNewCloud(nameCloud);
			imagesTaken = 0;
			nameCloud = [];
		}

		upload({
			file: blob,
			filename: 'teamname-teammember-' + Date.now()
		});
	});

	navigator.getUserMedia = navigator.getUserMedia ||
		navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

	function gotSources(sourceInfos) {
		for (var i = 0; i !== sourceInfos.length; ++i) {
			var sourceInfo = sourceInfos[i];
			var option = $.createElement('option');
			option.value = sourceInfo.id;
			if (sourceInfo.kind === 'audio') {
				option.text = sourceInfo.label || 'microphone ' +
					(audioSelect.length + 1);
				audioSelect.appendChild(option);
			} else if (sourceInfo.kind === 'video') {
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

		var audioSource = audioSelect.value;
		var videoSource = videoSelect.querySelector('option:nth-child(2)').value;
		console.log(videoSource);

		var constraints = {
			audio: {
				optional: [{
					sourceId: audioSource
				}]
			},
			video: {
				optional: [{
					sourceId: videoSource
				}]
			}
		};
		navigator.getUserMedia(constraints, successCallback, errorCallback);
	}

	videoSelect.onchange = startStream;

	function boot() {
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
			console.log(pos);
			position = pos.coords;
		}, function(e) {
			console.error('watchPosition error', e);
		}, PositionOptions);

	}

	boot();

})();