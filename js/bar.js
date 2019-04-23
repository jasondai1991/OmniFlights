var fileName = "ReadyData/chart2.csv";
var chartLables = [];

var airline_translation = {"NK":"Spirit",
                   "WN":"Southwest",
                   "B6":"Jetblue",
                   "UA":"United",
                   "AA":"American",
                   "DL":"Delta",
                   "OO":"SkyWest",
                   "F9":"Frontier",
                   "EV":"ExpressJet",
                   "HA":"Hawaiian",
                   "AS":"Alaska",
                   "MQ":"AmericanEagle"
                  };

var listForAll = [],
    cityMap = {},
    airlineMap = {},
    maxVal = {};

for(var i=0; i<144; i++){
    chartLables.push(i);
    listForAll.push(0);
}

d3.csv(fileName, function(error, data) {
    data.forEach(function(d) {
        if(d.Type == 'City'){
            var city = d.Index;
            cityMap[city] = [];
            chartLables.forEach(function(field) {
                var curval = d[field];
                if(typeof curval === "undefined"){
                    curval = 0;
                }
                cityMap[city].push( +curval );
                listForAll[field] += Number(curval);
            });
            maxVal[city] = Math.max(...cityMap[city]);
        } else{
            var airline = airline_translation[d.Index];
            airlineMap[airline] = [];
            chartLables.forEach(function(field) {
                var curval = d[field];
                if(typeof curval === "undefined"){
                    curval = 0;
                }
                airlineMap[airline].push( +curval );
            });
            maxVal[airline] = Math.max(...airlineMap[airline]);
        }
    });
    cityMap.All = listForAll;
    airlineMap.All = listForAll;
    maxVal["All"] = Math.max(...listForAll);
});

var tierdMap = {},
    tierdFile = "ReadyData/chart3.csv",
    tierdMaxVal = {};

d3.csv(tierdFile, function(error, data) {
    data.forEach(function(d) {
        var airline = airline_translation[d.airline];
        if(!(airline in tierdMap)){
            tierdMap[airline] = {};
        }
        var city = d.City;
        var curMap = tierdMap[airline];
        curMap[city] = [];
        chartLables.forEach(function(field) {
            var curval = d[field];
            if(typeof curval === "undefined"){
                curval = 0;
            }
            curMap[city].push( +curval );
        });
        tierdMap[airline] = curMap;
        if(!(airline in tierdMaxVal)){
            tierdMaxVal[airline] = {};
        }
        var curMaxVal = tierdMaxVal[airline];
        curMaxVal[city] = Math.max(...curMap[city]);
        tierdMaxVal[airline] = curMaxVal;
        tierdMap[airline].All = airlineMap[airline];
        tierdMaxVal[airline].All = maxVal[airline];
    });
});

function selectAirline(){
    d3.select("#Both").select("*").remove();
    var cityBtn = document.getElementById("cityBtn");
    var bothBtn = document.getElementById("bothBtn");
    var airlineBtn = document.getElementById("airlineBtn");
    cityBtn.style.backgroundColor = "#e7e7e7";
    bothBtn.style.backgroundColor = "#e7e7e7";
    airlineBtn.style.backgroundColor = "#00BFFF";

    var container1 = d3.select("#vis-container1");
    var container2 = d3.select("#vis-container2");

    makeVis(container1, airlineMap, maxVal);
    makeVis(container2, airlineMap, maxVal);
}

function selectCity(){
    d3.select("#Both").select("*").remove();
    var cityBtn = document.getElementById("cityBtn");
    var bothBtn = document.getElementById("bothBtn");
    var airlineBtn = document.getElementById("airlineBtn");
    airlineBtn.style.backgroundColor = "#e7e7e7";
    bothBtn.style.backgroundColor = "#e7e7e7";
    cityBtn.style.backgroundColor = "#00BFFF";

    var container1 = d3.select("#vis-container1");
    var container2 = d3.select("#vis-container2");

    makeVis(container1, cityMap, maxVal);
    makeVis(container2, cityMap, maxVal);
}

function selectBoth(){
    d3.select("#Both").select("*").remove();
    var cityBtn = document.getElementById("cityBtn");
    var bothBtn = document.getElementById("bothBtn");
    var airlineBtn = document.getElementById("airlineBtn");
    airlineBtn.style.backgroundColor = "#e7e7e7";
    cityBtn.style.backgroundColor = "#e7e7e7";
    bothBtn.style.backgroundColor = "#00BFFF";

    var bothDiv = document.getElementById("Both");
    bothDiv.style.display = "block";

    var airlines = Object.keys(airlineMap).sort();

    var index = airlines.indexOf("All");
    if(index > -1){
        airlines.splice(index,1);
    }

    var bothDrop = d3.select("#Both")
                    .append("select")
                    .attr("padding", 30)
                    .on("change", function(){
                        var newKey = d3.select(this).property('value'),
                        cityMap2 = tierdMap[newKey];
                        newMaxVal = tierdMaxVal[newKey];

                        var container1 = d3.select("#vis-container1");
                        var container2 = d3.select("#vis-container2");

                        makeVis(container1, cityMap2, newMaxVal);
                        makeVis(container2, cityMap2, newMaxVal);
                    });

    bothDrop
    .selectAll("option")
    .data(airlines)
    .enter().append("option")
    .attr("value", function (d) { return d; })
    .property("selected", function(d){ return d === "American"; })
    .text(function (d) {
        return d; 
    }); 


    var cityMap2 = tierdMap["American"];
    var newMaxVal = tierdMaxVal["American"];

    var container1 = d3.select("#vis-container1");
    var container2 = d3.select("#vis-container2");

    makeVis(container1, cityMap2, newMaxVal);
    makeVis(container2, cityMap2, newMaxVal);
}

var makeVis = function(container, map, vals) {

    container.selectAll('*').remove();
    // Define dimensions of vis
    var margin = { top: 30, right: 50, bottom: 30, left: 50 },
        width  = 600 - margin.left - margin.right,
        height = 450 - margin.top  - margin.bottom;

        // Make x scale
    var xScale = d3.scale.ordinal()
        .domain(chartLables)
        .rangeBands([0, width],0.1);

    var yScale = d3.scale.linear()
        .range([height, 0]);


    var svg = container
        .append("svg")
        .attr("width",  width  + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + (margin.top) + ")");

    function transform_tick(x){
        return x/6 + ":00";
    }

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .tickValues([0,12,24,36,48,60,72,84,96,108,120,132])
        .tickFormat(function(d){ return transform_tick(d); });

    var xAxisElem = svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width+26)
    .attr("y", height)
    .text("Time");

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    var yAxisHandleForUpdate = svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    yAxisHandleForUpdate.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Value");

    var label = svg.append("text")
        .attr("class", "compare label")
        .attr("text-anchor", "middle")
        .attr("y", 0)
        .attr("x", width/2)
        .text(1);

    var description = svg.append("text")
        .attr("class", "compare text")
        .attr("text-anchor", "start")
        .attr("y", 30)
        .attr("x", width/2)
        .text(1);

    var updateBars = function(data, max, curKey) {
        // First update the y-axis domain to match data
        yScale.domain( [0, d3.max(data, function(d) { return d;})]);
        yAxisHandleForUpdate.call(yAxis);

        label.text(curKey);

        var max_time = 0;
        for( var i=0; i< data.length; i++){
            if(data[i] === max){
                max_time = i;
                break;
            }
        }

        function pad_digit(x){
            if(x < 10){
                return "0"+x;
            } else{
                return x;
            }
        }

        show_time = pad_digit(Math.floor(max_time * 10 / 60)) + ":" + pad_digit(max_time * 10 % 60);
        description.text("Peak at " +show_time + " of " + Math.round(max *100)/100 + " flights");

        var bars = svg.selectAll(".bar").data(data);
           
        //remove original charts
        bars.transition()
            .duration(200)
            .attr("height", function(d,i) { return 0; });

        //add new charts
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", function(d,i) { return xScale( chartLables[i] ); })
            .attr("width", xScale.rangeBand())
            .attr("y", function(d,i) { 
                return yScale(d); 
            })
            .attr("height", 0);

        //make animation

        bars
            .transition()
            .duration(200)
            .delay(function (d, i) {
                return i * 10;
            })
            .attr("y", function(d) { return yScale(d); })
            .attr("height", function(d,i) { 
                return height - yScale(d); 
            });

        bars.attr("class", "bar")
            .filter(function(d) { 
                return d === max; 
            })
            .classed("peak_bar", true);

        bars.exit().remove();

    };

    var dropdownChange = function() {
        var newKey = d3.select(this).property('value'),
            newData   = map[newKey],
            max = vals[newKey];
        updateBars(newData, max, newKey);
    };

    var dropdown = container.insert("select", "svg")
                            .attr("align", "center")
                            .on("change", dropdownChange);

    var cities = Object.keys(map).sort();

    dropdown.selectAll("option")
        .data(cities)
        .enter().append("option")
        .attr("value", function (d) { return d; })
        .property("selected", function(d){ return d === "All"; })
        .text(function (d) {
            return d; // capitalize 1st letter
        });

    var initialData = map["All"];
    updateBars(initialData, vals.All, "All");
};