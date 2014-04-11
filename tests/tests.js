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
define(function(require) {

    var $ = require('jquery');
    var evopediaTitle = require('title');
    var evopediaArchive = require('archive');
    var geometry = require('geometry');
    var util = require('util');

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

        test("check archive files are selected", function() {
            var archiveFiles = document.getElementById('archiveFiles').files;
            ok(archiveFiles && archiveFiles[0] && archiveFiles[0].size > 0, "First archive file set and not empty");
            ok(archiveFiles.length >= 5, "At least 5 files are selected");
        });

        // Create a localArchive from selected files, in order to run the following tests
        var localArchive = new evopediaArchive.LocalArchive();
        localArchive.initializeFromArchiveFiles(document.getElementById('archiveFiles').files);

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
            localArchive.getTitlesStartingAtOffset(0, 4, callbackFunction);
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
            localArchive.findTitlesWithPrefix("Am", 10, callbackFunction);
        });

        // Create a title instance for the Article 'Abraham'
        var titleAbraham = new evopediaTitle.Title();
        titleAbraham._archive = localArchive;
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
            localArchive.getTitleByName("Diego_Velázquez", callbackFunction);
        });
        asyncTest("check getTitleByName with quote : Hundred Years' War", function() {
            expect(2);
            var callbackFunction = function(title) {
                ok(title !== null, "Title found");
                equal(title._name, "Hundred_Years'_War", "Name of the title is correct");
                start();
            };
            localArchive.getTitleByName("Hundred_Years'_War", callbackFunction);
        });

        test("check parseTitleFromId", function() {
            var titleId = "small|2010-08-14|0|57|Abraham|2364940|127640|10071";
            var title = evopediaTitle.Title.parseTitleId(localArchive, titleId);
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
            localArchive.readArticle(titleAbraham, callbackFunction);
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
                localArchive.readArticle(title, callbackArticleRead);
            };
            localArchive.getTitleByName("AIDS", callbackTitleFound);
        });
        
        asyncTest("check getTitleByName with a title name that does not exist in the archive", function() {
            expect(1);
            var callbackTitleFound = function(title) {
                ok(title === null, "No title found because it does not exist in the archive");
                start();
            };
            localArchive.getTitleByName("abcdef", callbackTitleFound);
        });

        asyncTest("check loading a math image", function() {
            expect(2);
            var callbackFunction = function(data) {
                ok(data && data.length > 0, "Image not empty");
                // edb3069b82c68d270f6642c171cc6293.png should give a "1 1/2" formula (can be found in "Rational_number" article)
                equal(data,
                        "iVBORw0KGgoAAAANSUhEUgAAABUAAAApBAMAAAAogX9zAAAAMFBMVEX///8AAADm5uZAQEDMzMwWFhYiIiIwMDBQUFCenp62trZiYmIMDAwEBASKiop0dHRvDVFEAAAAb0lEQVQY02NggAAmAwY4cE2AM9VNEWwG9oFhcxgKN9HJhYyCQCBApgs5jYMVYCKrGdgOwNgGDCzSMLYwA4MYjH2cgeEawjgWCQSbQwjBdpyAYMch2f4Awd7HwAVj8n1g4Iaxl+7e3Q1jXxQUlGMAAJkfGS29Qu04AAAAAElFTkSuQmCC",
                        "Math image corresponds to '1 1/2' png");
                start();
            };

            localArchive.loadMathImage("edb3069b82c68d270f6642c171cc6293", callbackFunction);
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
            localArchive.getTitlesInCoords(rectFranceGermany, 10, callbackTitlesNearbyFound);
        });
        
        asyncTest("check articles found nearby France and Germany, with a maximum", function() {
            expect(2);
            var callbackTitlesNearbyMaximumFound = function(titleList) {
                ok(titleList !== null, "Some titles should be found");
                equal(titleList.length, 2, "2 titles should be found");
               
                start();
            };
            var rectFranceGermany = new geometry.rect(0,40,10,10);
            localArchive.getTitlesInCoords(rectFranceGermany, 2, callbackTitlesNearbyMaximumFound);
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
            localArchive.getTitlesInCoords(rectLondon, 10, callbackTitlesNearbyLondonFound);
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
            localArchive.getTitlesInCoords(rectAmsterdam, 10, callbackTitlesNearbyAmsterdamFound);
        });
        
        module("evopedia_random_title");
        asyncTest("check that a random title is found", function() {
            expect(2);
            var callbackRandomTitleFound = function(title) {
                ok(title !== null, "One title should be found");
                ok(title._name !== null, "The random title should have a name" );
               
                start();
            };
            localArchive.getRandomTitle(callbackRandomTitleFound);
        });
    };
});
