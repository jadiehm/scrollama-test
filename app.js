  // using d3 for convenience
  var container = d3.select('#scroll');
  var graphic = container.select('.scroll__graphic');
  var chart = graphic.select('.chart');
  var text = container.select('.scroll__text');
  var step = text.selectAll('.step');

  // initialize the scrollama
  var scroller = scrollama();

  // generic window resize listener event
  function handleResize() {
    // 1. update height of step elements
    var stepHeight = Math.floor(window.innerHeight * 0.75);
    step.style('height', stepHeight + 'px');

    // 2. update width/height of graphic element
    var bodyWidth = d3.select('body').node().offsetWidth;

    graphic
      .style('width', bodyWidth + 'px')
      .style('height', window.innerHeight + 'px');

    var chartMargin = 32;
    var textWidth = text.node().offsetWidth;
    var chartWidth = graphic.node().offsetWidth - textWidth - chartMargin;

    chart
      .style('width', chartWidth + 'px')
      .style('height', Math.floor(window.innerHeight / 2) + 'px');


    // 3. tell scrollama to update new element dimensions
    scroller.resize();
  }

  //draw d3 chart
  function drawChart() {
    //Margins and dimensions
    var margin = {top: 10, right: 10, bottom: 30, left: 50};
    var widther = d3.select(".chart").node().clientWidth;
        width = widther - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

    //Parses date for correct time format
    var parseDate = d3.timeParse("%d-%b-%y");

    //Appends svg
    var svg = d3.select(".chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Creates scales
    var xScale = d3.scaleTime()
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .range([height, 0]);

    //Sets axes styles
    var xAxis = d3.axisBottom()
        .scale(xScale)
        .tickPadding(8)
        .ticks(8)
        .tickFormat(d3.timeFormat("%Y"));

    var yAxis = d3.axisLeft()
       .scale(yScale)
       .tickSize(-width)
       .tickPadding(8)
       .ticks(5)
       .tickFormat(function(d) { return "$" + d + ".00"; });

    //Sets line function
    var line = d3.line()
        .curve(d3.curveStepAfter)
        .x(function(d) { return xScale(d.date); })
        .y(function(d) { return yScale(d.dollar); });

    //Loads data and triggers chart
    d3.csv("minwage.csv", ready);

    function ready(err, data, dataType) {
      if (err) throw "error loading data";

      //Format and sort the data
      data.forEach(function(d) {
        d.dollar = +d.dollar;
        d.date = parseDate(d.date);
      })

      var maxX = d3.max(data, function(d) { return d.date; });
      var maxY = d3.max(data, function(d) { return d.dollar; });

      //Defines scale domains
      xScale.domain(d3.extent(data, function(d) { return d.date; }));
      yScale.domain([0, 10]);

      //Appends axes
      var yAxisGroup = svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .selectAll("g")
        .classed("g-baseline", function(d) {return d == 0});

      var xAxisGroup = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

      //Filters the data
      initialType = data.filter(function(d) { return d.type === "Unadjusted";});

      //Binds the data to the line
      var drawline = svg.append("path")
        .datum(initialType)
        .attr("class", "line")
        .attr("d", line);
    }
  }

  // scrollama event handlers
  function handleStepEnter(response) {
    // response = { element, direction, index }

    // add color to current step only
    step.classed('is-active', function (d, i) {
      return i === response.index;
    })

    // update graphic based on step
    chart.select('p').text(response.index + 1)

    d3.select(".line")
      .attr("class", "line line" + response.index + 1)
  }

  function handleContainerEnter(response) {
    // response = { direction }

    // sticky the graphic (old school)
    graphic.classed('is-fixed', true);
    graphic.classed('is-bottom', false);
  }

  function handleContainerExit(response) {
    // response = { direction }

    // un-sticky the graphic, and pin to top/bottom of container
    graphic.classed('is-fixed', false);
    graphic.classed('is-bottom', response.direction === 'down');
  }

  function init() {
    // 1. force a resize on load to ensure proper dimensions are sent to scrollama
    handleResize();

    drawChart();

    // 2. setup the scroller passing options
    // this will also initialize trigger observations
    // 3. bind scrollama event handlers (this can be chained like below)
    scroller.setup({
      container: '#scroll',
      graphic: '.scroll__graphic',
      text: '.scroll__text',
      step: '.scroll__text .step',
      debug: true,
    })
      .onStepEnter(handleStepEnter)
      .onContainerEnter(handleContainerEnter)
      .onContainerExit(handleContainerExit);

    // setup resize event
    window.addEventListener('resize', handleResize);
  }

  // kick things off
  init();
