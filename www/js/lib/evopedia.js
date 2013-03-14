define(function(require) {
	
	/**
	 * Read an integer encoded in 4 bytes
	 */
	function readIntegerFrom4Bytes(byteArray,firstIndex) {
		return byteArray[firstIndex] + byteArray[firstIndex+1]*256 + byteArray[firstIndex+2]*65536 + byteArray[firstIndex+3]*16777216; 
	}
	
	/**
	 * Converts a UTF-8 byte array to JavaScript's 16-bit Unicode.
	 * @param {Array.<number>} bytes UTF-8 byte array.
	 * @return {string} 16-bit Unicode string.
	 * Copied from http://closure-library.googlecode.com/svn/docs/closure_goog_crypt.js.source.html (Apache License 2.0)
	 */
	function utf8ByteArrayToString(bytes,startIndex,endIndex) {
		var out = [], pos = startIndex, c = 0;
		while (pos < bytes.length && pos < endIndex) {
			var c1 = bytes[pos++];
			if (c1 < 128) {
				out[c++] = String.fromCharCode(c1);
			} else if (c1 > 191 && c1 < 224) {
				var c2 = bytes[pos++];
				out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
			} else {
				var c2 = bytes[pos++];
				var c3 = bytes[pos++];
				out[c++] = String.fromCharCode(
						(c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
			}
		}
		return out.join('');
	}
	
	/**
	 * LocalArchive class : defines a wikipedia dump on the filesystem
	 * It's still minimal for now. TODO : complete implementation to handle maths and coordinates
	 */
	function LocalArchive() {
		this.directory = null;
		this.titleFile = null;	
	}
	
	
	/**
	 * Title class : defines the title of an article and some methods to manipulate it
	 */
	function Title() {
		this.name = null;
		this.fileNr = null;
		this.blockStart = null;
		this.blockOffset = null;
		this.articleLength = null;
		this.archive = null;
		this.titleOffset = null;
		this.titleEntryLength = null;
	};
		

	/**
	 * Creates a Title instance from an encoded title line from a title file
	 */
	Title.parseTitle = function(encodedTitle, archive, titleOffset) {
		if (archive == null) {
			throw "archive cannot be null";
		}
		if (titleOffset < 0) {
			throw "titleOffset cannot be negative (was " + titleOffset + ")";
		}
		var t = new Title();
		t.archive = archive;
		t.titleOffset = titleOffset;

		if (encodedTitle == null || encodedTitle.length < 15)
			return null;

		if (encodedTitle[encodedTitle.length - 1] == '\n') {
			t.titleEntryLength = encodedTitle.length;
		} else {
			t.titleEntryLength = encodedTitle.length + 1;
		}

		// TODO : handle escapes
		/*
		int escapes = LittleEndianReader.readUInt16(encodedTitle, 0);
		byte[] positionData = new byte[13];
		System.arraycopy(encodedTitle, 2, positionData, 0, 13);

		if ((escapes & (1 << 14)) != 0)
		    escapes |= '\n';

		for (int i = 0; i < 13; i ++) {
		    if ((escapes & (1 << i)) != 0)
		        positionData[i] = '\n';
		}
		 */

		t.fileNr = encodedTitle[2];
		t.blockStart = readIntegerFrom4Bytes(encodedTitle, 3);
		t.blockOffset = readIntegerFrom4Bytes(encodedTitle, 7);
		t.articleLength = readIntegerFrom4Bytes(encodedTitle, 11);

		t.name = Title.parseNameOnly(encodedTitle);

		return t;
	};

	/*
	 * Retrieves the name of an article from an encoded title line
	 */
	Title.parseNameOnly = function(encodedTitle) {
		var len = encodedTitle.length;
		if (len < 15) {
			return null;
		}
		if (len > 15 && encodedTitle[len - 1] == '\n') {
			len--;
		}
		return utf8ByteArrayToString(encodedTitle, 15, len);
	};
	
	/**
	 * Functions and classes exposed by this module
	 */
    return {
    	readIntegerFrom4Bytes: readIntegerFrom4Bytes,
        utf8ByteArrayToString : utf8ByteArrayToString,
    	LocalArchive : LocalArchive,
    	Title : Title
    };
});