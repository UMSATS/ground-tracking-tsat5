//Node.js modules
const https = require('https'),
      TLEJS = require('tle.js');

//N2YO.com REST API request template
const baseURL = 'https://www.n2yo.com/rest/v1/satellite/',
      tleRequest = 'tle/',
      noradID = '25544',
      radioPassRequest = 'radiopasses/',
      apiKey = 'XPXKVU-9V99WV-JZYX84-3YBP';

//Initialize API request variables with global access
var observerLat,
    observerLng,
    userPublicIP,
    minEl = 5, //degrees
    observerAlt = 239; //meters

//initialize global objects
const tlejs = new TLEJS(),
      pi = Math.PI;

function getObserverLocation(){
    https.get("https://json.geoiplookup.io/", function(response) {
        const { statusCode } = response;
        const contentType = response.headers['content-type'];
        
        let error;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                      `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
            error = new Error('Invalid content-type.\n' +
                      `Expected application/json but received ${contentType}`);
        }
        if (error) {
            console.error(error.message);
            // consume response data to free up memory
            response.resume();
            return;
        }
        
        response.setEncoding('utf8');
        let rawData = '';
        response.on('data', (chunk) => { rawData += chunk; });
        response.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);            
                userPublicIP = parsedData.ip;
                observerLat = parsedData.latitude;
                observerLng = parsedData.longitude;
                //console.log(parsedData);
            } catch (e) {
                console.error(e.message);
            }
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
        });
    });
};
                    
function timeToNextPass() {
    https.get(baseURL+tleRequest+noradID+'&apiKey='+apiKey, (response) => {
        const { statusCode } = response;
        const contentType = response.headers['content-type'];
        
        let error;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                      `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
            error = new Error('Invalid content-type.\n' +
                      `Expected application/json but received ${contentType}`);
        }
        if (error) {
            console.error(error.message);
            // consume response data to free up memory
            response.resume();
            return;
        }
        
        response.setEncoding('utf8');
        let rawData = '';
        response.on('data', (chunk) => { rawData += chunk; });
        response.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData),
                      tleInfo = parsedData.info,
                      tleStr = parsedData.tle;
                //console.log(parsedData);
                
                const timestampMS = Date.now(), //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                      observer = {
                          lat: observerLat,
                          lng: observerLng,
                          height: observerAlt/1000
                      };
                
                const satInfo = tlejs.getSatelliteInfo(
                    tleStr,          // Satellite TLE string or array.
                    timestampMS,     // Timestamp (ms)
                    observer.lat,    // Observer latitude (degrees)
                    observer.lng,    // Observer longitude (degrees)
                    observer.height  // Observer elevation (km)
                );
                
                const satname = tleInfo.satname,
                      lng = satInfo.lng, //satellite longitude (degrees)
                      lat = satInfo.lat,  //satellite latitude (degrees)
                      elevation = satInfo.elevation,
                      range = satInfo.range,      //in km
                      altitude = satInfo.height,  //in km
                      velocity = satInfo.velocity; //in km
            
                const time = range/velocity, //THE PARAMETERS USED IN THIS CALCULATION ARE WRONG
                      timeToUser = toHHMMSS(time);
            
                const localTime = new Date(timestampMS).toString(),
                      UTCTime = new Date().toUTCString();
                
                console.log("-------------------------------------------------------------------");
                console.log("                       Satellite Info                             ");
                console.log("-------------------------------------------------------------------");
                console.log("Satellite ID: "+noradID);
                console.log("Satellite Name: "+satname);
                console.log("UTC: "+UTCTime);
                console.log("Latitude: "+lat);
                console.log("Longitude: "+lng);
                console.log("Altitude[km]: "+altitude);
                console.log("Velocity[km/s]: "+velocity);
                console.log("Elevation: "+elevation+"\n");
            
                console.log("-------------------------------------------------------------------");
                console.log("                       User Info                                     ");
                console.log("-------------------------------------------------------------------");
                console.log("Observer's IP address: "+userPublicIP);
                console.log("Latitude: "+observerLat);
                console.log("Longitude: "+observerLng);
                console.log("Local Time: "+localTime);
                console.log("Distance to satellite[km]: "+range)
                console.log("Time to next pass: "+timeToUser+"\n");
            } catch (e) {
                console.error(e.message);
            }
        });
    }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
    });
};

function passPredicitions(){
    https.get(baseURL+radioPassRequest+'/'+noradID+'/'+observerLat+'/'+observerLng+'/'+observerAlt+'/2/'+minEl+'&apiKey='+apiKey, (response) => {
        const { statusCode } = response;
        const contentType = response.headers['content-type'];
        
        let error;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                      `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
            error = new Error('Invalid content-type.\n' +
                      `Expected application/json but received ${contentType}`);
        }
        if (error) {
            console.error(error.message);
            // consume response data to free up memory
            response.resume();
            return;
        }
        
        response.setEncoding('utf8');
        let rawData = '';
        response.on('data', (chunk) => { rawData += chunk; });
        response.on('end', () => {
            try {                        
                const parsedData = JSON.parse(rawData),
                      allPasses = parsedData.passes,
                      numPasses = (parsedData.info).passescount;
                
                //console.log(parsedData);
                console.log("-------------------------------------------------------------------");
                console.log("       2 Day Radio Pass Predicitions [MinEl: 5 deg]                ");
                console.log("-------------------------------------------------------------------");
                
                for (i = 0; i < numPasses; i++){
                    const passInfo = allPasses[i];
                    
                    //Pass start
                    const timeStampUTC = passInfo.startUTC,
                          startTimeUTC = new Date(timeStampUTC*1000),
                          startTimeLocal = startTimeUTC.toString(),
                          startAz = passInfo.startAz,
                          startAzCompass = passInfo.startAzCompass;
                    
                    //Max altitude
                    const maxUTC = new Date(passInfo.maxUTC*1000),
                          maxLocalTime = maxUTC.toString(),
                          maxEl = passInfo.maxEl,
                          maxAz = passInfo.maxAz,
                          maxAzCompass = passInfo.maxAzCompass;
                    
                    //Pass End
                    const endUTC = new Date(passInfo.endUTC*1000),
                          endLocalTime = endUTC.toString(),
                          endAz = passInfo.maxAz,
                          endAzCompass = passInfo.maxAzCompass;
                    
                    //console logging
                    console.log("Start: "+startTimeLocal);
                    console.log("End: "+endLocalTime);
                    console.log("Maximum Elevation: "+maxEl+"\n");
                }
            } catch (e) {
                console.error(e.message);
            }
        });
    }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
    });
};

function toHHMMSS(input) {
    var sec_num = parseInt(input, 10),
        hours   = Math.floor(sec_num / 3600),
        minutes = Math.floor((sec_num - (hours * 3600)) / 60),
        seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
};

getObserverLocation()
timeToNextPass()
passPredicitions()