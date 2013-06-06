$(function(){
	// Expanding options box.
	$('.title-bar').click(function() {
		$('.options').slideToggle();
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
				console.log('Raw data:');
				console.log(results);
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
				console.log('Adjusted data:');
				console.log(timeSeriesData);
				buildChart(timeSeriesData);
				$('img.loading').hide();

			},
			error: function(jqXHR, status, error) {
				console.log('error: ' + error);
				console.log('status: ' + jqXHR.status);
			}
		});
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
                            	console.log(this.series);
                            	console.log(this.series.name);
                            	console.log(this.series.userOptions.id); // The ID to pass to NYTimes
                            	console.log(this.x); // The Timestamp to pass to NYTimes
                            	console.log(Highcharts.dateFormat('%A, %b %e, %Y', this.x));
								
								if ($(".results").is(":hidden")) {
									$('.results').slideDown();
								}

								$('.topic').empty();
								$('.topic').append(this.series.name);

								$('.date').empty();
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

	loadTimeSeries();

});
