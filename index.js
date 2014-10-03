module.exports = function (options) {

  var depth = 0,
      getIndent = function () {
        var indent = '';

        for (var i = 0; i < depth; i++) {
          indent += '\t';
        }
        return indent;
      };

  var defaultOptions = {
    startArray: function (key, len) {
      console.log(getIndent() + key + '[' + len + '] : array start >>>');
      depth++;
    },
    endArray: function (key) {
      depth--;
      console.log(getIndent() + key + ' : array end <<<');
    },
    startObject: function (key) {
      console.log(getIndent() + key + ' : object start >>>');
      depth++;
    },
    endObject: function (key) {
      depth--;
      console.log(getIndent() + key + ' : object end <<<');
    },
    scalar: function (key, value) {
      if (typeof value === 'string') {
        console.log(getIndent() + key + ' : "' + value + '"');
      } else {
        console.log(getIndent() + key + ' : ' + value);
      }
    }
  };

  options = options || defaultOptions;

  var startArray = options.startArray;
  var endArray = options.endArray;
  var startObject = options.startObject;
  var endObject = options.endObject;
  var scalar = options.scalar;

  function convertChar(str) {
    var strLen, firstByte, utf16Char, utf8StrLen,
        result = {
          ch: str,
          len: 0,
          orig: ''
        };

    if (!str || str[0] !== '%' || (strLen = str.length) < 3) {
      return result;
    }

    if (/[A-Fa-f0-9]/.test(str[1]) === false || /[A-Fa-f0-9]/.test(str[2]) === false) {
      return result;
    }

    firstByte = parseInt(str.slice(1, 3), 16);

    if (0 <= firstByte && firstByte <= 0x7F) {
      // 1 byte
      utf16Char = String.fromCharCode(firstByte); // 7 bits
      utf8StrLen = 3;
    } else if (0xC2 <= firstByte && firstByte <= 0xDF && strLen >= 6) {
      // 2 byte
      utf16Char = String.fromCharCode(((firstByte & 0x1F) << 6) + (parseInt(str.slice(4, 6), 16) & 0x3F)); // 11 bit (1st:5bit + 2nd:6bit)
      utf8StrLen = 6;
    } else if (0xE0 <= firstByte && firstByte <= 0xEF && strLen >= 9) {
      // 3 byte
      utf16Char = String.fromCharCode(((firstByte & 0xF) << 12) + ((parseInt(str.slice(4, 6), 16) & 0x3F) << 6) + (parseInt(str.slice(7, 9), 16) & 0x3F)); // 16 bit (1st:4bit + 2nd:6bit + 3rd:6bit)
      utf8StrLen = 9;
    } else {
      // Not supported.
      return result;
    }

    result.ch = utf16Char;
    result.len = utf16Char.length;
    result.orig = str.slice(0, utf8StrLen);

    return result;
  }

  function parseObject(obj, mode) {
    var i, il, k, str, idx, result;

    if (obj instanceof Array) {
      // Array
      il = obj.length;
      startArray && startArray(mode, il);
      for (i = 0; i < il; i++) {
        parseObject(obj[i], i); 
      }
      endArray && endArray(mode);
    } else if (typeof obj === 'object') {
      // Object
      startObject && startObject(mode);
      for (k in obj) {
        parseObject(obj[k], k); 
      }
      endObject && endObject(mode);
    } else {
      // Scalar
      if (typeof obj === 'string') {
        str = obj;
        while (str && (idx = str.indexOf('%', idx)) !== -1) {
          result = convertChar(str.slice(idx));
          if (result.len === 0) {
            break;
          }
          str = str.replace(result.orig, result.ch);
          idx += result.len;
        }
        obj = str || '';
      }
      scalar && scalar(mode, obj);
    }
  }

  // Parses a JSON object.
  function parse(o) {
    parseObject(o, 'root');
  }

  return ({
    parse: parse
  });
};
