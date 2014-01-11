(function (){
	var oneWeekAgo = (new Date()).getTime();
	console.log(chrome.history.search({
		'text': '',
		'startTime': oneWeekAgo
	}));
})();