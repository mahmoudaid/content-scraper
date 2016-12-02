/**
* Author: Mahmoud Eid.
* Description: NodeJs Content Scraper "console project".
*/

(function(){

	'use strict';

	/*eslint no-console: ["error", { allow: ["log","warn", "error"] }] */

	var http = require('http');
	var fs = require('fs');

	/**
	 * Cheerio
	 *
	 * Cheerio implements a subset of core jQuery. Cheerio removes all the DOM inconsistencies and browser cruft from the jQuery library,
	 * revealing its truly gorgeous API.
	 *
	 * Reasons for choice:
	 *		1- When googling "nodejs scraper" the top few articles mention the use of 'Cheerio'.
	 *		2- Popular package: 2,435,650 downloads in the last month.
	 *		3- Active:  51 releases, most recent from one month.
	 *		4- Many contributors: 79
	 *		5- well documented.
	*/
	var cheerio = require('cheerio');


	/**
	 * json2csv
	 *
	 * Converts json into csv with column titles and proper line endings. Can be used as a module and from the command line.
	 *
	 * Reasons for choice:
	 *		1- Easy to use.
	 *		2- Popular package: 113,491 downloads in the last month.
	 *		3- Active:  35 releases, most recent from 9 days ago.
	 *		4- Many contributors: 34
	 *		5- well documented.
	*/
	var json2csv = require('json2csv');


	var siteUrl = 'www.shirts4mike.com';
	var shirts = [];
	var counter = 0;
	var $;

	/**
	 * The following functions is the main function of this app.
	 * When this function run get all shirts links in page.
	 * Then loop through all shirts links and call getShirtDetails function
	 * Which get the details of shirt and save it to file.
	 */
	function scanShirtsLinks() {

		var options = {
			hostname: siteUrl,
			path: '/shirts.php'
		};

		var request = http.request(options, (response) => {
			var body = '';
			// when receiving request data
			response.on('data', (chunk) => {
				body += chunk;
			});

			// when receiving data end
			response.on('end', () => {
				$ = cheerio.load(body);
				var productsLinks = $('ul.products li a');
				for (var i = 0; i < productsLinks.length; i++) {
					getShirtDetails(productsLinks[i].attribs.href, productsLinks.length);
				}
			});
		});

		// Check for errors
		request.on('error', (error) => {
			console.log(`problem with scan shirts links request: ${error.message}`);
			logToFile(`problem with scan shirts links request: ${error.message}`);
		});

		// End request
		request.end();
	}


	/**
	 * Get shirt details.
	 * When number of counter "count how many times this function run".
	 * Equal number of productsCount it's convert pushed data to shirts array variable to csv data.
	 * And save them to A file with current date name.  
	 * @param {string} productLink - product URI.
	 * @param {integer} productsCount - number of shirts .
	 */
	function getShirtDetails(productLink, productsCount) {

		var shirtRequestOptions = {
			hostname: siteUrl,
			path: '/'+productLink
		};

		var shirtRequest = http.request(shirtRequestOptions, (shirtResponse) => {

			var shirtBody = '';

			shirtResponse.on('data', (chunk) => {
				shirtBody += chunk;
			});

			shirtResponse.on('end', () => {
				$ = cheerio.load(shirtBody);
				var price = $('.shirt-details h1 .price').text();
				var title = $('.shirt-details h1').after($('span')).text();
				var ImageURL = siteUrl+'/'+$('.shirt-details img').attr('src');
				var time = new Date().toLocaleString();

				var shirt = {
					Title: title,
					Price: price,
					ImageURL: ImageURL,
					URL: siteUrl+'/'+productLink,
					Time: time
				};
				// Push shirt to shirts array variable
				shirts.push(shirt);
				counter ++;

				if(counter === productsCount){
					var fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];
					var csv = json2csv({ data: shirts, fields: fields });
					var dir = './data';
					// check if data folder dosn't exist
					if (!isDirSync(dir)){
						// create new folder
						fs.mkdirSync(dir);
					}

					var date = new Date();
					date.setDate(date.getDate());
					var day = date.getDate();
					var month = date.getMonth() + 1;
					var year = date.getFullYear();
					var fileName = year+'-'+month+'-'+day;

					// Save csv data to new file at data folder
					fs.writeFile(__dirname + '/data/'+fileName+'.csv', csv, function(error) {
						if (error) throw error;
						console.log('File created successfully');
					});
				}
				
			});

		});

		// Check for errors
		shirtRequest.on('error', (error) => {
			console.log(`problem with git shirt details request: ${error.message}`);
			logToFile(`problem with git shirt details request: ${error.message}`);
		});

		// End request
		shirtRequest.end();
	}

	/**
	 * Check if directory or file exit.
	 * @param {string} aPath.
	 */
	function isDirSync(aPath) {
		try {
			var stats = fs.statSync(aPath);
			if (stats) return true;
		}
		catch(error) {
			return false
		}
	}

	/**
	 * The following function check if log file dosn't exit
	 * it will create new file and append log message with current data.
	 * @param {string} message - the error message.
	 */
	function logToFile(message) {
		var file = 'scraper-error.log';
		var log = '['+new Date()+']'+ '\r\n';
		log += message+ '\r\n';

		if (!isDirSync(file)){
			fs.writeFile(file, log, function(error) {
				if (error) throw error;
			});
		}else{
			fs.appendFile(file, log, (error) => {
				if (error) throw error;
			});
		}
	}

	// Run the main function.
	scanShirtsLinks();
})();