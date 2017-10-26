var fs = require('fs');
var uuidv4 = require('uuid/v4');
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
  if(typeof val === 'string' && /^\d+$/.test(val)) {
    return handleIntValue(val);
  }
  return val;
}

function normalizePossibleIntList(option, defaultValue) {
  return normalizeList(option, defaultValue).map(handlePossibleIntValue);
}

// should always return an array
function normalizeList(option, defaultValue) {

  if(typeof option === 'undefined') {
    return defaultValue || [];
  }

  return Array.isArray(option) ? option : [option];
}

exports.spreadsheetToJson = function(options) {
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

exports.toMdJson = function(jsonArr) {
  var mdJson = [];

  //console.info(jsonArr);
  jsonArr[0].forEach(function(json) {
    if(!json.title) {
      return;
    }

    if(json.resourcetype === 'Project') {
      json.resourcetype = json.resourcetype.toLowerCase();
    }

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
          "metadataIdentifier": {
            "identifier": (json.resourcetype === 'project' ? json.projectsbid :
              json.productsbid) || uuidv4(),
            "namespace": (json.resourcetype === 'project' && json.projectsbid) ||
              json.productsbid ?
              'gov.sciencebase.catalog' : 'urn:uuid'
          },
          "parentMetadata": {
            "title": "Parent Metadata",
            "identifier": [{
              "identifier": json.resourcetype !== 'project' ? json.projectsbid :
                null,
              "namespace": json.resourcetype !== 'project' && json.projectsbid ?
                'gov.sciencebase.catalog' : null
            }]
          }
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
              json.shorttitle
            ],
            "identifier": [{
              "identifier": (json.resourcetype === 'project' ? json.projectid :
                json.productid).toString()
            }],
            "onlineResource": [{
              "uri": json.url,
              "function": json.url ? "information" : null
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
          },
          "keyword": []
        }
      }
    };

    //isoTopicCategory
    if(json.topiccategory) {
      var iso = {
        "keyword": [],
        "keywordType": "isoTopicCategory",
        "thesaurus": {
          "date": [{
            "date": "2014-04",
            "dateType": "revision"
          }],
          "title": "ISO 19115 Topic Category",
          "edition": "ISO 19115-1:2014",
          "onlineResource": [{
            "uri": "https://doi.org/10.18123/D6RP4M"
          }],
          "identifier": [{
            "identifier": "ISO 19115 Topic Category"
          }]
        },
        "fullPath": true
      };

      json.topiccategory.split(',').forEach(itm => {
        iso.keyword.push({
          "keyword": itm.trim(),
          "path": [itm.trim()]
        });
      });

      iJson.metadata.resourceInfo.keyword.push(iso);
    }
    //lcccategory
    if(json.category) {
      var kw = {
        "keyword": [],
        "keywordType": "theme",
        "thesaurus": {
          "date": [{
            "date": "2017-09",
            "dateType": "revision"
          }],
          "title": "Category - Landscape Conservation Cooperatives",
          "edition": "2017",
          "onlineResource": [{
            "uri": "https://lccnetwork.org/"
          }],
          "identifier": [{
            "identifier": "5da1d3b7-375b-58ae-a134-2ee0c94c395f"
          }]
        },
        "fullPath": true
      };

      json.category.split(',').forEach(itm => {
        kw.keyword.push({
          "keyword": itm.trim(),
          "path": [itm.trim()]
        });
      });

      iJson.metadata.resourceInfo.keyword.push(kw);
    }
    //lcc deliver
    if(json.deliver) {
      var kw = {
        "keyword": [],
        "keywordType": "theme",
        "thesaurus": {
          "date": [{
            "date": "2017-09",
            "dateType": "revision"
          }],
          "title": "Deliverable Types - Landscape Conservation Cooperatives",
          "edition": "2017",
          "onlineResource": [{
            "uri": "https://lccnetwork.org/"
          }],
          "identifier": [{
            "identifier": "fa455d4a-5d87-56bc-b074-9a967beff904"
          }]
        },
        "fullPath": true
      };

      json.deliver.split(',').forEach(itm => {
        kw.keyword.push({
          "keyword": itm.trim(),
          "path": [itm.trim()]
        });
      });

      iJson.metadata.resourceInfo.keyword.push(kw);
    }
    //lcc usertype
    if(json.usertype) {
      var kw = {
        "keyword": [],
        "keywordType": "theme",
        "thesaurus": {
          "date": [{
            "date": "2017-09",
            "dateType": "revision"
          }],
          "title": "End User Types - Landscape Conservation Cooperatives",
          "edition": "2017",
          "onlineResource": [{
            "uri": "https://www.sciencebase.gov/vocab/vocabulary/54760ef9e4b0f62cb5dc41a0"
          }],
          "identifier": [{
            "identifier": "425f4a7c-dca2-56d8-947e-6f6bd1033d70"
          }]
        },
        "fullPath": true
      };

      json.usertype.split(',').forEach(itm => {
        kw.keyword.push({
          "keyword": itm.trim(),
          "path": [itm.trim()]
        });
      });

      iJson.metadata.resourceInfo.keyword.push(kw);
    }

    mdJson.push(iJson);
  });
  return mdJson;

};
