const syswidecas = require('syswide-cas');
var fs = require('fs');
var moment = require('moment');
var uuidv4 = require('uuid/v4');
var gsjson = require('google-spreadsheet-to-json');

syswidecas.addCAs('/etc/ssl/certs/ca-certificates.crt');

exports.handlePossibleList = function (val, memo) {
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
  return normalizeList(option, defaultValue)
    .map(handlePossibleIntValue);
}

// should always return an array
function normalizeList(option, defaultValue) {

  if(typeof option === 'undefined') {
    return defaultValue || [];
  }

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

  // console.log(opts);
  return gsjson(opts);
};

exports.toMdJson = function (jsonArr) {
  var mdJson = [];
  var iJson;

  //console.info(jsonArr);
  jsonArr[0].forEach(function (json) {
    if(!json.title && !json.isOrganization) {
      return;
    }
    if(json.isOrganization) {
      iJson = {
        "contactId": uuidv4(),
        "isOrganization": json.isOrganization.toLowerCase() === 'y',
        "name": json.name,
        "positionName": json.position,
        // "memberOfOrganization": [
        //   "memberOfOrganization0",
        //   "memberOfOrganization1"
        // ],
        // "logoGraphic": [{
        //     "fileName": "fileName"
        //   },
        //   {
        //     "fileName": "fileName"
        //   }
        // ],
        "phone": [{
          "phoneNumber": json.phone,
          "service": []
        }],
        "address": [{
          "addressType": [],
          "deliveryPoint": [
            json.addressStreet1,
            json.addressStreet2,
          ],
          "city": json.city,
          "administrativeArea": json.state,
          "postalCode": json.zip,
          "country": json.country
        }],
        "electronicMailAddress": [
          json.email
        ],
        "onlineResource": [{
          "uri": json.webAddress,
          "protocol": "HTTP",
          "name": "Home Page",
          "function": "information"
        }, ],
        //"contactInstructions": "contactInstructions",
        "contactType": json.contacttype
      };

      if(json.phonetype) {
        json.phonetype.split(',')
          .forEach(itm => {
            let p = iJson.phone[0];
            p.service.push(itm);
          });
      }
      if(json.addresstype) {
        json.addresstype.split(',')
          .forEach(itm => {
            iJson.address[0].addressType.push(itm);
          });
      }

    } else {

      if(json.resourcetype === 'Project') {
        json.resourcetype = json.resourcetype.toLowerCase();
      }

      iJson = {
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
              "title": json.resourcetype !== 'project' ?
                "Parent Metadata" : null,
              "identifier": [{
                  "identifier": json.resourcetype !== 'project' ?
                    json.projectsbid || json.projectid : null,
                  "namespace": json.resourcetype !== 'project' &&
                    json.projectsbid ?
                    'gov.sciencebase.catalog' : null
                }, {
                  "identifier": json.resourcetype !== 'project' &&
                    json.projectsbid && json.projectid ? json.projectid :
                    null
                },
                {
                  "namespace": json.doi ? "info:doi/" : null,
                  "identifier": json.doi
                }
              ]
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
                "identifier": (json.resourcetype === 'project' ?
                    json.projectid || '' :
                    json.productid || '')
                  .toString()
              }],
              "onlineResource": [{
                "uri": json.url,
                "function": json.url ? "information" : null
              }]
            },
            "abstract": json.abstract,
            "shortAbstract": json.description,
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
          },
          "funding": []
        }
      };

      if(json.relatedWebsites) {
        iJson.metadata.additionalDocumentation = [{
          "resourceType": [{
            "type": "website"
          }],
          "citation": [{
            "onlineResource": [{
              "uri": json.relatedWebsites,
              "function": "information"
            }],
            "title": "Related Website"
          }]
        }];
      }
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

        json.topiccategory.split(',')
          .forEach(itm => {
            iso.keyword.push({
              "keyword": itm.trim(),
              "path": [itm.trim()]
            });
          });

        iJson.metadata.resourceInfo.keyword.push(iso);
      }
      //lcccategory
      if(json.category) {
        let kw = {
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

        json.category.split(',')
          .forEach(itm => {
            kw.keyword.push({
              "keyword": itm.trim(),
              "path": [itm.trim()]
            });
          });

        iJson.metadata.resourceInfo.keyword.push(kw);
      }
      //lcc deliver
      if(json.deliver) {
        let kw = {
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

        json.deliver.split(',')
          .forEach(itm => {
            kw.keyword.push({
              "keyword": itm.trim(),
              "path": [itm.trim()]
            });
          });

        iJson.metadata.resourceInfo.keyword.push(kw);
      }
      //lcc usertype
      if(json.usertype) {
        let kw = {
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

        json.usertype.split(',')
          .forEach(itm => {
            kw.keyword.push({
              "keyword": itm.trim(),
              "path": [itm.trim()]
            });
          });

        iJson.metadata.resourceInfo.keyword.push(kw);
      }
      //subject
      if(json.subject) {
        let kw = {
          "keyword": [],
          "keywordType": "theme",
          "thesaurus": {
            "identifier": [{
              "identifier": "custom"
            }],
            "title": "Subject"
          },
          "fullPath": true
        };

        json.subject.split(',')
          .forEach(itm => {
            kw.keyword.push({
              "keyword": itm.trim(),
              "path": [itm.trim()]
            });
          });

        iJson.metadata.resourceInfo.keyword.push(kw);
      }
      //geography
      if(json.geog) {
        let kw = {
          "keyword": [],
          "keywordType": "place",
          "thesaurus": {
            "identifier": [{
              "identifier": "custom"
            }],
            "title": "Geography"
          },
          "fullPath": true
        };

        json.geog.split(',')
          .forEach(itm => {
            kw.keyword.push({
              "keyword": itm.trim(),
              "path": [itm.trim()]
            });
          });

        iJson.metadata.resourceInfo.keyword.push(kw);
      }

      if(json.lccfundbyYear) {
        let val = json.lccfundbyYear.trim()
          .substr(2);
        let start = moment(val, 'YYYY')
          .subtract(1, 'year')
          .month('October')
          .startOf(
            'month');
        let end = moment(val, 'YYYY')
          .month('September')
          .endOf('month');

        iJson.metadata.funding.push({
          "allocation": [{
            "currency": "USD",
            "amount": json.lccfundbyAmount,
            "sourceAllocationId": json.awardid
          }],
          "timePeriod": {
            "endDateTime": end,
            "startDateTime": start
          }
        });
      }
    }

    mdJson.push(iJson);
  });

  if(mdJson[0].hasOwnProperty('isOrganization')) {
    return {
      "schema": {
        "name": "mdJson",
        "version": "2.0.0"
      },
      "contact": mdJson,
      "metadata": {
        "metadataInfo": {},
        "resourceInfo": {
          "citation": {}
        }
      }
    };
  }
  return mdJson;

};
