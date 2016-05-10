/**
 * tests.js : Unit tests implemented with qunit
 * 
 * Copyright 2013-2014 Mossroy and contributors
 * License GPL v3:
 * 
 * This file is part of Evopedia.
 * 
 * Evopedia is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Evopedia is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Evopedia (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */
define(['jquery', 'title', 'archive', 'zimArchive', 'zimDirEntry', 'util', 'geometry', 'utf8'],
 function($, evopediaTitle, evopediaArchive, zimArchive, zimDirEntry, util, geometry, utf8) {
    
    var localEvopediaArchive;
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
    
    // Let's try to download the Evopedia and ZIM files
    var evopediaArchiveFiles = new Array();
    var zimArchiveFiles = new Array();
    
    var blob1 = makeBlobRequest('tests/wikipedia_small_2010-08-14/wikipedia_00.dat', 'wikipedia_00.dat');
    var blob2 = makeBlobRequest('tests/wikipedia_small_2010-08-14/titles.idx', 'titles.idx');
    var blob3 = makeBlobRequest('tests/wikipedia_small_2010-08-14/metadata.txt', 'metadata.txt');
    var blob4 = makeBlobRequest('tests/wikipedia_small_2010-08-14/math.idx', 'math.idx');
    var blob5 = makeBlobRequest('tests/wikipedia_small_2010-08-14/math.dat', 'math.dat');
    var blob6 = makeBlobRequest('tests/wikipedia_small_2010-08-14/coordinates_01.idx', 'coordinates_01.idx');
    var blob7 = makeBlobRequest('tests/wikipedia_small_2010-08-14/coordinates_02.idx', 'coordinates_02.idx');
    var blob8 = makeBlobRequest('tests/wikipedia_small_2010-08-14/coordinates_03.idx', 'coordinates_03.idx');
    var blob9 = makeBlobRequest('tests/wikipedia_en_ray_charles_2015-06.zim', 'wikipedia_en_ray_charles_2015-06.zim');
    Promise.all([blob1, blob2, blob3, blob4, blob5, blob6, blob7, blob8, blob9])
        .then(function(values) {
            evopediaArchiveFiles.push(values[0]);
            evopediaArchiveFiles.push(values[1]);
            evopediaArchiveFiles.push(values[2]);
            evopediaArchiveFiles.push(values[3]);
            evopediaArchiveFiles.push(values[4]);
            evopediaArchiveFiles.push(values[5]);
            evopediaArchiveFiles.push(values[6]);
            evopediaArchiveFiles.push(values[7]);
            zimArchiveFiles.push(values[8]);
    }).then(function() {
        // Create a localEvopediaArchive and a localZimArchive from selected files, in order to run the following tests
        localEvopediaArchive = new evopediaArchive.LocalArchive();
        localEvopediaArchive.initializeFromArchiveFiles(evopediaArchiveFiles, function(archive) {
            localZimArchive = new zimArchive.ZIMArchive(zimArchiveFiles, null, function (zimArchive) {
                runTests();
            });
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
            ok(evopediaArchiveFiles && evopediaArchiveFiles[0] && evopediaArchiveFiles[0].size > 0, "First archive file set and not empty");
            ok(evopediaArchiveFiles.length >= 5, "At least 5 files are read");
            ok(zimArchiveFiles && zimArchiveFiles[0] && zimArchiveFiles[0].size > 0, "ZIM file read and not empty");
        });

        module("evopedia_title_search_and_read");
        asyncTest("check getTitlesStartingAtOffset 0", function() {
            expect(4);
            var callbackFunction = function(titleList) {
                equal(titleList.length, 4, "4 titles found, as requested");
                var indexAbraham = -1;
                for (var i = 0; i < titleList.length; i++) {
                    if (titleList[i] && titleList[i]._name === "Abraham") {
                        indexAbraham = i;
                    }
                }
                ok(indexAbraham > -1, "Title 'Abraham' found");
                var firstTitleName = "not found";
                var secondTitleName = "not found";
                if (titleList.length >= 1 && titleList[0]) {
                    firstTitleName = titleList[0]._name;
                }
                if (titleList.length >= 2 && titleList[1]) {
                    secondTitleName = titleList[1]._name;
                }
                equal(firstTitleName, "Abbasid_Caliphate", "First article name is 'Abbasid_Caliphate'");
                equal(secondTitleName, "Abortion", "Second article name is 'Abortion'");
                start();
            };
            localEvopediaArchive.getTitlesStartingAtOffset(0, 4, callbackFunction);
        });

        asyncTest("check findTitlesWithPrefix Am", function() {
            expect(4);
            var callbackFunction = function(titleList) {
                ok(titleList && titleList.length > 0, "At least one title is found");
                var firstTitleName = "not found";
                var secondTitleName = "not found";
                if (titleList.length >= 1 && titleList[0]) {
                    firstTitleName = titleList[0]._name;
                }
                if (titleList.length >= 2 && titleList[1]) {
                    secondTitleName = titleList[1]._name;
                }
                equal(firstTitleName, "Amazon_River", "First article name is 'Amazon_River'");
                equal(secondTitleName, "American_Civil_War", "Second article name is 'American_Civil_War'");
                equal(titleList.length, 4, "4 titles should be found");
                start();
            };
            localEvopediaArchive.findTitlesWithPrefix("Am", 10, callbackFunction);
        });

        // Create a title instance for the Article 'Abraham'
        var titleAbraham = new evopediaTitle.Title();
        titleAbraham._archive = localEvopediaArchive;
        titleAbraham._articleLength = 10071;
        titleAbraham._blockOffset = 127640;
        titleAbraham._blockStart = 2364940;
        titleAbraham._fileNr = 0;
        titleAbraham._name = "Abraham";
        titleAbraham._titleOffset = 57;

        asyncTest("check getTitleByName with accents : Diego Velázquez", function() {
            expect(2);
            var callbackFunction = function(title) {
                ok(title !== null, "Title found");
                equal(title._name, "Diego_Velázquez", "Name of the title is correct");
                start();
            };
            localEvopediaArchive.getTitleByName("Diego_Velázquez").then(callbackFunction).fail(errorHandlerAsyncTest);
        });
        asyncTest("check getTitleByName with quote : Hundred Years' War", function() {
            expect(2);
            var callbackFunction = function(title) {
                ok(title !== null, "Title found");
                equal(title._name, "Hundred_Years'_War", "Name of the title is correct");
                start();
            };
            localEvopediaArchive.getTitleByName("Hundred_Years'_War").then(callbackFunction).fail(errorHandlerAsyncTest);
        });

        test("check parseTitleFromId", function() {
            var titleId = "small|2010-08-14|0|57|Abraham|2364940|127640|10071";
            var title = evopediaTitle.Title.parseTitleId(localEvopediaArchive, titleId);
            ok(title, "Title instance created");
            deepEqual(title, titleAbraham, "Parsing from titleId gives Abraham title");
        });

        asyncTest("check readArticle", function() {
            expect(3);
            var callbackFunction = function(title, htmlArticle) {
                ok(htmlArticle && htmlArticle.length > 0, "Article not empty");
                // Remove new lines
                htmlArticle = htmlArticle.replace(/[\r\n]/g, " ");
                ok(htmlArticle.match("^[ \t]*<h1[^>]*>Abraham</h1>"), "'Abraham' title at the beginning");
                ok(htmlArticle.match("</div>[ \t]$"), "</div> at the end");
                start();
            };
            localEvopediaArchive.readArticle(titleAbraham, callbackFunction);
        });

        asyncTest("check getTitleByName and readArticle with escape bytes", function() {
            expect(5);
            var callbackArticleRead = function(title, htmlArticle) {
                ok(htmlArticle && htmlArticle.length > 0, "Article not empty");
                // Remove new lines
                htmlArticle = htmlArticle.replace(/[\r\n]/g, " ");
                ok(htmlArticle.match("^[ \t]*<h1[^>]*>AIDS</h1>"), "'AIDS' title at the beginning");
                ok(htmlArticle.match("</div>[ \t]$"), "</div> at the end");
                start();
            };
            var callbackTitleFound = function(title) {
                ok(title !== null, "Title found");
                equal(title._name, "AIDS", "Name of the title is correct");
                localEvopediaArchive.readArticle(title, callbackArticleRead);
            };
            localEvopediaArchive.getTitleByName("AIDS").then(callbackTitleFound).fail(errorHandlerAsyncTest);
        });
        
        asyncTest("check getTitleByName with a title name that does not exist in the archive", function() {
            expect(1);
            var callbackTitleFound = function(title) {
                ok(title === null, "No title found because it does not exist in the archive");
                start();
            };
            localEvopediaArchive.getTitleByName("abcdef").then(callbackTitleFound).fail(errorHandlerAsyncTest);
        });

        asyncTest("check loading a math image", function() {
            expect(2);
            var callbackFunction = function(data) {
                ok(data && data.length > 0, "Image not empty");
                // edb3069b82c68d270f6642c171cc6293.png should give a "1 1/2" formula (can be found in "Rational_number" article)
                equal(util.uint8ArrayToBase64(data),
                        "iVBORw0KGgoAAAANSUhEUgAAABUAAAApBAMAAAAogX9zAAAAMFBMVEX///8AAADm5uZAQEDMzMwWFhYiIiIwMDBQUFCenp62trZiYmIMDAwEBASKiop0dHRvDVFEAAAAb0lEQVQY02NggAAmAwY4cE2AM9VNEWwG9oFhcxgKN9HJhYyCQCBApgs5jYMVYCKrGdgOwNgGDCzSMLYwA4MYjH2cgeEawjgWCQSbQwjBdpyAYMch2f4Awd7HwAVj8n1g4Iaxl+7e3Q1jXxQUlGMAAJkfGS29Qu04AAAAAElFTkSuQmCC",
                        "Math image corresponds to '1 1/2' png");
                start();
            };

            localEvopediaArchive.loadMathImage("edb3069b82c68d270f6642c171cc6293", callbackFunction);
        });
        
        module("geometry");
        test("check rectangle intersection", function() {
            var rect1 = new geometry.rect(0,0,2,2);
            var rect2 = new geometry.rect(1,1,2,2);
            var rect3 = new geometry.rect(2,2,2,2);
            var rect4 = new geometry.rect(1,1,1,1);
            var rect5 = new geometry.rect(3,3,2,2);
            var rect6 = new geometry.rect(2,0,1,10);
            ok(rect1.intersect(rect2), "rect1 intersects rect2");
            ok(rect2.intersect(rect1), "rect2 intersects rect1");
            ok(rect2.intersect(rect3), "rect1 intersects rect3");
            ok(!rect1.intersect(rect3), "rect1 does not intersect rect3");
            ok(!rect4.intersect(rect3), "rect4 does not intersect rect3");
            ok(rect4.intersect(rect2), "rect4 intersects rect2");
            ok(!rect5.intersect(rect1), "rect5 does not intersect rect1");
            ok(!rect1.intersect(rect5), "rect1 does not intersect rect5");
            ok(rect6.intersect(rect2), "rect6 intersects rect2");
            ok(rect6.intersect(rect3), "rect6 intersects rect3");
            ok(!rect6.intersect(rect5), "rect6 intersects rect5");
            var rect7 = new geometry.rect(0,0,45.5,90,5);
            var rect8 = new geometry.rect(0,40,10,10);
            ok(rect8.intersect(rect7), "rect8 intersects rect7");
        });
        test("check rectangle contains a point", function() {
            var rect1 = new geometry.rect(2,3,4,5);
            var point1 = new geometry.point(1,1);
            var point2 = new geometry.point(2,3);
            var point3 = new geometry.point(4,4);
            var point4 = new geometry.point(7,9);
            var point5 = new geometry.point(4,6);
            ok(!rect1.containsPoint(point1), "rect1 does not contain point1");
            ok(rect1.containsPoint(point2), "rect1 contains point2");
            ok(rect1.containsPoint(point3), "rect1 contains point3");
            ok(!rect1.containsPoint(point4), "rect1 does not contain point4");
            ok(rect1.containsPoint(point5), "rect1 contains point5");
        });
        test("check normalization of a rectangle", function() {
            var rect1 = new geometry.rect(2,3,4,5);
            var normalizedRect1 = rect1.normalized();
            ok(rect1.x===normalizedRect1.x
                && rect1.y===normalizedRect1.y
                && rect1.width===normalizedRect1.width
                && rect1.height===normalizedRect1.height, "rect1 is the same after normalization");
            var rect2 = new geometry.rect(6,3,-4,5);
            var normalizedRect2 = rect2.normalized();
            //alert("normalizedRect2 = " + normalizedRect2);
            ok(normalizedRect2.x===2
                && normalizedRect2.y===3
                && normalizedRect2.width===4
                && normalizedRect2.height===5, "rect2 successfully normalized by switching top left and top right corners");
            var rect3 = new geometry.rect(2,8,4,-5);
            var normalizedRect3 = rect3.normalized();
            ok(normalizedRect3.x===2
                && normalizedRect3.y===3
                && normalizedRect3.width===4
                && normalizedRect3.height===5, "rect3 successfully normalized by switching top left and botton left corners");
            var rect4 = new geometry.rect(6,8,-4,-5);
            var normalizedRect4 = rect4.normalized();
            ok(normalizedRect4.x===2
                && normalizedRect4.y===3
                && normalizedRect4.width===4
                && normalizedRect4.height===5, "rect4 successfully normalized by switching bottom right and top left corners");
            var rect5 = new geometry.rect(12,2,-4,-1);
            var normalizedRect5 = rect5.normalized();
            ok(normalizedRect5.x===8
                && normalizedRect5.y===1
                && normalizedRect5.width===4
                && normalizedRect5.height===1, "rect5 successfully normalized by switching bottom right and top left corners");
        });
        test("check rectangle constructor from bottom-left and top-right points", function() {
            var bottomLeft = new geometry.point(2,3);
            var topRight = new geometry.point(5,5);
            var rect = new geometry.rect(bottomLeft, topRight);
            equal(rect.x, 2 , "rect.x should be 2");
            equal(rect.y, 3 , "rect.y should be 3");
            equal(rect.width, 3 , "rect.width should be 3");
            equal(rect.height, 2 , "rect.height should be 2");
        });
        test("check rectangle contains another rectangle", function() {
            var rect1 = new geometry.rect(2,3,4,4);
            var rect2 = new geometry.rect(3,4,1,1);
            var rect3 = new geometry.rect(1,1,1,1);
            var rect4 = new geometry.rect(3,1,2,4);
            var rect5 = new geometry.rect(3,1,6,4);
            var rect6 = new geometry.rect(2,3,3,2);
            var rect7 = new geometry.rect(5,6,-3,-2); // same as rect7 but not normalized
            ok(rect1.contains(rect2), "rect1 should contain rect2");
            ok(!rect2.contains(rect1), "rect2 should not contain rect1");
            ok(!rect1.contains(rect3), "rect1 should not contain rect3");
            ok(!rect1.contains(rect4), "rect1 should not contain rect4");
            ok(!rect1.contains(rect5), "rect1 should not contain rect5");
            ok(rect1.contains(rect1), "rect1 should contain rect1");
            ok(rect1.contains(rect6), "rect1 should contain rect6");
            ok(rect1.contains(rect7), "rect1 should contain rect7");
        });
        test("check bearing algorithm", function() {
            var point1 = new geometry.point(0,0);
            var point2 = new geometry.point(0,2);
            var line1 = new geometry.line(point1, point2);
            equal(line1.bearing(), "N", "Bearing of line1 should be N");
            var pointLondon = new geometry.point(-0.12805555760860443, 51.50777816772461);
            var pointParis = new geometry.point(2.3522219000000177, 48.856614);
            var pointAmsterdam = new geometry.point(4.741287, 52.326947);
            var lineLondonParis = new geometry.line(pointLondon, pointParis);
            var lineParisLondon = new geometry.line(pointParis, pointLondon);
            var lineLondonAmsterdam = new geometry.line(pointLondon, pointAmsterdam);
            equal(lineLondonParis.bearing(), "SE", "Bearing from London to Paris sould be SE");
            equal(lineParisLondon.bearing(), "NW", "Bearing from Paris to London sould be NW");
            equal(lineLondonAmsterdam.bearing(), "E", "Bearing from London to Amsterdam sould be E");
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
        
        module("evopedia_articles_nearby");
        asyncTest("check articles found nearby France and Germany", function() {
            expect(5);
            var callbackTitlesNearbyFound = function(titleList) {
                ok(titleList !== null, "Some titles should be found");
                equal(titleList.length, 3, "3 titles should be found");
                var titleDanube = null;
                var titleParis = null;
                var titleAlps = null;
                for (var i=0; i<titleList.length; i++) {
                    var title = titleList[i];
                    if (title._name === "Danube") {
                        titleDanube = title;
                    }
                    else if (title._name === "Paris") {
                        titleParis = title;
                    }
                    else if (title._name === "Alps") {
                        titleAlps = title;
                    }
                }
                ok(titleDanube !== null, "The title 'Danube' should be found");
                ok(titleParis !== null, "The title 'Paris' should be found");
                ok(titleAlps !== null, "The title 'Alps' should be found");
               
                start();
            };
            var rectFranceGermany = new geometry.rect(0,40,10,10);
            localEvopediaArchive.getTitlesInCoords(rectFranceGermany, 10, callbackTitlesNearbyFound);
        });
        
        asyncTest("check articles found nearby France and Germany, with a maximum", function() {
            expect(2);
            var callbackTitlesNearbyMaximumFound = function(titleList) {
                ok(titleList !== null, "Some titles should be found");
                equal(titleList.length, 2, "2 titles should be found");
               
                start();
            };
            var rectFranceGermany = new geometry.rect(0,40,10,10);
            localEvopediaArchive.getTitlesInCoords(rectFranceGermany, 2, callbackTitlesNearbyMaximumFound);
        });
        
        asyncTest("check articles found nearby London", function() {
            expect(5);
            var callbackTitlesNearbyLondonFound = function(titleList) {
                ok(titleList !== null, "Some titles should be found");
                equal(titleList.length, 1, "1 title should be found");
                var titleLondon = null;
                for (var i=0; i<titleList.length; i++) {
                    var title = titleList[i];
                    if (title._name === "London") {
                        titleLondon = title;
                    }
                }
                ok(titleLondon !== null, "The title 'London' should be found");
                
                // Check coordinates of London
                var x = titleLondon._geolocation.x;
                var y = titleLondon._geolocation.y;
                equal(y, 51.50777816772461, "London should be at latitude 51.50777816772461");
                equal(x, -0.12805555760860443, "London should be at longitude -0.12805555760860443");
               
                start();
            };
            var pointLondon = new geometry.point(0, 51);
            var maxDistance = 1;
            var rectLondon = new geometry.rect(
                    pointLondon.x - maxDistance,
                    pointLondon.y - maxDistance,
                    maxDistance * 2,
                    maxDistance * 2);
            localEvopediaArchive.getTitlesInCoords(rectLondon, 10, callbackTitlesNearbyLondonFound);
        });
        
        asyncTest("check articles found nearby Amsterdam", function() {
            expect(3);
            var callbackTitlesNearbyAmsterdamFound = function(titleList) {
                ok(titleList !== null, "Some titles should be found");
                equal(titleList.length, 1, "1 title should be found");
                var titleAmsterdam = null;
                for (var i=0; i<titleList.length; i++) {
                    var title = titleList[i];
                    if (title._name === "Amsterdam") {
                        titleAmsterdam = title;
                    }
                }
                ok(titleAmsterdam !== null, "The title 'Amsterdam' should be found");
               
                start();
            };
            var pointAmsterdam = new geometry.point(5, 55);
            var maxDistance = 5;
            var rectAmsterdam = new geometry.rect(
                    pointAmsterdam.x - maxDistance,
                    pointAmsterdam.y - maxDistance,
                    maxDistance * 2,
                    maxDistance * 2);
            localEvopediaArchive.getTitlesInCoords(rectAmsterdam, 10, callbackTitlesNearbyAmsterdamFound);
        });
        
        module("evopedia_random_title");
        asyncTest("check that a random title is found", function() {
            expect(2);
            var callbackRandomTitleFound = function(title) {
                ok(title !== null, "One title should be found");
                ok(title._name !== null, "The random title should have a name" );
               
                start();
            };
            localEvopediaArchive.getRandomTitle(callbackRandomTitleFound);
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
    };
});
