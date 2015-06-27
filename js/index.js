/* global getXMLHTTPObject */

(function () {
	'use strict';
	/*jslint browser: true */

  var consoleLogIt = function (name) {
    return function () {
      console.log(name, arguments);
    };
  };

  function upload(options) {
    var file = options.file;
    var data = new FormData();

    data.append('key', 'images/' + options.filename);
    data.append('acl', 'public-read');
    data.append('Content-Type', file.type);
    data.append('AWSAccessKeyId', 'AKIAJQRHD64IH6IEIUOA');
    data.append('Policy', 'eyJleHBpcmF0aW9uIjoiMjAyMC0xMi0wMVQxMjowMDowMC4wMDBaIiwiY29uZGl0aW9ucyI6W3siYnVja2V0Ijoic3BsYXRtYXAifSxbInN0YXJ0cy13aXRoIiwiJGtleSIsIiJdLHsiYWNsIjoicHVibGljLXJlYWQifSxbInN0YXJ0cy13aXRoIiwiJENvbnRlbnQtVHlwZSIsCiIiXSxbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwwLDUyNDI4ODAwMF1dfQ==');
    data.append('Signature', '0eaGdJXamO7lYTVDBkMKOh68Dx4=');

    var xhr = getXMLHTTPObject();

    xhr.upload.addEventListener('progress', options.onUploadProgress || consoleLogIt('progress'), false);
    xhr.addEventListener('load', options.onLoad || consoleLogIt('load'), false);
    xhr.addEventListener('error', options.onError || consoleLogIt('error'), false);
    xhr.addEventListener('abort', options.onAbort || consoleLogIt('abort'), false);

    xhr.open('POST', 'http://splatmap.s3-eu-west-1.amazonaws.com', true);

    xhr.send();
  }

	var videoElement = document.querySelector('video');
	var audioSelect = document.querySelector('select#audioSource');
	var videoSelect = document.querySelector('select#videoSource');

	navigator.getUserMedia = navigator.getUserMedia ||
		navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

	function gotSources(sourceInfos) {
		for (var i = 0; i !== sourceInfos.length; ++i) {
			var sourceInfo = sourceInfos[i];
			var option = document.createElement('option');
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
	}

	if (typeof MediaStreamTrack === 'undefined' ||
			typeof MediaStreamTrack.getSources === 'undefined') {
		alert('This browser does not support MediaStreamTrack.\n\nTry Chrome.');
	} else {
		MediaStreamTrack.getSources(gotSources);
	}

	function successCallback(stream) {
		window.stream = stream; // make stream available to console
		videoElement.src = window.URL.createObjectURL(stream);
		videoElement.play();
	}

	function errorCallback(error) {
		console.log('navigator.getUserMedia error: ', error);
	}

	function start() {
		if (!!window.stream) {
			videoElement.src = null;
			window.stream.stop();
		}
		var audioSource = audioSelect.value;
		var videoSource = videoSelect.value;
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

	audioSelect.onchange = start;
	videoSelect.onchange = start;

	start();
})();
