// document.addEventListener('DOMContentLoaded', function () {
//   document.querySelector('#learn').addEventListener('click', doLearn);
// });

doLearn();

function doLearn() {
	var nDocs = -1;
	var nWords = -1;
	var nTopics = 5;
	var accuracy = 0.00001;

	var row = [], wordsIndex = [];

	chrome.history.search({
		'text': '',
		'startTime': 0,
		'maxResults': 9999
	}, function (historyArray) {
		console.log("Items in history: " + historyArray.length);
		var reg = /\W/;
		var invWordsIndex = [], actualIndex = 0;
		var data = [];
		for (var i = 0, offset = 0; i < historyArray.length; ++i) {
			var words = historyArray[i].title.split(/\W/);
			var existings = [];
			for (var j = 0; j < words.length; ++j) {
				var word = words[j].trim().toLowerCase();
				if (word.length <= 3)
					continue;
				if (invWordsIndex[word] === undefined) {
					invWordsIndex[word] = actualIndex;
					wordsIndex[actualIndex] = word;
					++actualIndex;
				}
				wordIndex = invWordsIndex[word];
				if (existings[wordIndex] === undefined)
					existings[wordIndex] = 1;
				else
					existings[wordIndex] += 1;
			}
			if (existings.length >= 2) {
				data[offset] = existings;
				++offset;
			}
		}
		var realData = [];
		for (var i = 0; i < data.length; ++i) {
			realData[i] = [];
			for (var j = 0; j < wordsIndex.length; ++j) {
				if (data[i][j] === undefined)
					realData[i][j] = 0;
				else
					realData[i][j] = data[i][j];
			}
		}
		doPLSI(realData);
	});

	function doPLSI(data) {
		nDocs = data.length;
		if (nDocs <= 0)
			return;
		nWords = data[0].length;
		initData(data);
		EMSteps();
	}

	function initData(data) {
		var i = 0;
		for (var d = 0; d < nDocs; ++d) {
			row[d] = [];
			i = 0;
			for (var w = 0; w < nWords; ++w)
				if (data[d][w] > 0)
					row[d][i++] = {
						position: w,
						nWords: data[d][w]
					};
		}
	}

	function EMSteps() {
		var pz = [];
		var pzd = [];
		var pzw = [];
		var pzdw = [];

		initVector(pz, pzd, pzw, pzdw);

		var oldLikelihood = calcLoglikelihood(pz, pzd, pzw), currentLikelihood;
		var isEqualPz = true;
		var isOccuredOnce = false;
		for (var actiter = 0; actiter < 5000; ++actiter) {
			estep(pz, pzd, pzw, pzdw);
			mstep(pz, pzd, pzw, pzdw, isEqualPz);
			currentLikelihood = calcLoglikelihood(pz, pzd, pzw);
			console.log("Likelihood: " + currentLikelihood);
			if (Math.abs(oldLikelihood / currentLikelihood - 1.0) < accuracy) {
				if (!isOccuredOnce) {
					isOccuredOnce = true;
					isEqualPz = false;
					console.log("Switch to unequal Pz");
				} else {
					console.log("Final likelihood: " + currentLikelihood);
					PrintResult(pzd, pzw, pz);
					return true;
				}
			}
			oldLikelihood = currentLikelihood;
		}
	}

	function initVector(pz, pzd, pzw, pzdw) {
		var iz = 1.0 / nTopics;
		var norm;
		for (var z = 0; z < nTopics; ++z) {
			pz[z] = iz;
			pzd[z] = [];
			pzw[z] = [];
			pzdw[z] = [];
			norm = 0;
			for (var d = 0; d < nDocs; ++d) {
				pzdw[z][d] = [];
				pzd[z][d] = Math.random();
				norm += pzd[z][d];
			}
			for (var d = 0; d < nDocs; ++d) {
				pzd[z][d] /= norm;
			}
			norm = 0;
			for (var w = 0; w < nWords; ++w) {
				pzw[z][w] = Math.random();
				norm += pzw[z][w];
			}
			for (var w = 0; w < nWords; ++w) {
				pzw[z][w] /= norm;
			}
		}
	}

	function estep(pz, pzd, pzw, pzdw) {
		for (var d = 0; d < nDocs; ++d) {
			var counter = 0;
			for (var pw = 0; pw < row[d].length; ++pw) {
				var w = row[d][pw].position;
				var norm = 0.0;
				for (var z = 0; z < nTopics; ++z) {
					pzdw[z][d][counter] = pz[z] * pzd[z][d] * pzw[z][w];
					norm += pzdw[z][d][counter];
				}
				for (var z = 0; z < nTopics; ++z) {
					pzdw[z][d][counter] /= norm;
				}
				++counter;
			}
		}
		return (true);
	}

	function mstep(Pz, Pz_d, Pz_w, Pz_dw, isEqualPz) {
		var z, w, d, i, counter, norm;
		for (z = nTopics - 1; z >= 0; z--) {
			for (w = nWords - 1; w >= 0; w--) {
				Pz_w[z][w] = 0.0;
			}
		}

		for (z = nTopics - 1; z >= 0; z--) {
			for (d = nDocs - 1; d >= 0; d--) {
				for (i = 0, counter = 0; i < row[d].length; i++, counter++) {
					Pz_w[z][row[d][i].position] += row[d][i].nWords * Pz_dw[z][d][counter];
				}
			}
		}

		for (z = 0; z < nTopics; z++) {
			norm = 0.0;
			for (w = 0; w < nWords; w++) {
				norm += Pz_w[z][w];
			}
			for (w = 0; w < nWords; w++) {
				Pz_w[z][w] /= norm;
			}
		}

		for (z = 0; z < nTopics; z++) {
			Pz[z] = 0.0;
			for (d = 0; d < nDocs; d++) {
				Pz_d[z][d] = 0.0;
				counter = 0;
				for (i = 0; i < row[d].length; i++) {
					Pz_d[z][d] += row[d][i].nWords * Pz_dw[z][d][counter];
					counter++;
				}
				Pz[z] += Pz_d[z][d];
			}
		}

		for (z = 0; z < nTopics; z++) {
			norm = 0.0;
			for (d = 0; d < nDocs; d++) {
				norm += Pz_d[z][d];
			}
			for (d = 0; d < nDocs; d++) {
				Pz_d[z][d] /= norm;
			}
		}

		if (isEqualPz) {
			for (z = 0; z < nTopics; z++) {
				Pz[z] = 1.0 / nTopics;
			}
		} else {
			norm = 0.0;
			for (z = 0; z < nTopics; z++) {
				norm += Pz[z];
			}
			for (z = 0; z < nTopics; z++) {
				Pz[z] /= norm;
			}
		}
		return (true);
	}

	function calcLoglikelihood (Pz, Pz_d, Pz_w) {
		var norm, L, sum;
		L = 0.0;

		for (d = 0; d < nDocs; d++) {
			norm = 0.0;
			for (var i = 0; i < row[d].length; i++) {
				sum = 0.0;
				for (z = 0; z < nTopics; z++) {
					sum += Pz[z] * Pz_d[z][d] * Pz_w[z][row[d][i].position];
				}
				L += row[d][i].nWords * (Math.log(sum) / Math.LN10);
			}
		}
		return (L);
	}

	function PrintResult(Pz_d, Pz_w, Pz) {
		for (var z = 0; z < nTopics; ++z) {
			for (var i = 0; i < Pz_w[z].length; ++i) {
				Pz_w[z][i] = { index: i, value: Pz_w[z][i] };
			}
			Pz_w[z].sort(function(a, b) {
				return a.value - b.value;
			});
			Pz_w[z].reverse();
		}
		var finished = false;
		var existings = [], iTopic = [], results = [];
		for (var z = 0; z < nTopics; ++z) {
			iTopic[z] = 0;
			results[z] = [];
		}
		
		for (var i = 0; finished == false; ++i) {
			finished = true;
			for (var z = 0; z < nTopics; ++z) {
				if (existings[Pz_w[z][i].index] === undefined) {
					existings[Pz_w[z][i].index] = true;
					results[z][iTopic[z]] = Pz_w[z][i];
					iTopic[z] += 1;
				}
				if (iTopic[z] < 10)
					finished = false;
			}
		}
		htmlString = "<ol>";
		for (var z = 0; z < nTopics; ++z) {
			htmlString += "<li>Topic " + (z+1) + ":<ul>";
			//console.log("Topic " + z + ":");
			for (var i = 0; i < results[z].length; ++i) {
				htmlString += "<li>" + wordsIndex[results[z][i].index] + "</li>";
				//console.log(wordsIndex[results[z][i].index] + ": " + results[z][i].value);
			}
			htmlString += "</ul></li>";
		}
		htmlString += "</ol>";
		document.getElementById('results').innerHTML = htmlString;
	}
}