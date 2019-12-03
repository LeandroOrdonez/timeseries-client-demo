let datafetcher = new TimeSeriesClientSide.DataFetcher();
let serverside = true;


// .toRad() fix
// from: http://stackoverflow.com/q/5260423/1418878
if (typeof(Number.prototype.toRad) === "undefined") {
    Number.prototype.toRad = function() {
        return this * Math.PI / 180;
    }
}

// TODO: fix this atrocious function
function toISO(date) {
    return date + ':00.000Z';
}

let polygon;
let currAggrMethod;
let currAggrPeriod;
function getAirQualityData() {
    let fromDate = toISO(document.getElementById('start').value);
    let toDate = toISO(document.getElementById('end').value);
    let selector = document.getElementById('metrics');
    let metric = selector[selector.selectedIndex].value;
    const aggrMethod = document.getElementById('aggrMethod').value;
    const aggrPeriod = document.getElementById('aggrPeriod').value;
    if (datafetcher.containsInterval(metric, fromDate, toDate) &&
        aggrMethod === currAggrMethod && aggrPeriod === currAggrPeriod) {
        fromDate = new Date( fromDate);
        toDate = new Date(toDate);
        parseDates(datafetcher.getCurrentObservations(metric), fromDate, toDate);
        buildChart(fromDate, toDate, metric);
        return;
    }

    const side = document.getElementById('aggregate_side').value;
    serverside = side === "serverside";

    if (! serverside) {
        fromDate = datafetcher.dateOffsetCorrection(fromDate, aggrPeriod);
        toDate = datafetcher.dateOffsetCorrection(toDate, aggrPeriod);
    }

    let args = [];
    if (serverside && aggrMethod !== "none") {
        args.push(aggrMethod);
    }
    if (serverside && aggrPeriod !== "none") {
        args.push(aggrPeriod);

    }
    args = [polygon, fromDate, toDate].concat(args);
    currAggrMethod = aggrMethod;
    currAggrPeriod = aggrPeriod;
    datafetcher.addFragmentListener(updateChart);
    console.log(args);
    datafetcher.getPolygonObservations(...args);
}

function getMetric(metricUrl) {
    let splitUrl = metricUrl.split(".");
    return splitUrl[splitUrl.length - 1].split(":")[0];
}

let map = L.map('mapid').setView([51.24058722714804, 4.406719207763673], 14);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    minZoom: 14,
    maxZoom: 14,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1Ijoic2lndmV2ZXJtYW5kZXJlIiwiYSI6ImNrMXhsdXp1ZDBjdHQzb3F0Z2N4ejdhaGIifQ.kJ1Wvq2jGo4Yudvx3idFZg'
}).addTo(map);

var editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);

var options = {
    position: 'topright',
    draw: {
        polyline: {
            shapeOptions: {
                color: '#f357a1',
                weight: 10
            }
        },
        polygon: {
            allowIntersection: false, // Restricts shapes to simple polygons
            drawError: {
                color: '#e1e100', // Color the shape will turn when intersects
                message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
            },
            shapeOptions: {
                color: '#c50808'
            }
        },
        circle: false, // Turns off this drawing tool
        rectangle: {
            shapeOptions: {
                clickable: false
            }
        },
    },
    edit: {
        featureGroup: editableLayers, //REQUIRED!!
        remove: false
    }
};

let drawControl = new L.Control.Draw(options);
map.addControl(drawControl);


map.on(L.Draw.Event.CREATED, function (e) {
    var type = e.layerType,
        layer = e.layer;

    if (type === 'marker') {
        layer.bindPopup('A popup!');
    }

    if (type === 'polygon') {
        polygon = layer.getLatLngs()[0];
    }

    editableLayers.addLayer(layer);
});

map.on('click', function(e) {
    console.log(getTileURL(e.latlng.lat, e.latlng.lng, map.getZoom()));
});

function getTileURL(lat, lon, zoom) {
    let xtile = parseInt(Math.floor( (lon + 180) / 360 * Math.pow(2, zoom) ));
    let ytile = parseInt(Math.floor( (1 - Math.log(Math.tan(lat.toRad()) + 1 / Math.cos(lat.toRad())) / Math.PI) / 2 * Math.pow(2, zoom) ));
    return "" + zoom + "/" + xtile + "/" + ytile;
}

// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = screen.width - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

// parse the date / time
var parseTime = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ');

// set the ranges
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// define the line
var valueline = d3.line()
    .x(function (d) {
        return x(d.resultTime);
    })
    .y(function (d) {
        return y(d.hasSimpleResult);
    });

// Define the axes
var xAxis = d3.axisBottom().scale(x);

var yAxis = d3.axisLeft().scale(y);

// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Add the X Axis
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

// Add the Y Axis
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

// Add the valueline path.
svg.append("path")
    .attr("class", "line");


function parseDates(data, fromDate, toDate) {
    console.log(data);
    data.forEach(function (d) {
        if (d.resultTime[d.resultTime.length - 1] === 'Z') {
            // console.log("[LOG] graphside fromDate: " + fromDate);
            // console.log("[LOG] resulttime: " + new Date(d.resultTime));
            // console.log("[LOG] graphside toDate: " + toDate);
            let resultDate = new Date(d.resultTime);
            //resultDate = resultDate.setHours(resultDate.getHours() - 1);

            console.log("conversion");
            d.resultTime = parseTime(d.resultTime);

        }
    });

    return data;
}

function updateChart(fragment) {
    const fromDate = parseTime(toISO(document.getElementById('start').value));
    const toDate = parseTime(toISO(document.getElementById('end').value));
    let selector = document.getElementById('metrics');
    let metric = selector[selector.selectedIndex].value;
    if (typeof datafetcher.getCurrentObservations(metric) === "undefined") {
        return;
    }

    let data;
    if (serverside) {
        data = parseDates(datafetcher.getCurrentObservations(metric), new Date(fragment['startDateString']), new Date(fragment['endDateString']));
    } else {
        data = parseDates(datafetcher.getCurrentObservations(metric, currAggrMethod, currAggrPeriod), new Date(fragment['startDateString']), new Date(fragment['endDateString']));
    }
    buildChart(data, fromDate, toDate, metric);
}

function buildChart(data, fromDate, toDate, metric) {
    console.log(data);

    x.domain(d3.extent([fromDate, toDate]));
    y.domain([d3.min(data, d => d.hasSimpleResult),
        d3.max(data, function (d) {
            return d.hasSimpleResult;
        })]);
    var svg = d3.select("body").transition();

    // Make the changes
    svg.select(".line")   // change the line
        .duration(750)
        .attr("d", valueline(data));
    svg.select(".x.axis") // change the x axis
        .duration(750)
        .call(d3.axisBottom(x));
    svg.select(".y.axis") // change the y axis
        .duration(750)
        .call(d3.axisLeft(y));


}


