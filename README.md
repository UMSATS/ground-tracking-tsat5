# Satellite Tracking for TSAT5 Ground Station

# Description
This repository contains software for tracking the ISS and predicting satellite passes to be used for radio communication over an observer's location. The quality of the pass is defined by the highest elevation during the pass, which is a user-defined parameter.
# Dependencies
This software is built on Node.js, which needs to be [installed](https://nodejs.org/en/download/) first. Additionally, the software depends on following software:

- [tle.js](https://github.com/davidcalhoun/tle.js/) (Satellite TLE tools in JavaScript),
- [https](https://nodejs.org/api/https.html) (Node.js https api)
- The data used in this software is from the [N2YO API](https://www.n2yo.com/api/)
# About UMSATS
UMSATS is a University of Manitoba student group that works to design and build 3U nanosatellites to compete in the Canadian Satellite Design Challenge (CSDC). Our website can be found here: http://www.umsats.ca/
