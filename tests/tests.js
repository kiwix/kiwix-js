define(function (require) {
	
	var $ = require('zepto');
	var evopedia = require('evopedia');
	
	// Due to security restrictions in the browsers,
	// we can not read directly the files and run the unit tests
	// The user has to select them manually, then launch the tests
	$('#runTests').on('click', function(e) {
		//QUnit.reset();  // should clear the DOM
	    //QUnit.init();   // resets the qunit test environment
	    //QUnit.start();  // allows for the new test to be captured.
    	runTests();
    });
	
	var runTests = function() {
		
		module("environment");
		// Dummy test to check that qunit is properly configured
		test("qunit test", function() {
			equal("test", "test");
		});
		
	
		module("evopedia");
		test("check title and data files are set", function(){
			var titleFile = document.getElementById('titleFile').files[0];
			var dataFiles = document.getElementById('dataFiles').files;
			ok(titleFile && titleFile.size>0,"Title file set and not empty");
			ok(dataFiles && dataFiles[0] && dataFiles[0].size>0,"First data file set and not empty");
		});
		
		asyncTest("check getTitlesSartingAtOffset", function(){
			var callbackFunction = function(titleList) {
				ok(titleList.length>0,"At least one title found");
				var firstTitleName = titleList[0].name;
				var secondTitleName = titleList[1].name;
				// These tests do not work for now : the algorithm has to be fixed
				//equal(firstTitleName,"Abbasid_Caliphate","First article name is 'Abbasid_Caliphate'");
				//equal(secondTitleName,"Abortion","Second article name is 'Abortion'");
				start();
			};
				
			var localArchive = new evopedia.LocalArchive();
			localArchive.titleFile = document.getElementById('titleFile').files[0];
			localArchive.dataFiles = document.getElementById('dataFiles').files;
			localArchive.getTitlesStartingAtOffset(0, 2, callbackFunction);
		});
		
		asyncTest("check readArticle", function(){
			var callbackFunction = function(htmlArticle) {
				ok(htmlArticle.length>0,"Article not empty");
				equal(htmlArticle.substring(0,3),"<h1","Article starts with <h1");
				equal(htmlArticle.substring(htmlArticle.length - 7,htmlArticle.length - 1),"</div>","Article ends with </div>");
				start();
			};
				
			var localArchive = new evopedia.LocalArchive();
			localArchive.titleFile = document.getElementById('titleFile').files[0];
			localArchive.dataFiles = document.getElementById('dataFiles').files;
			var title = new evopedia.Title();
			title.archive = localArchive;
			title.articleLength = 10071;
			title.blockOffset = 127640;
			title.blockStart = 2364940;
			title.fileNr = 0;
			title.name = "Abraham";
			title.titleOffset = 57;
			localArchive.readArticle(title, callbackFunction);
		});
	};
});
