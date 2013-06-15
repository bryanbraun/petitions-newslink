/**
 * newsfinder.js:   jquery module that handles lookup of news related to a particular day (optionally limited by issue).
 * 
 * REQUIRES jQuery
 * 
 * RELIES ON:
 * WeTheEntites API - http://wetheentities.herokuapp.com/ - for semantic analysis of petition text
 * NYTimes Aritcle Search API v2 - http://api.nytimes.com/svc/search/v2/articlesearch
 * 
 * TODOs:
 * getStrongestTheme can return a comma-delimited list of themes and this is not properly accounted for in NYTimes news search
 * 
 * when no articles are returned on a theme, the entities could be searched as oftentimes one or the other would make a good search term
 * 
 */
;var newsfinder = (function($) {
    var timesAPIKey = '27a5d4e81f538c940f9547f669fa3361:0:67663443'; // key to allow NYTimes article search api calls
    var timesArticleAPI = 'http://api.nytimes.com/svc/search/v2/articlesearch.jsonp'; // endpoint for NYTimes article search calls
    var entitiesAPI = 'http://wetheentities.herokuapp.com/petitions/'; // endpoint for entity data calls
    var cachedDataAPI = '/petitions/'; // endpoint for caching data calls
    var articleLimit = 5; // maximum number of articles to return
    var petitionLimit = 5; // maximum number of petitions to return
    
    // private properties
    var clientCallback;
    var topPetitionData = [];
    var articleData = [];
    var petitionIndex = 0;
    var searchStartEpoch = 0;
    var searchEndEpoch = 1;
    var searchIssueId = 0;
    
    /**
     * Gets the strongest theme from the Semantria analysis of the petition via the We The Entities API.
     * 
     * @param {String} petitionId the id of the petition to search
     * @param {Function} callback function with strongest theme data
     */
    var getStrongestTheme = function(petitionId,callback) {
        $.ajax({
            type: 'GET',
            url: entitiesAPI + petitionId + '.js',
            dataType: 'jsonp',
            success: function(data,status) {
                var strongest = '';
                var highestStrength = 0;
                var highestEvidence = 0;

                if (data.semantria.themes) {
                    var num = data.semantria.themes.length;
                    for (var i=0; i<num; i++) {
                        var theme = data.semantria.themes[i];
                        if (theme.evidence > highestStrength) {
                            highestEvidence = theme.evidence;
                            highestStrength = theme.strength_score;
                            strongest = theme.title;
                        } else if (theme.evidence == highestEvidence) {
                            if (theme.strength_score > highestStrength) {
                                strongest = theme.title;
                                highestStrength = theme.strength_score;
                            } else if (theme.strength == highestStrength) {
                                strongest += ',' + theme.title;
                            }
                        }
                    }
                }
                callback({
                    success:    true,
                    data:       strongest
                });
            },
            error: function(jqXHR, status, error) {
                callback({
                    success:    false,
                    message:    'Error retrieving data analysis: ' + error
                });
            }
        });
    };
    
    /**
     * Gets the top petitions by date and issue.
     * @param {int} petitionEpoch the date to search from as the number of milliseconds since unix epoch
     * @param {int} issueId the id of an issue to use for filtering (leave blank or pass 0 for all)
     * @param {Function} callback the callback function upon completion
     */
    var getTopPetitions = function(petitionEpoch,issueId,callback) {
        issueId = (issueId == undefined) ? 0 : issueId; // default to "All" issue (id=1);
        var startEpoch = 0;
        var endEpoch = 1;
        if (petitionEpoch != undefined) {
            var startDate = new Date();
            var endDate;
            startDate.setTime(petitionEpoch);
            startDate.setHours(0);
            startDate.setMinutes(0);
            startDate.setSeconds(0);
            startEpoch = startDate.getTime();
            endEpoch = startDate.getTime() + 2592000000; // 30 days * 24 hours/day * 60 min/hour * 60 sec/min * 1000 ms/sec     
            
            // API expects seconds since epoch - not ms
            startEpoch /= 1000;
            endEpoch /= 1000;
        }
        $.ajax({
            type:   'GET',
            url:    cachedDataAPI + startEpoch + '/' + endEpoch + '/' + issueId,
            //url: cachedDataAPI + '0/1/' + issueId,
            dataType: 'jsonp',
            success: function(data,status) {
                var num = data.length;
                var petitions = [];
                var ids = {};
                var count = 0;
                for (var i=0; i<num; i++) {
                    if (count === petitionLimit) {
                        break;
                    }
                    var currentObj = data[i].petition;
                    if (typeof(ids[currentObj.identifier]) == 'undefined') {
                        // results can contain duplicates
                        petitions.push({
                            id: currentObj.identifier,
                            title: currentObj.title,
                            url: currentObj.url
                        });
                        ids[currentObj.identifier] = true;
                        count++;
                    }
                }
                callback({
                    success:    true,
                    data:       petitions
                });
            },
            error: function (jqXHR, status, error) {
                callback({
                    success:    false,
                    message:    'Error retrieving most popular petitions: ' + error
                });
            }
        });  
    };
    
    /**
     * Format a date in the required format for NY Times API Searches
     * @param {Int} toFormat the date to format as milliseconds since unix epoch
     * @returns the formatted date string
     */
    var formatDateForNYTimes = function(toFormat) {
        var formatted = '';
        var month = '';
        var day = '';
        var toFormatDate = new Date();
        toFormatDate.setTime(toFormat);
        formatted = toFormatDate.getFullYear();
        month = String(toFormatDate.getMonth()+1);
        if (month.length === 1) {
            month = '0' + month;
        }
        day = String(toFormatDate.getDate());
        if (day.length === 1) {
            day = '0' + day;
        }
        formatted += month + day;
        return formatted;
    };
    
    /**
     * Retrieves the related news from the NY Times article search API
     * @param {String} searchTerm the term to search on
     * @param {Int} startEpoch the start date to search as milliseconds since unix epoch (or 0 for all)
     * @param {Int} endEpoch the end date to search as millisecons since unix epoch (or 1 for all)
     * @param {Function} callback the callback function on completion
     * @returns void
     */
    var getRelatedNews = function(searchTerm, startEpoch, endEpoch, callback) {
        var searchPhrase = '"' + searchTerm + '"';
        $.ajax({
            type:   'GET',
            url:    timesArticleAPI,
            data: {
                'q':    searchPhrase,
                'facet_field':   'section_name',
                'begin_date': formatDateForNYTimes(startEpoch),
                'end_date': formatDateForNYTimes(endEpoch),
                'fq':  'document_type:("article")',
                'api-key':  timesAPIKey
            },
            dataType: 'jsonp',
            jsonpCallback: 'svc_search_v2_articlesearch', // name required by NYTimes API
            success: function(data,status) {
                var articles = [];
                var num = data.response.docs.length;
                for (var i=0; i<num; i++) {
                    var article = data.response.docs[i];
                    if (i > articleLimit) {
                        break;
                    }
                    articles.push({
                        'title':    article.headline.main,
                        'url':      article.web_url,
                        'abstract': (article.abstract == null) ? article.lead_paragraph : article.abstract
                    });
                }
                callback({
                    success:    true,
                    data:       articles
                });
            },
            error: function(jqXHR,status,error) {
                callback({
                    success:    false,
                    message:    'Error retrieving related NY Times articles: ' + error
                });
                console.log("Error");
            }
        });
    };
    
    /**
     * Retrieves the related news for the top 5 petitions at a particular date optionally limited by an issue
     * @param {int} petitionEpoch the date to search from as the number of milliseconds since unix epoch
     * @param {int} issueId the id of an issue to use for filtering (leave blank or pass 0 for all)
     * @param {Function} callback the callback function upon completion
     */
    var getPetitionData = function(petitionEpoch,issueId,callback) {
        searchStartEpoch = petitionEpoch - 604800000; // petition date - 7 days*24 hour/day*60 min/hour * 60 sec/min*1000 ms/sec
        searchEndEpoch = petitionEpoch + 604800000;
        searchIssueId = issueId;
        clientCallback = callback;
        // get the top petitions for the time and issue
        getTopPetitions(petitionEpoch,issueId,onTopPetitions);
    }
    
    /**
     * Internal callback when top petitions have been retrieved
     * @param {Object} result includes success and data (if successful) or success and message (if unsuccessful)
     * @returns {void}
     */
    var onTopPetitions = function(result) {
        if (result.success) {
            topPetitionData = result.data;
            petitionIndex = 0;

            if (topPetitionData.length == 0) {
                returnResults();
            } else {
                getStrongestTheme(topPetitionData[petitionIndex].id,onPetitionAnalysis);
            }
        } else {
            clientCallback(result);
        }
    }
    
    /**
     * Internal callback when petition semantic analysis is complete
     * @param {Object} result includes success and data (if successful) or success and message (if unsuccessful)
     * @returns {void}
     */
    var onPetitionAnalysis = function(result) {
        if (result.success) {
            // TODO: data can be a list of terms....
            getRelatedNews(result.data,searchStartEpoch,searchEndEpoch,onRelatedNews);
        } else {
            clientCallback(result);
        }
    }
    
    /**
     * Internal callback when NYTimes article search call is complete
     * @param {Object} result includes success and data (if successful) or success and message (if unsuccessful)
     * @returns {void}     
     */
    var onRelatedNews = function(result) {
        if (result.success) {
            $.merge(articleData, result.data);
            if (petitionIndex == (topPetitionData.length-1) || articleData.length >= articleLimit) {
                // there are enough articles to return or we've gotten all we can
                if (articleData.length > articleLimit) {
                    articleData = articleData.slice(0,articleLimit);
                }
                returnResults();
            } else {
                // get the theme and news for the next petition in the list
                petitionIndex++;
                getStrongestTheme(topPetitionData[petitionIndex].id,onPetitionAnalysis);
            }
        } else {
            clientCallback(result);
        }
    }
    
    /**
     * Generate a successful result object and return to callback
     * @returns {void}
     */
    var returnResults = function() {
        clientCallback({
            success:    true,
            data:       {
                petitions:  topPetitionData,
                articles:   articleData
            }
        });
    }
    
    /**
     * Return publically available properties and methods
     */
    return {
        timesAPIKey: timesAPIKey,
        timesArticleAPI: timesArticleAPI,
        entitiesAPI: entitiesAPI,
        cachedDataAPI: cachedDataAPI,
        articleLimit: articleLimit,
        petitionLimit: petitionLimit,
        
        getStrongestTheme: getStrongestTheme,
        getTopPetitions: getTopPetitions,
        getRelatedNews: getRelatedNews,
        getPetitionData: getPetitionData
    };
})(jQuery);