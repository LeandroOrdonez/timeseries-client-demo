# timeseries-client-demo
## Introduction

This repository contains a demo using the air quality time series fragments library from https://github.com/linkedtimeseries/timeseries-client.
The demo is an interactive map used to visualize air quality data.

## Prerequisites

Currently, in order to be able to query data fragments, a local running instance of an AirQualityServer is required. 
The code for this server can be acquired from https://github.com/sigvevermandere/AirQualityExpressServer. 
Instructions on how to setup the server can also be found there.

## How to use it

It is possible this repository does not contain the latest version of the timeseries-client. To get the latest version, clone the timeseries-client repo, run `npm run webpack` and import the bundled file into the demo.

Draw polygons on the map, select a time interval, indicate for which metric the data needs to be visualized,
optionally select an aggregation method and period and request data! The received data will be displayed in the graph at the bottom.
