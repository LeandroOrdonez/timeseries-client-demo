let datafetcher = new TimeSeriesClientSide.DataFetcher();


// TODO: fix these atrocious functions
function toISO(date) {
    return date + ':00.000Z';
}


function toCorrectTimezone(date) {
    date.setHours(date.getHours() - 2);
    return date;
}


function getAirQualityData() {
    const fromDate = toISO(document.getElementById('start').value);
    const toDate = toISO(document.getElementById('end').value);
    console.log(fromDate);
    datafetcher.addFragmentListener(updateChart);
    datafetcher.getObservations(fromDate, toDate);
}


function populatePicker() {
    let select = document.getElementById("metrics");
    for (let key in datafetcher.observations) {
        console.log(key);
        let opt = document.createElement('option');
        opt.value = key;
        opt.innerHTML = getMetric(key);
        select.appendChild(opt);
    }
}

function getMetric(metricUrl) {
    let splitUrl = metricUrl.split(".");
    return splitUrl[splitUrl.length - 1].split(":")[0];
}




// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 1400 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

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
    //console.log(fromDate);
    //console.log(toDate);
    data.forEach(function (d) {
        if (d.resultTime[d.resultTime.length - 1] === 'Z') {
            let resultDate = new Date(d.resultTime);
            //console.log(resultDate);
            if (resultDate <= toDate && resultDate >= fromDate) {
                d.resultTime = parseTime(d.resultTime);
                //console.log(resultDate);
            }
        }
    });

    return data;
}

function updateChart(fragment) {
    console.log("start in html: " + toISO(document.getElementById('start').value));
    const fromDate = parseTime(toISO(document.getElementById('start').value));
    const toDate = parseTime(toISO(document.getElementById('end').value));
    let selector = document.getElementById('metrics');
    let metric = selector[selector.selectedIndex].value;
    console.log(datafetcher.getAllCurrentObservations());
    parseDates(datafetcher.getCurrentObservations(metric), new Date(fragment['startDate']), new Date(fragment['endDate']));
    buildChart(fromDate, toDate, metric);
}

function buildChart(fromDate, toDate, metric) {
    let data = datafetcher.getCurrentObservations(metric);
    console.log(data);
    //data.forEach( d => console.log(d.resultTime));
    // Scale the range of the data

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


