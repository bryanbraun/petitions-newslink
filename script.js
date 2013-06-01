$(function(){
	// Expanding options box.
	$('.title-bar').click(function() {
		$('.options').slideToggle();
	});


	// Create and initialize variables.
	var petitionData = [],
	petitions = [], // this will be an array containing the title and ID
	ENDPOINT = 'https://api.whitehouse.gov/v1/petitions.jsonp',
	timestamps = [],
	allTrends = [],
	issues = {'0': 'All',
			  '1': 'Agriculture',
			  '2': 'Arts and Humanities',
			  '3': 'Budget and Taxes',
			  '4': 'Civil Rights and Liberties',
			  '8': 'Climate Change',
			  '9': 'Consumer Protections',
			  '10': 'Criminal Justice and Law Enforcement',
			  '12': 'Defense',
			  '13': 'Disabilities',
			  '16': 'Economy',
			  '18': 'Education',
			  '19': 'Energy',
			  '20': 'Environment',
			  '21': 'Family',
			  '22': 'Firearms',
			  '24': 'Foreign Policy',
			  '193': 'Government Reform',
			  '25': 'Health Care',
			  '26': 'Homeland Security and Disaster Relief',
			  '27': 'Housing',
			  '28': 'Human Rights',
			  '29': 'Immigration',
			  '30': 'Innovation',
			  '97': 'Job Creation',
			  '103': 'Labor',
			  '109': 'Natural Resources',
			  '115': 'Postal Service',
			  '121': 'Poverty',
			  '127': 'Regulatory Reform',
			  '133': 'Rural Policy',
			  '139': 'Science and Space Policy',
			  '151': 'Small Business',
			  '145': 'Social Security',
			  '157': 'Technology and Telecommunications',
			  '163': 'Trade',
			  '169': 'Transportation and Infrastructure',
			  '175': 'Urban Policy',
			  '181': 'Veterans and Military Families',
			  '187': "Woman's Issues"};


	// Build an array of timestamps.
	//   resolution = # of days between data points.
	//   startDate = Unix Time Stamp of the earliest point on the graph.
	var defineTimeRange = function(resolution, startDate) {
		// Default arguments
		resolution = resolution || 1; // Default value is 1 day.
		startDate = startDate || 1314835200; // Default startDate is 01 Sep 2011 (just before WTP launched).
		resValue = resolution * 86400; // Unix timestamp conversion

		var nextTimestamp = new Date().getTime()/1000; // Store the current timestamp as the initial one.
		while (nextTimestamp >= startDate) {
			timestamps.push(nextTimestamp);
			nextTimestamp = nextTimestamp - resValue; // Plot resolution of 1 week
		}
		timestamps = timestamps.reverse(); // Once all are in the array, arrange them in correct order.				
	}

	// Function which uses JSON to retrieve the petition results.
	var loadPetitions = function(offset) {
		offset = offset || 0;
		$.getJSON(ENDPOINT + '?limit=1000&offset=' + offset + '&callback=?', function(data){
			var resultset = data.metadata.resultset,
			results = data.results;

			petitionData = petitionData.concat(results);
			if (resultset.count - offset > resultset.limit){
				loadPetitions(resultset.offset + resultset.limit + 1);
			} else {
				$('body').trigger('petitionsLoaded');
			}
		});
	};

	// A loop to count open petitions on a given date.
	var searchPetitions = function(timestamp, issue_name) {
		issue_name = issue_name || 'All';
		var count = 0;
		var created;
		var deadline;

		$.each(petitionData, function(index, petitionsObject) {

			if (issue_name === 'All') {
				created = petitionsObject['created'];
				deadline = petitionsObject['deadline'];
				if (created < timestamp && timestamp < deadline) {
					count++;
				}
			} else {
				if (petitionsObject.issues instanceof Array) {
					$.each(petitionsObject.issues, function(issueIndex, issueObject) {
						if(issueObject['name'] === issue_name) {
							created = petitionsObject['created'];
							deadline = petitionsObject['deadline'];
							if (created < timestamp && timestamp < deadline) {
								count++;
							}
						}
					});
				}
			}
		});

		return count;
	}

	// Function for building the chart, given structured data.
	var buildChart = function(countData) {
		$('#container').highcharts('StockChart', {
		    chart: {
		    },

		    rangeSelector: {
		        selected: 0
		    },

		    legend: {
		    	enabled: true,
		    },

		    title: {
		        text: 'Petitions Count Over Time'
		    },

		    scrollbar: {
            barBackgroundColor: 'gray',
            barBorderRadius: 7,
            barBorderWidth: 0,
            buttonBackgroundColor: 'gray',
            buttonBorderWidth: 0,
            buttonBorderRadius: 7,
            trackBackgroundColor: 'none',
            trackBorderWidth: 1,
            trackBorderRadius: 8,
            trackBorderColor: '#CCC'
        },

        plotOptions: {
            series: {
               cursor: 'pointer',
                    point: {
                        events: {
                            click: function() {
                            	console.log(this.series.name);
                            	console.log(Highcharts.dateFormat('%A, %b %e, %Y', this.x));
								
								$('.results').slideToggle();
								$('.topic').append(this.series.name);
								$('.date').append(Highcharts.dateFormat('%A, %b %e, %Y', this.x));
                            }
                        }
                    },
                    marker: {
                        lineWidth: 1
                    }
                }
            },

		    series: countData
		});
	}

	loadPetitions();
	defineTimeRange(1);

	$('body').on('petitionsLoaded', function() {
		var countLog = [];

		// To prevent storing references to countLog.
		function cloneCountLog(countLog) {
			var clone = [];
			for(var key in countLog){
				if(countLog.hasOwnProperty(key)) {
					clone[key] = countLog[key];
				}
			}
			return clone;
		}

		// loop through the issues
		$.each(issues, function(ind, issueName) {
			countLog.length = 0; // clear out the count log for each issue.
			var visibility = ((issueName === 'All') ? true : false);

			// loop through the timestamps
			$.each(timestamps, function(index, timestamp) {
				var theCount = searchPetitions(timestamp, issueName);
				countLog.push([timestamp*1000, theCount]);
			});

			allTrends.push({
				name: issueName,
				data: cloneCountLog(countLog),
				visible: visibility
			});


		});

		console.log(petitionData);
		console.log(allTrends);
		$('body').trigger('countCompleted');
	});

	$('body').on('countCompleted', function() {
		$('img.loading').hide();
		buildChart(allTrends);
	});
});
