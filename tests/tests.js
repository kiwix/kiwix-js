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
define(['jquery', 'zimArchive', 'zimDirEntry', 'util', 'uiUtil', 'utf8'],
 function($, zimArchive, zimDirEntry, util, uiUtil, utf8) {
    
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
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0 ) {
                        var blob = new Blob([xhr.response], {type: 'application/octet-stream'});
                        blob.name = name;
                        resolve(blob);
                    }
                    else {
                        console.error("Error reading file " + url + " status:" + xhr.status + ", statusText:" + xhr.statusText);
                        reject({
                            status: xhr.status,
                            statusText: xhr.statusText
                        });
                    }
                }
            };
            xhr.onerror = function () {
                console.error("Error reading file " + url + " status:" + xhr.status + ", statusText:" + xhr.statusText);
                reject({
                    status: xhr.status,
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
     
    var runTests = function() {

        QUnit.module("environment");
        QUnit.test("qunit test", function(assert) {
            assert.equal("test", "test", "QUnit is properly configured");
        });

        QUnit.test("check archive files are read", function(assert) {
            assert.ok(zimArchiveFiles && zimArchiveFiles[0] && zimArchiveFiles[0].size > 0, "ZIM file read and not empty");
        });
        
        QUnit.module("utils");
        QUnit.test("check reading an IEEE_754 float from 4 bytes" ,function(assert) {
           var byteArray = new Uint8Array(4);
           // This example is taken from https://fr.wikipedia.org/wiki/IEEE_754#Un_exemple_plus_complexe
           // 1100 0010 1110 1101 0100 0000 0000 0000
           byteArray[0] = 194;
           byteArray[1] = 237;
           byteArray[2] = 64;
           byteArray[3] = 0;
           var float = util.readFloatFrom4Bytes(byteArray, 0);
           assert.equal(float, -118.625, "the IEEE_754 float should be converted as -118.625");
        });
        QUnit.test("check upper/lower case variations", function(assert) {
            var testString1 = "téléphone";
            var testString2 = "Paris";
            var testString3 = "le Couvre-chef Est sur le porte-manteaux";
            var testString4 = "épée";
            assert.equal(util.ucFirstLetter(testString1), "Téléphone", "The first letter should be upper-case");
            assert.equal(util.lcFirstLetter(testString2), "paris", "The first letter should be lower-case");
            assert.equal(util.ucEveryFirstLetter(testString3), "Le Couvre-Chef Est Sur Le Porte-Manteaux", "The first letter of every word should be upper-case");
            assert.equal(util.ucFirstLetter(testString4), "Épée", "The first letter should be upper-case (with accent)");
        });
        QUnit.test("check remove duplicates of an array of dirEntry objects", function(assert) {
            var array = [{title:"a"}, {title:"b"}, {title:"c"}, {title:"a"}, {title:"c"}, {title:"d"}];
            var expectedArray = [{title:"a"}, {title:"b"}, {title:"c"}, {title:"d"}];
            assert.deepEqual(util.removeDuplicateTitlesInDirEntryArray(array), expectedArray, "Duplicates should be removed from the array");
        });
        QUnit.test("check removal of parameters in URL", function(assert) {
            var testUrl1 = "A/question.html";
            var testUrl2 = "A/question.html?param1=toto&param2=titi";
            var testUrl3 = "A/question.html?param1=toto&param2=titi#anchor";
            var testUrl4 = "A/question.html#anchor";
            assert.equal(uiUtil.removeUrlParameters(testUrl1), testUrl1);
            assert.equal(uiUtil.removeUrlParameters(testUrl2), testUrl1);
            assert.equal(uiUtil.removeUrlParameters(testUrl3), testUrl1);
            assert.equal(uiUtil.removeUrlParameters(testUrl4), testUrl1);
        });
        
        QUnit.module("ZIM initialisation");
        QUnit.test("ZIM archive is ready", function(assert) {
            assert.ok(localZimArchive.isReady() === true, "ZIM archive should be set as ready");
        });
        
        QUnit.module("ZIM metadata");
        QUnit.test("read ZIM language", function(assert) {
            var done = assert.async();            
            assert.expect(1);
            var callbackFunction = function(language) {
                assert.equal(language , 'eng', 'The language read inside the Metadata should be "eng" for "English"');
                done();
            };
            localZimArchive.getMetadata("Language", callbackFunction);
        });
        QUnit.test("try to read a missing metadata", function(assert) {
            var done = assert.async();            
            assert.expect(1);
            var callbackFunction = function(string) {
                assert.equal(string, undefined, 'The metadata zzz should not be found inside the ZIM');
                done();
            };
            localZimArchive.getMetadata("zzz", callbackFunction);
        });
                
        QUnit.module("zim_direntry_search_and_read");
        QUnit.test("check DirEntry.fromStringId 'A Fool for You'", function(assert) {
            var done = assert.async();
            var aFoolForYouDirEntry = zimDirEntry.DirEntry.fromStringId(localZimArchive._file, "5856|7|A|0|2|A_Fool_for_You.html|A Fool for You|false|undefined");

            assert.expect(2);
            var callbackFunction = function(dirEntry, htmlArticle) {
                assert.ok(htmlArticle && htmlArticle.length > 0, "Article not empty");
                // Remove new lines
                htmlArticle = htmlArticle.replace(/[\r\n]/g, " ");
                assert.ok(htmlArticle.match("^.*<h1[^>]*>A Fool for You</h1>"), "'A Fool for You' title somewhere in the article");
                done();
            };
            localZimArchive.readUtf8File(aFoolForYouDirEntry, callbackFunction);
        });
        QUnit.test("check findDirEntriesWithPrefix 'A'", function(assert) {
            var done = assert.async();            
            assert.expect(2);
            var callbackFunction = function(dirEntryList) {
                assert.ok(dirEntryList && dirEntryList.length === 5, "Article list with 5 results");
                var firstDirEntry = dirEntryList[0];
                assert.equal(firstDirEntry.getTitleOrUrl() , 'A Fool for You', 'First result should be "A Fool for You"');
                done();
            };
            localZimArchive.findDirEntriesWithPrefix('A', 5, callbackFunction);
        });
        QUnit.test("check findDirEntriesWithPrefix 'a'", function(assert) {
            var done = assert.async();            
            assert.expect(2);
            var callbackFunction = function(dirEntryList) {
                assert.ok(dirEntryList && dirEntryList.length === 5, "Article list with 5 results");
                var firstDirEntry = dirEntryList[0];
                assert.equal(firstDirEntry.getTitleOrUrl() , 'A Fool for You', 'First result should be "A Fool for You"');
                done();
            };
            localZimArchive.findDirEntriesWithPrefix('a', 5, callbackFunction);
        });
        QUnit.test("check findDirEntriesWithPrefix 'blues brothers'", function(assert) {
            var done = assert.async();
            assert.expect(2);
            var callbackFunction = function(dirEntryList) {
                assert.ok(dirEntryList && dirEntryList.length === 3, "Article list with 3 result");
                var firstDirEntry = dirEntryList[0];
                assert.equal(firstDirEntry.getTitleOrUrl() , 'Blues Brothers (film)', 'First result should be "Blues Brothers (film)"');
                done();
            };
            localZimArchive.findDirEntriesWithPrefix('blues brothers', 5, callbackFunction);
        });
        QUnit.test("article '(The Night Time Is) The Right Time' correctly redirects to 'Night Time Is the Right Time'", function(assert) {
            var done = assert.async();
            assert.expect(6);
            localZimArchive.getDirEntryByTitle("A/(The_Night_Time_Is)_The_Right_Time.html").then(function(dirEntry) {
                assert.ok(dirEntry !== null, "DirEntry found");
                if (dirEntry !== null) {
                    assert.ok(dirEntry.isRedirect(), "DirEntry is a redirect.");
                    assert.equal(dirEntry.getTitleOrUrl(), "(The Night Time Is) The Right Time", "Correct redirect title name.");
                    localZimArchive.resolveRedirect(dirEntry, function(dirEntry) {
                        assert.ok(dirEntry !== null, "DirEntry found");
                        assert.ok(!dirEntry.isRedirect(), "DirEntry is not a redirect.");
                        assert.equal(dirEntry.getTitleOrUrl(), "Night Time Is the Right Time", "Correct redirected title name.");
                        done();
                    });
                } else {
                    done();
                }
            });
        });
        QUnit.test("article 'Raelettes' correctly redirects to 'The Raelettes'", function(assert) {
            var done = assert.async();
            assert.expect(6);
            localZimArchive.getDirEntryByTitle("A/Raelettes.html").then(function(dirEntry) {
                assert.ok(dirEntry !== null, "DirEntry found");
                if (dirEntry !== null) {
                    assert.ok(dirEntry.isRedirect(), "DirEntry is a redirect.");
                    assert.equal(dirEntry.getTitleOrUrl(), "Raelettes", "Correct redirect title name.");
                    localZimArchive.resolveRedirect(dirEntry, function(dirEntry) {
                        assert.ok(dirEntry !== null, "DirEntry found");
                        assert.ok(!dirEntry.isRedirect(), "DirEntry is not a redirect.");
                        assert.equal(dirEntry.getTitleOrUrl(), "The Raelettes", "Correct redirected title name.");
                        done();
                    });
                } else {
                    done();
                }
            });
        });
        QUnit.test("article 'Bein Green' correctly redirects to 'Bein' Green", function(assert) {
            var done = assert.async();
            assert.expect(6);
            localZimArchive.getDirEntryByTitle("A/Bein_Green.html").then(function(dirEntry) {
                assert.ok(dirEntry !== null, "DirEntry found");
                if (dirEntry !== null) {
                    assert.ok(dirEntry.isRedirect(), "DirEntry is a redirect.");
                    assert.equal(dirEntry.getTitleOrUrl(), "Bein Green", "Correct redirect title name.");
                    localZimArchive.resolveRedirect(dirEntry, function(dirEntry) {
                        assert.ok(dirEntry !== null, "DirEntry found");
                        assert.ok(!dirEntry.isRedirect(), "DirEntry is not a redirect.");
                        assert.equal(dirEntry.getTitleOrUrl(), "Bein' Green", "Correct redirected title name.");
                        done();
                    });
                } else {
                    done();
                }
            });
        });
        QUnit.test("article 'America, the Beautiful' correctly redirects to 'America the Beautiful'", function(assert) {
            var done = assert.async();
            assert.expect(6);
            localZimArchive.getDirEntryByTitle("A/America,_the_Beautiful.html").then(function(dirEntry) {
                assert.ok(dirEntry !== null, "DirEntry found");
                if (dirEntry !== null) {
                    assert.ok(dirEntry.isRedirect(), "DirEntry is a redirect.");
                    assert.equal(dirEntry.getTitleOrUrl(), "America, the Beautiful", "Correct redirect title name.");
                    localZimArchive.resolveRedirect(dirEntry, function(dirEntry) {
                        assert.ok(dirEntry !== null, "DirEntry found");
                        assert.ok(!dirEntry.isRedirect(), "DirEntry is not a redirect.");
                        assert.equal(dirEntry.getTitleOrUrl(), "America the Beautiful", "Correct redirected title name.");
                        done();
                    });
                } else {
                    done();
                }
            });
        });
        QUnit.test("Image 'm/RayCharles_AManAndHisSoul.jpg' can be loaded", function(assert) {
            var done = assert.async();
            assert.expect(5);
            localZimArchive.getDirEntryByTitle("I/m/RayCharles_AManAndHisSoul.jpg").then(function(dirEntry) {
                assert.ok(dirEntry !== null, "DirEntry found");
                if (dirEntry !== null) {
                    assert.equal(dirEntry.namespace +"/"+ dirEntry.url, "I/m/RayCharles_AManAndHisSoul.jpg", "URL is correct.");
                    assert.equal(dirEntry.getMimetype(), "image/jpeg", "MIME type is correct.");
                    localZimArchive.readBinaryFile(dirEntry, function(title, data) {
                        assert.equal(data.length, 4951, "Data length is correct.");
                        var beginning = new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70,
                                                         73, 70, 0, 1, 1, 0, 0, 1]);
                        assert.equal(data.slice(0, beginning.length).toString(), beginning.toString(), "Data beginning is correct.");
                        done();
                    });
                } else {
                    done();
                }
            });
        });
        QUnit.test("Stylesheet '-/s/style.css' can be loaded", function(assert) {
            var done = assert.async();
            
            assert.expect(5);
            localZimArchive.getDirEntryByTitle("-/s/style.css").then(function(dirEntry) {
                assert.ok(dirEntry !== null, "DirEntry found");
                if (dirEntry !== null) {
                    assert.equal(dirEntry.namespace +"/"+ dirEntry.url, "-/s/style.css", "URL is correct.");
                    assert.equal(dirEntry.getMimetype(), "text/css", "MIME type is correct.");
                    localZimArchive.readBinaryFile(dirEntry, function(dirEntry, data) {
                        assert.equal(data.length, 104495, "Data length is correct.");
                        data = utf8.parse(data);
                        var beginning = "\n/* start http://en.wikipedia.org/w/load.php?debug=false&lang=en&modules=site&only=styles&skin=vector";
                        assert.equal(data.slice(0, beginning.length), beginning, "Content starts correctly.");
                        done();
                    });
                } else {
                    done();
                }
            });
        });
        QUnit.test("Javascript '-/j/local.js' can be loaded", function(assert) {
            var done = assert.async();
            assert.expect(5);
            localZimArchive.getDirEntryByTitle("-/j/local.js").then(function(dirEntry) {
                assert.ok(dirEntry !== null, "DirEntry found");
                if (dirEntry !== null) {
                    assert.equal(dirEntry.namespace +"/"+ dirEntry.url, "-/j/local.js", "URL is correct.");
                    assert.equal(dirEntry.getMimetype(), "application/javascript", "MIME type is correct.");
                    localZimArchive.readBinaryFile(dirEntry, function(dirEntry, data) {
                        assert.equal(data.length, 41, "Data length is correct.");
                        data = utf8.parse(data);
                        var beginning = "console.log( \"mw.loader";
                        assert.equal(data.slice(0, beginning.length), beginning, "Content starts correctly.");
                        done();
                    });
                }   
                else {
                    done();
                }
            });
        });
        QUnit.test("Split article 'A/Ray_Charles.html' can be loaded", function(assert) {
            var done = assert.async();
            assert.expect(7);
            localZimArchive.getDirEntryByTitle("A/Ray_Charles.html").then(function(dirEntry) {
                assert.ok(dirEntry !== null, "Title found");
                if (dirEntry !== null) {
                    assert.equal(dirEntry.namespace +"/"+ dirEntry.url, "A/Ray_Charles.html", "URL is correct.");
                    assert.equal(dirEntry.getMimetype(), "text/html", "MIME type is correct.");
                    localZimArchive.readUtf8File(dirEntry, function(dirEntry2, data) {
                        assert.equal(dirEntry2.getTitleOrUrl(), "Ray Charles", "Title is correct.");
                        assert.equal(data.length, 157186, "Data length is correct.");
                        assert.equal(data.indexOf("the only true genius in show business"), 5535, "Specific substring at beginning found.");
                        assert.equal(data.indexOf("Random Access Memories"), 154107, "Specific substring at end found.");
                        done();
                    });
                } else {
                    done();
                }
            });
        });
        
        QUnit.module("zim_random_and_main_article");
        QUnit.test("check that a random article is found", function(assert) {
            var done = assert.async();
            assert.expect(2);
            var callbackRandomArticleFound = function(dirEntry) {
                assert.ok(dirEntry !== null, "One DirEntry should be found");
                assert.ok(dirEntry.getTitleOrUrl() !== null, "The random DirEntry should have a title" );
               
                done();
            };
            localZimArchive.getRandomDirEntry(callbackRandomArticleFound);
        });
        QUnit.test("check that the main article is found", function(assert) {
            var done = assert.async();
            assert.expect(2);
            var callbackMainPageArticleFound = function(dirEntry) {
                assert.ok(dirEntry !== null, "Main DirEntry should be found");
                assert.equal(dirEntry.getTitleOrUrl(), "Summary", "The main DirEntry should be called Summary" );
               
                done();
            };
            localZimArchive.getMainPageDirEntry(callbackMainPageArticleFound);
        });
    };
});
