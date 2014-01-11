(function (){
	/*chrome.history.search({
		'text': ''
	}, function (historyArray) {
		for (var i = historyArray.length - 1; i >= 0; i--) {
			console.log(historyArray[i].title);
		}
	});*/
	var data =
		[
			[9, 2, 1, 0, 0, 0],
			[8, 3, 2, 1, 0, 0],
			[0, 0, 3, 3, 4, 8],
			[0, 2, 0, 2, 4, 7],
			[2, 0, 1, 1, 0, 3]
		];

	// function PositionsAndWords(position, occur) {
	// 	this.position = position;
	// 	this.nWords  = occur;
	// }

	/*
	PositionsAndWords.prototype.'function' = function() {}
	*/
	var nDocs = -1;
	var nWords = -1;
	var nTopics = 5;
	var accuracy = 0.00001;

	var row = [];

	doPLSI(data);
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
					//row[d][i++] = new PositionsAndWords(w, data[d][w]);
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
		/*for (var i = 0; i < pzw.length; ++i)
			for (var j = 0; j < pzw[i].length; ++j)
				console.log(pzw[i][j]);
		return;*/
		var oldLikelihood = calcLoglikelihood(pz, pzd, pzw), currentLikelihood;
		var isEqualPz = true;
		var isOccuredOnce = false;
		inner(pz, pzd, pzw, pzdw, currentLikelihood, oldLikelihood, isEqualPz, isOccuredOnce);
	}
	
	function inner(pz, pzd, pzw, pzdw, currentLikelihood, oldLikelihood, isEqualPz, isOccuredOnce) {
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
				return;
			}
		}
		oldLikelihood = currentLikelihood;
		setInterval(function() {
			inner(pz, pzd, pzw, pzdw, currentLikelihood, oldLikelihood, isEqualPz, isOccuredOnce);
		}, 1);
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
					Pz_d[z, row[d][i].position] += row[d][i].nWords * Pz_dw[z, d][counter];
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
					Pz_d[z][d] += row[d][i].nWords * Pz_dw[z, d][counter];
					counter++;
				}
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

		for (d = 0; i < nDocs; i++) {
			norm = 0.0;
			for (var i = 0; i < row[d].length; i++) {
				sum = 0.0;
				for (z = 0; z < nTopics; z++) {
					sum += Pz[z] * Pz_d[z][d] * Pz_w[z][row[d].position];
				}
				L += row[d].nWords * (Math.log(sum) / Math.LN10);
			}
		}
		return (L);
	}

	function PrintResult(Pz_d, Pz_w, Pz) {
		console.log(Pz);
	}
})();