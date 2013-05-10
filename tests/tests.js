define(function (require) {
	
	var $ = require('zepto');
	var evopedia = require('evopedia');
	
	// Due to security restrictions in the browsers,
	// we can not read directly the files and run the unit tests
	// The user has to select them manually, then launch the tests
	$('#runTests').on('click', function(e) {
    	runTests();
    });
	
	var runTests = function() {
		
		module("environment");
		test("qunit test", function() {
			equal("test", "test", "QUnit is properly configured");
		});
		
		test("check title and data files are set", function(){
			var titleFile = document.getElementById('titleFile').files[0];
			var dataFiles = document.getElementById('dataFiles').files;
			ok(titleFile && titleFile.size>0,"Title file set and not empty");
			ok(dataFiles && dataFiles[0] && dataFiles[0].size>0,"First data file set and not empty");
		});
		
		// Create a localArchive from selected files, in order to run the following tests
		var localArchive = new evopedia.LocalArchive();
		localArchive.titleFile = document.getElementById('titleFile').files[0];
		localArchive.dataFiles = document.getElementById('dataFiles').files;
		localArchive.language = "small";
		localArchive.date = "2010-08-14";
		
		module("evopedia");
		asyncTest("check getTitlesStartingAtOffset 0", function(){
			var callbackFunction = function(titleList) {
				equal(titleList.length, 4, "4 titles found, as requested");
				var indexAbraham=-1;
				for (var i=0; i<titleList.length; i++) {
					if (titleList[i] && titleList[i].name == "Abraham") {
						indexAbraham=i;
					}
				}
				ok(indexAbraham>-1,"Title 'Abraham' found");
				var firstTitleName = "not found";
				var secondTitleName = "not found";
				if (titleList.length>=1 && titleList[0]) {
					firstTitleName = titleList[0].name;
				}
				if (titleList.length>=2 && titleList[1]) {
					secondTitleName = titleList[1].name;
				}
				equal(firstTitleName,"Abbasid_Caliphate","First article name is 'Abbasid_Caliphate'");
				equal(secondTitleName,"Abortion","Second article name is 'Abortion'");
				start();
			};
			localArchive.getTitlesStartingAtOffset(0, 4, callbackFunction);
		});
		
		asyncTest("check findTitlesWithPrefix Am", function() {
			var callbackFunction = function(titleList) {
				ok(titleList && titleList.length>0,"At least one title is found");
				var firstTitleName = "not found";
				var secondTitleName = "not found";
				if (titleList.length>=1 && titleList[0]) {
					firstTitleName = titleList[0].name;
				}
				if (titleList.length>=2 && titleList[1]) {
					secondTitleName = titleList[1].name;
				}
				equal(firstTitleName,"Amazon_River","First article name is 'Amazon_River'");
				equal(secondTitleName,"American_Civil_War","Second article name is 'American_Civil_War'");
				equal(titleList.length,4,"4 titles should be found");
				start();
			};
			localArchive.findTitlesWithPrefix("Am", callbackFunction);
		});
		
		// Create a title instance for the Article 'Abraham'
		var titleAbraham = new evopedia.Title();
		titleAbraham.archive = localArchive;
		titleAbraham.articleLength = 10071;
		titleAbraham.blockOffset = 127640;
		titleAbraham.blockStart = 2364940;
		titleAbraham.fileNr = 0;
		titleAbraham.name = "Abraham";
		titleAbraham.titleOffset = 57;
		
		// TODO check parseTitle for Abraham, and for another one with escape characters
		
		asyncTest("check getTitleByName with accents : Diego Velázquez", function() {
			var callbackFunction = function(titleList) {
				ok (titleList && titleList.length==1,"One title found");
				equal(titleList[0].name,"Diego_Velázquez","Name of the title is correct");
				start();
			};
			localArchive.getTitleByName("Diego Velázquez",callbackFunction);
		});
		asyncTest("check getTitleByName with quote : Hundred Years' War", function() {
			var callbackFunction = function(titleList) {
				ok (titleList && titleList.length==1,"One title found");
				equal(titleList[0].name,"Hundred_Years'_War","Name of the title is correct");
				start();
			};
			localArchive.getTitleByName("Hundred Years' War",callbackFunction);
		});
		
		test("check parseTitleFromId", function() {
			var titleId = "small|2010-08-14|0|57|Abraham|2364940|127640|10071";
			var title = evopedia.Title.parseTitleId(localArchive,titleId);
			ok(title,"Title instance created");
			deepEqual(title,titleAbraham,"Parsing from titleId gives Abraham title");
		});
		
		asyncTest("check readArticle", function(){
			var callbackFunction = function(htmlArticle) {
				ok(htmlArticle && htmlArticle.length>0,"Article not empty");
				// Remove new lines
				htmlArticle = htmlArticle.replace(/[\r\n]/g, " ");
				ok(htmlArticle.match("^[ \t]*<h1[^>]*>Abraham</h1>"),"'Abraham' title at the beginning");
				ok(htmlArticle.match("</div>[ \t]$"),"</div> at the end");
				start();
			};			
			localArchive.readArticle(titleAbraham, callbackFunction);
		});
	};
});
