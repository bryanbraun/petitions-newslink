$(function(){
	// Expanding help box.
	$('.title-bar').click(function() {
		$('.help').slideToggle();
	});

	// Create and initialize variables.
	var timeSeriesData,
	timeSeriesAPI = 'http://wethedata.herokuapp.com/issues';

	/*
	// Issues array... just keeping it here for reference, for now.
	var issues = {'0': 'All',
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
	*/

	// A function that pulls in timeseries data from the Heroku API.
	var loadTimeSeries = function(id) {
		id = id || '';
		path_id = '/' + id;

		var path = timeSeriesAPI + path_id;
	
		$.ajax({
			type: 'GET',
    		url: path,
    		dataType:'jsonp',
    		async: true,
    		success: function(data, status){
				var adjusted = [],
				visibility;
				
				results = data;
				$.each(results, function(index, issueObject){

					if(issueObject.issue.id === 0) {
						visibility = true;
					} else if(issueObject.issue.id === id) {
						visibility = true;
					} else {
						visibility = false;
					}

					issueObject.issue.visible = visibility;
					adjusted.push(issueObject.issue);
				});

				timeSeriesData = adjusted;
				buildChart(timeSeriesData);
				$('img.loading').hide();

			},
			error: function(jqXHR, status, error) {
				console.log('error: ' + error);
				console.log('status: ' + jqXHR.status);
			}
		});
	}

	// uses the contents of topPetitionData to build a list.
	var buildRelevantResultsList = function(results) {
		var petitionList = '',
		petitionItem,
		newsList = '',
		newsItem;

		// Hide loading wheel and populate new data.
		$('img.loading-sm').hide();

		$.each(results.data.articles, function(index, article) {
			newsItem = '<li><a title="' + article.title + '" href="' + article.url + '">' + article.title + '</a></li>';
			newsList += newsItem;
		});
		$.each(results.data.petitions, function(index, petition) {
			petitionItem = '<li><a title="' + petition.title + '" href="' + petition.url + '">' + petition.title + '</a></li>';
			petitionList += petitionItem;
		});

		$('.petition-list').append(petitionList);
		$('.news-list').append(newsList);
	}

	// A function for building the chart, given structured data.
	var buildChart = function(countData) {
		$('#container').highcharts('StockChart', {
		    chart: {
		    },

		    rangeSelector: {
		        selected: 0
		    },

		    legend: {
		    	enabled: true,
		    	verticalAlign: 'top',
		    	align: 'center',
		    	floating: false,
		    	width: 770
		    },

		    title: {
		        text: null
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
                            	$('img.loading-sm').show(); // Show mini loading wheel.

                            	$('html, body').animate({
        							scrollTop: $("#results-box").offset().top
    							}, 2000);

                            	console.log('Topic: ' + this.series.name); // Topic name.
                            	console.log('Topic ID: ' + this.series.userOptions.id); // The ID to pass to getPetitionData.
                            	console.log('Timestamp: ' + this.x); // The Timestamp to pass to getPetitionData.
								
								if ($(".results").is(":hidden")) {
									$('.results').slideDown();
								}

								// Clear out all old data, and start populating new data.
								$('.topic').empty();
								$('.date').empty();
								$('.petition-list').empty();
								$('.news-list').empty();

								$('.topic').append(this.series.name);
								$('.date').append(Highcharts.dateFormat('%A, %b %e, %Y', this.x));

								// Call for new relevant data to be populated.
								newsfinder.getPetitionData(this.x, this.series.userOptions.id, buildRelevantResultsList);
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

	loadTimeSeries();

});
