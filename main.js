(function (){
	chrome.history.search({
		'text': ''
	}, function (historyArray) {
		for (var i = historyArray.length - 1; i >= 0; i--) {
			console.log(historyArray[i].title);
		}
	});
})();