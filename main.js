(function (){
	chrome.history.search({
		'text': ''
	}, function (historyArray) {
		for (var i = historyArray.length - 1; i >= 0; i--) {
			console.log(historyArray[i].title);
		}
	});

	function Mstep(Pz, Pz_d, Pz_w, Pz_dw, isEqualPz) {
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
				L += row[d].nWords * Math.log(sum);
			}
		}
		return (L);
	}

	function PrintResult(Pz_d, Pz_w, Pz) {
		console.log(Pz);
	}
})();