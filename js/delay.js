function x(d) { return d.avg_delay_time; }
function y(d) { return d.delay_rate; }
function radius(d) { return d.total; }
function color(d) { return d.name; }
function key(d) { return d.name; }


var airline_map = {"NK":"Spirit",
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

var airline_domain = ["Alaska","Spirit","AmericanEagle","Jetblue","Delta","United","Southwest","Hawaiian","SkyWest","ExpressJet","Frontier","American"]

var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 29.5},
    width = 750 - margin.right-margin.left,
    height = 500 - margin.top - margin.bottom;

var xScale = d3.scalePow().exponent(0.7).domain([0,50]).range([0, width]),
    yScale = d3.scaleLinear().domain([0, 0.8]).range([height, 0]),
    radiusScale = d3.scaleSqrt().domain([0, 3000]).range([0, 15]),
    colorScale = d3.scaleOrdinal().range(d3.schemePaired).domain(airline_domain);

var legend = d3.legendColor()
  .scale(colorScale);

var xAxis = d3.axisBottom().scale(xScale).ticks(10),
    yAxis = d3.axisLeft().scale(yScale).ticks(10);

var svg = d3.select("#chart-delay").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .attr("stroke","white")
    .call(xAxis);

svg.append("g")
    .attr("class", "y axis")
    .attr("stroke","white")
    .call(yAxis);

svg.append("g")
    .attr("transform", "translate(620,0)")
    .call(legend);


svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .attr("stroke","white")
    .text("average delay time (minutes)");

svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .attr("stroke","white")
    .text("delay rate");

var label = svg.append("text")
    .attr("class", "date label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width)
    .text(1);

var div = d3.select("body").append("div") 
    .attr("class", "tooltip")       
    .style("opacity", 0);

function start(){

  var elem = document.getElementById('start_button');
  elem.parentNode.removeChild(elem);

  d3.json("ReadyData/airline_delay.json")
  .then(function(flights){
        var bisect = d3.bisector(function(d) { return d[0]; });

    function make_percent(x){
      return Math.trunc(x*100) + "%";
    }

    function round_twodigits(x){
      return Math.round(x * 100) / 100;
    }

    var dot = svg.append("g")
        .selectAll(".dot")
        .data(interpolateData(1))
        .enter().append("circle")
        .style("fill", function(d) { return colorScale(radius(d)); })
        .call(position)
//        .attr("data-legend",function(d) { return airline_map[d.name]})
        .sort(order)
        .on("mouseover", function(d) {    
            div.transition()    
                .duration(200)    
                .style("opacity", .9);    
            div .html("Airline:&nbsp&nbsp" + airline_map[d.name] + "<br/>"  + "Avg_delay:&nbsp" + round_twodigits(d.avg_delay_time) +" min" 
              + "<br/>" + "Delay_rate:&nbsp&nbsp"+make_percent(d.delay_rate) + "<br/>Flights:&nbsp&nbsp" + Math.trunc(d.total)) 
                .style("left", (d3.event.pageX) + "px")   
                .style("top", (d3.event.pageY) + "px");  
            })          
        .on("mouseout", function(d) {   
            div.transition()    
                .duration(500)    
                .style("opacity", 0); 
        });

    var box = label.node().getBBox();

    var overlay = svg.append("rect")
          .attr("class", "overlay")
          .attr("x", box.x - 4.5* box.width)
          .attr("y", box.y+box.height/3)
          .attr("width", 5.5* box.width)
          .attr("height", box.height/3)
          .on("mouseover", enableInteraction);

    svg.transition()
        .duration(20000)
        .ease(d3.easeLinear)
        .tween("date", tweenDate)
        .on("end", enableInteraction);

    // legend = svg.append("g")
    //   .attr("class","legend")
    //   .attr("transform","translate(50,30)")
    //   .style("font-size","12px")
    //   .call(d3.legend)

    // Positions the dots based on data.
    function position(dot) {
      dot .attr("cx", function(d) { return xScale(x(d)); })
          .attr("cy", function(d) { return yScale(y(d)); })
          .attr("r", function(d) { 
            return radiusScale(radius(d)); 
          });
    }

    // Defines a sort order so that the smallest dots are drawn on top.
    function order(a, b) {
      return radius(b) - radius(a);
    }

    function enableInteraction() {
      var dateScale = d3.scaleLinear()
          .domain([1, 53])
          .range([box.x - 4.5* box.width+5, box.x + box.width-5 ])
          .clamp(true);

      svg.transition().duration(0);

      overlay
          .on("mouseover", mouseover)
          .on("mouseout", mouseout)
          .on("mousemove", mousemove)
          .on("touchmove", mousemove);

      function mouseover() {
        label.classed("active", true);
      }

      function mouseout() {
        label.classed("active", false);
      }

      function mousemove() {
        displayDate(dateScale.invert(d3.mouse(this)[0]));
      }
    }


    function tweenDate() {
      var date = d3.interpolateNumber(1, 53);
      return function(t) { displayDate(date(t)); };
    }

    function displayDate(date) {
      dot.data(interpolateData(date)).call(position).sort(order);
      var day = (Math.round(date)-1)*7+1;
      label.text(convert_date(day));
    }

    function convert_date(date){
      if(date <=31){
        return "Jan." + padSingleDigit(date);
      } else if( date <=59){
        return "Feb." + padSingleDigit(date -31);
      } else if(date <= 90){
        return "Mar." + padSingleDigit(date - 59);
      } else if(date <= 120){
        return "Apr." + padSingleDigit(date - 90);
      } else if(date <= 151){
        return "May." + padSingleDigit(date -120);
      } else if(date <= 181){
        return "Jun." + padSingleDigit(date - 151);
      } else if(date <= 212){
        return "Jul." + padSingleDigit(date - 181);
      } else if(date <= 243){
        return "Aug." + padSingleDigit(date -212);
      } else if(date <= 273){
        return "Sep." + padSingleDigit(date -243);
      } else if(date <= 304){
        return "Oct." + padSingleDigit(date - 273);
      } else if(date <= 334){
        return "Nov." + padSingleDigit(date - 304);
      } else{
        return "Dec." + padSingleDigit(date - 334);
      }
    }

    function padSingleDigit(x){
      if(x < 10){
        return "0"+x;
      } else{
        return x;
      }
    }

    function interpolateData(date) {
      return flights.map(function(d) {
        return {
          name: d.name,
          delay_rate: interpolateValues(d.delay_rate, date),
          total: interpolateValues(d.total, date),
          avg_delay_time: interpolateValues(d.avg_delay_time, date)
        };
      });
    }

    function interpolateValues(values, date) {
      var i = bisect.left(values, date, 0, values.length - 1),
          a = values[i];
      if (i > 0) {
        var b = values[i - 1],
            t = (date - a[0]) / (b[0] - a[0]);
        return a[1] * (1 - t) + b[1] * t;
      }
      return a[1];
    }
  });
}
