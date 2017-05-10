/**
 * tests.js : Unit tests implemented with qunit
 * 
 * Copyright 2013-2014 Mossroy and contributors
 * License GPL v3:
 * 
 * This file is part of Kiwix.
 * 
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */
define(['jquery', 'zimArchive', 'zimDirEntry', 'util', 'utf8'],
 function($, zimArchive, zimDirEntry, util, utf8) {
    
    var localZimArchive;

    
    /**
     * Make an HTTP request for a Blob and return a Promise
     * 
     * @param {String} url URL to download from
     * @param {String} name Name to give to the Blob instance
     * @returns {Promise}
     */
    function makeBlobRequest(url, name) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    var blob = new Blob([xhr.response], {type: 'application/octet-stream'});
                    blob.name = name;
                    resolve(blob);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };
            xhr.responseType = 'blob';
            xhr.send();
        });
    }
    
    // Let's try to download the ZIM files
    var zimArchiveFiles = new Array();
    
    var splitBlobs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o'].map(function(c) {
        var filename = 'wikipedia_en_ray_charles_2015-06.zima' + c;
        return makeBlobRequest('tests/' + filename, filename);
    });
    Promise.all(splitBlobs)
        .then(function(values) {
            zimArchiveFiles = values;
    }).then(function() {
        // Create a localZimArchive from selected files, in order to run the following tests
        localZimArchive = new zimArchive.ZIMArchive(zimArchiveFiles, null, function (zimArchive) {
            runTests();
        });
    });
    
    /**
     * Function to use in .fail() of an async test
     * @param e Error
     */
    function errorHandlerAsyncTest(e) {
        ok(false, "Error in async call", e);
        start();
    }
 
    var runTests = function() {

        module("environment");
        test("qunit test", function() {
            equal("test", "test", "QUnit is properly configured");
        });

        test("check archive files are read", function() {
            ok(zimArchiveFiles && zimArchiveFiles[0] && zimArchiveFiles[0].size > 0, "ZIM file read and not empty");
        });
        
        module("utils");
        test("check reading an IEEE_754 float from 4 bytes" ,function() {
           var byteArray = new Uint8Array(4);
           // This example is taken from https://fr.wikipedia.org/wiki/IEEE_754#Un_exemple_plus_complexe
           // 1100 0010 1110 1101 0100 0000 0000 0000
           byteArray[0] = 194;
           byteArray[1] = 237;
           byteArray[2] = 64;
           byteArray[3] = 0;
           var float = util.readFloatFrom4Bytes(byteArray, 0);
           equal(float, -118.625, "the IEEE_754 float should be converted as -118.625");
        });
        test("check upper/lower case variations", function() {
            var testString1 = "téléphone";
            var testString2 = "Paris";
            var testString3 = "le Couvre-chef Est sur le porte-manteaux";
            var testString4 = "épée";
            equal(util.ucFirstLetter(testString1), "Téléphone", "The first letter should be upper-case");
            equal(util.lcFirstLetter(testString2), "paris", "The first letter should be lower-case");
            equal(util.ucEveryFirstLetter(testString3), "Le Couvre-Chef Est Sur Le Porte-Manteaux", "The first letter of every word should be upper-case");
            equal(util.ucFirstLetter(testString4), "Épée", "The first letter should be upper-case (with accent)");
        });
        test("check remove duplicates of an array of title objects", function() {
            var array = [{title:"a"}, {title:"b"}, {title:"c"}, {title:"a"}, {title:"c"}, {title:"d"}];
            var expectedArray = [{title:"a"}, {title:"b"}, {title:"c"}, {title:"d"}];
            deepEqual(util.removeDuplicateTitlesInArray(array), expectedArray, "Duplicates should be removed from the array");
        });
                
        module("ZIM initialisation");
        test("ZIM archive is ready", function() {
            ok(localZimArchive.isReady() === true, "ZIM archive should be set as ready");
        });
                
        module("zim_title_search_and_read");
        asyncTest("check DirEntry.fromStringId 'A Fool for You'", function() {
            var aFoolForYouDirEntry = zimDirEntry.DirEntry.fromStringId(localZimArchive._file, "5856|7|A|0|2|A_Fool_for_You.html|A Fool for You|false|undefined");

            expect(2);
            var callbackFunction = function(title, htmlArticle) {
                ok(htmlArticle && htmlArticle.length > 0, "Article not empty");
                // Remove new lines
                htmlArticle = htmlArticle.replace(/[\r\n]/g, " ");
                ok(htmlArticle.match("^.*<h1[^>]*>A Fool for You</h1>"), "'A Fool for You' title somewhere in the article");
                start();
            };
            localZimArchive.readArticle(aFoolForYouDirEntry, callbackFunction);
        });
        asyncTest("check findTitlesWithPrefix 'A'", function() {
            expect(2);
            var callbackFunction = function(titleList) {
                ok(titleList && titleList.length === 5, "Article list with 5 results");
                var firstTitle = titleList[0];
                equal(firstTitle.title , 'A Fool for You', 'First result should be "A Fool for You"');
                start();
            };
            localZimArchive.findTitlesWithPrefix('A', 5, callbackFunction);
        });
        asyncTest("check findTitlesWithPrefix 'a'", function() {
            expect(2);
            var callbackFunction = function(titleList) {
                ok(titleList && titleList.length === 5, "Article list with 5 results");
                var firstTitle = titleList[0];
                equal(firstTitle.title , 'A Fool for You', 'First result should be "A Fool for You"');
                start();
            };
            localZimArchive.findTitlesWithPrefix('a', 5, callbackFunction);
        });
        asyncTest("check findTitlesWithPrefix 'blues brothers'", function() {
            expect(2);
            var callbackFunction = function(titleList) {
                ok(titleList && titleList.length === 3, "Article list with 3 result");
                var firstTitle = titleList[0];
                equal(firstTitle.title , 'Blues Brothers (film)', 'First result should be "Blues Brothers (film)"');
                start();
            };
            localZimArchive.findTitlesWithPrefix('blues brothers', 5, callbackFunction);
        });
        asyncTest("article '(The Night Time Is) The Right Time' correctly redirects to 'Night Time Is the Right Time'", function() {
            expect(6);
            localZimArchive.getTitleByName("A/(The_Night_Time_Is)_The_Right_Time.html").then(function(title) {
                ok(title !== null, "Title found");
                if (title !== null) {
                    ok(title.isRedirect(), "Title is a redirect.");
                    equal(title.name(), "(The Night Time Is) The Right Time", "Correct redirect title name.");
                    localZimArchive.resolveRedirect(title, function(title) {
                        ok(title !== null, "Title found");
                        ok(!title.isRedirect(), "Title is not a redirect.");
                        equal(title.name(), "Night Time Is the Right Time", "Correct redirected title name.");
                        start();
                    });
                } else {
                    start();
                }
            }).fail(errorHandlerAsyncTest);
        });
        asyncTest("article 'Raelettes' correctly redirects to 'The Raelettes'", function() {
            expect(6);
            localZimArchive.getTitleByName("A/Raelettes.html").then(function(title) {
                ok(title !== null, "Title found");
                if (title !== null) {
                    ok(title.isRedirect(), "Title is a redirect.");
                    equal(title.name(), "Raelettes", "Correct redirect title name.");
                    localZimArchive.resolveRedirect(title, function(title) {
                        ok(title !== null, "Title found");
                        ok(!title.isRedirect(), "Title is not a redirect.");
                        equal(title.name(), "The Raelettes", "Correct redirected title name.");
                        start();
                    });
                } else {
                    start();
                }
            }).fail(errorHandlerAsyncTest);
        });
        asyncTest("article 'Bein Green' correctly redirects to 'Bein' Green", function() {
            expect(6);
            localZimArchive.getTitleByName("A/Bein_Green.html").then(function(title) {
                ok(title !== null, "Title found");
                if (title !== null) {
                    ok(title.isRedirect(), "Title is a redirect.");
                    equal(title.name(), "Bein Green", "Correct redirect title name.");
                    localZimArchive.resolveRedirect(title, function(title) {
                        ok(title !== null, "Title found");
                        ok(!title.isRedirect(), "Title is not a redirect.");
                        equal(title.name(), "Bein' Green", "Correct redirected title name.");
                        start();
                    });
                } else {
                    start();
                }
            }).fail(errorHandlerAsyncTest);
        });
        asyncTest("article 'America, the Beautiful' correctly redirects to 'America the Beautiful'", function() {
            expect(6);
            localZimArchive.getTitleByName("A/America,_the_Beautiful.html").then(function(title) {
                ok(title !== null, "Title found");
                if (title !== null) {
                    ok(title.isRedirect(), "Title is a redirect.");
                    equal(title.name(), "America, the Beautiful", "Correct redirect title name.");
                    localZimArchive.resolveRedirect(title, function(title) {
                        ok(title !== null, "Title found");
                        ok(!title.isRedirect(), "Title is not a redirect.");
                        equal(title.name(), "America the Beautiful", "Correct redirected title name.");
                        start();
                    });
                } else {
                    start();
                }
            }).fail(errorHandlerAsyncTest);
        });
        asyncTest("Image 'm/RayCharles_AManAndHisSoul.jpg' can be loaded", function() {
            expect(4);
            localZimArchive.getTitleByName("I/m/RayCharles_AManAndHisSoul.jpg").then(function(title) {
                ok(title !== null, "Title found");
                if (title !== null) {
                    equal(title.url, "I/m/RayCharles_AManAndHisSoul.jpg", "URL is correct.");
                    localZimArchive.readBinaryFile(title, function(title, data) {
                        equal(data.length, 4951, "Data length is correct.");
                        var beginning = new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70,
                                                         73, 70, 0, 1, 1, 0, 0, 1]);
                        equal(data.slice(0, beginning.length).toSource(), beginning.toSource(), "Data beginning is correct.");
                        start();
                    });
                } else {
                    start();
                }
            }).fail(errorHandlerAsyncTest);
        });
        asyncTest("Stylesheet '-/s/style.css' can be loaded", function() {
            expect(4);
            localZimArchive.getTitleByName("-/s/style.css").then(function(title) {
                ok(title !== null, "Title found");
                if (title !== null) {
                    equal(title.url, "-/s/style.css", "URL is correct.");
                    localZimArchive.readBinaryFile(title, function(title, data) {
                        equal(data.length, 104495, "Data length is correct.");
                        data = utf8.parse(data);
                        var beginning = "\n/* start http://en.wikipedia.org/w/load.php?debug=false&lang=en&modules=site&only=styles&skin=vector";
                        equal(data.slice(0, beginning.length), beginning, "Content starts correctly.");
                        start();
                    });
                } else {
                    start();
                }
            }).fail(errorHandlerAsyncTest);
        });
        asyncTest("Javascript '-/j/local.js' can be loaded", function() {
            expect(4);
            localZimArchive.getTitleByName("-/j/local.js").then(function(title) {
                ok(title !== null, "Title found");
                if (title !== null) {
                    equal(title.url, "-/j/local.js", "URL is correct.");
                    localZimArchive.readBinaryFile(title, function(title, data) {
                        equal(data.length, 41, "Data length is correct.");
                        data = utf8.parse(data);
                        var beginning = "console.log( \"mw.loader";
                        equal(data.slice(0, beginning.length), beginning, "Content starts correctly.");
                        start();
                    });
                }   
                else {
                    start();
                }
            }).fail(errorHandlerAsyncTest);
        });
        asyncTest("Split article 'A/Ray_Charles.html' can be loaded", function() {
            expect(6);
            localZimArchive.getTitleByName("A/Ray_Charles.html").then(function(title) {
                ok(title !== null, "Title found");
                if (title !== null) {
                    equal(title.url, "A/Ray_Charles.html", "URL is correct.");
                    localZimArchive.readArticle(title, function(titleName, data) {
                        equal(titleName, "Ray Charles", "Title is correct.");
                        equal(data.length, 157186, "Data length is correct.");
                        equal(data.indexOf("the only true genius in show business"), 5535, "Specific substring at beginning found.");
                        equal(data.indexOf("Random Access Memories"), 154107, "Specific substring at end found.");
                        start();
                    });
                } else {
                    start();
                }
            }).fail(errorHandlerAsyncTest);
        });
        
        module("zim_random_and_main_title");
        asyncTest("check that a random title is found", function() {
            expect(2);
            var callbackRandomTitleFound = function(title) {
                ok(title !== null, "One title should be found");
                ok(title.name() !== null, "The random title should have a name" );
               
                start();
            };
            localZimArchive.getRandomTitle(callbackRandomTitleFound);
        });
        asyncTest("check that the main title is found", function() {
            expect(2);
            var callbackMainPageTitleFound = function(title) {
                ok(title !== null, "Main title should be found");
                equal(title.name(), "Summary", "The main title should be called Summary" );
               
                start();
            };
            localZimArchive.getMainPageTitle(callbackMainPageTitleFound);
        });
    };
});
