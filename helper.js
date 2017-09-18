var fs = require('fs');
var gsjson = require('google-spreadsheet-to-json');

exports.handlePossibleList = function(val, memo) {
  if(typeof memo !== 'undefined') {
    if(Array.isArray(memo)) {
      memo.push(val);
      return memo;
    } else {
      return [memo, val];
    }
    return val;
  }
};

function handleIntValue(val) {
    return parseInt(val, 10) || 0;
}

// returns a number if the string can be parsed as an integer
function handlePossibleIntValue(val) {
    if (typeof val === 'string' && /^\d+$/.test(val))
        return handleIntValue(val);
    return val;
}

function normalizePossibleIntList(option, defaultValue) {
    return normalizeList(option, defaultValue).map(handlePossibleIntValue);
}

// should always return an array
function normalizeList(option, defaultValue) {

    if (typeof option === 'undefined')
        return defaultValue || [];

    return Array.isArray(option) ? option : [option];
}

exports.spreadsheetToJson = function (options) {
  //console.info(options);
  var opts = {
    spreadsheetId: options.spreadsheetId,
    worksheet: normalizePossibleIntList(options.worksheet),
    beautify: options.beautify,
    headerSize: options.headerSize,
    headerStart: handlePossibleIntValue(options.headerStart),
    ignoreCol: normalizePossibleIntList(options.ignoreCol),
    ignoreRow: normalizePossibleIntList(options.ignoreRow)
  };

  //console.log(opts);
  return gsjson(opts);
};

exports.toMdJson = function (jsonArr) {
  var mdJson = [];

  //console.info(jsonArr);
  jsonArr[0].forEach(function (json) {
    var iJson = {
      "schema": {
        "name": "mdJson",
        "version": "2.0.0"
      },
      "contact": [
        //   {
        //   "contactId": "CID001",
        //   "isOrganization": false,
        //   "name": "contact - minimal",
        //   "positionName": "positionName"
        // }
      ],
      "metadata": {
        "metadataInfo": {
          // "metadataContact": [{
          //   "role": "metadataContact",
          //   "party": [{
          //     "contactId": "CID001"
          //   }]
          // }]
        },
        "resourceInfo": {
          "resourceType": [{
            "type": json.resourcetype
          }],
          "citation": {
            "title": json.title,
            "alternateTitle": [
              "alternateTitle0",
              "alternateTitle1"
            ],
            "identifier": [{
              "identifier": json.id
            }],
            "onlineResource": [{
              "uri": json.url,
              "function": "information"
            }]
          },
          "abstract": json.abstract,
          "status": [
            json.status
          ],
          "timePeriod": {
            "startDateTime": json.start,
            "endDateTime": json.end,
          },
          "pointOfContact": [{
            "role": "pointOfContact",
            "party": []
          }],
          "defaultResourceLocale": {
            "language": "eng",
            "country": "USA",
            "characterSet": "UTF-8"
          }
        }
      }
    };
    mdJson.push(iJson);
  });
  return mdJson;

};
