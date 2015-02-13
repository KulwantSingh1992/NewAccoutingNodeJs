'use strict';

/**
 * @ngdoc function
 * @name paxcomTerminalApp.controller:SalesGraph
 * @description
 * # SalesGraph
 * Controller of the paxcomTerminalApp
 */
var saleFilterType;
angular.module('paxcomTerminalApp').controller('SalesChartCtrl', function ($scope, desktopService) {
    $scope.salesDataFilter = {};
    $scope.salesDataFilter.orderBy = saleFilterType || 'sales';
    $scope.optionSet = angular.copy(desktopService.getOptionSet());
    $scope.optionSet.startDate = moment().subtract(7, 'days');
    $scope.graphData = {
        salesChart: {
            width: 600,
            height: 150
        },
        bigSalesChart: {
            width: 800,
            height: 450
        }
    }
    
    var salesChartCB = function (start, end, label) {
        $scope.optionSet.startDate = start;
        $scope.optionSet.endDate = end;
        $('.saleDateRange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        $scope.salesChart('bigSalesChart');
    }

    $scope.initDatePicker = function (graphId) {
        if (graphId == 'salesChart'){
            $('.saleDateRange span').html(moment().subtract(30, 'days').format('MMMM D, YYYY') + ' - ' + moment().format('MMMM D, YYYY'));
        }
        $('.saleDateRange').daterangepicker($scope.optionSet, salesChartCB);
    }

    $scope.filerSalesDataChart = function (graphId) {
        $scope.salesChart(graphId);
    }
    
    $scope.startCallback = function(){
        console.log('drag start');
    }

    $scope.salesChart = function (graphId) {
        if(graphId != 'salesChart'){
            setTimeout(function(){
               $('#mainSalesChartDiv').attr('data-drag','false');
            }, 500);
            $('#SalesChartModal').modal('show');
        }else{
            setTimeout(function(){
                $('#mainSalesChartDiv').attr('data-drag','true');
            }, 500);
        }
        saleFilterType = $scope.salesDataFilter.orderBy;
        var graphDataForCurrent = $scope.graphData[graphId];
        $scope.initDatePicker(graphId);
        $('.calendar').hide();
        $('.range_inputs').hide();
        $('.ranges ul li:last-child').hide();
        setTimeout(function () {
            var margin = {
                    top: 10,
                    right: 20,
                    bottom: 30,
                    left: 50
                },
                width = graphDataForCurrent.width - margin.left - margin.right,
                height = graphDataForCurrent.height - margin.top - margin.bottom;

            var format = d3.time.format("%Y-%m-%d").parse;

            var x = d3.time.scale().range([-10, width]);

            var y = d3.scale.linear().range([height, 0]);

            var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format("%Y-%m-%d"));

            var yAxis = d3.svg.axis().scale(y).orient("left");

            var line = d3.svg.line()
                .interpolate("linear")
                .x(function (d) {
                    return x(d.orderdate);
                })
                .y(function (d) {
                    return y(d.value);
                });

            var start = 10;

            var color = d3.scale.category10();

            $('#' + graphId).html('');
            
            if(graphId == 'salesChart'){
                 var svg = d3.select("#" + graphId).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("viewBox","0 0 600 160")
                    .attr("perserveAspectRatio","xMinYMid")
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            }else{
                var svg = d3.select("#" + graphId).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("viewBox","0 0 850 450")
                    .attr("perserveAspectRatio","xMinYMid")
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            }
            
            d3.text('/getSalesData')
                .header("Content-Type", "application/json")
                .post(
                    JSON.stringify({
                        startDate: new Date($scope.optionSet.startDate).getTime(),
                        endDate: new Date($scope.optionSet.endDate).getTime()
                    }),
                    function (err, result) {
                        result = JSON.parse(result);
                        if (result.length >= 1) {
                            var data = [];
                            var channels = [];
                            result.map(function (item) {
                                if (channels.indexOf(item.channel_id) == -1) {
                                    channels.push(item.channel_id);
                                }
                            });

                            result.map(function (item) {
                                var mapData = {};
                                channels.map(function (channel) {
                                    mapData[channel] = 0;
                                });
                                var indexOfItem = arrayObjectIndexOf(data, item.orderdate, 'orderdate');
                                if (indexOfItem == -1) {
                                    mapData.orderdate = item.orderdate;
                                    if ($scope.salesDataFilter.orderBy == 'sales')
                                        mapData[item.channel_id] = item.total || 0;
                                    else
                                        mapData[item.channel_id] = item.num_order || 0;

                                    data.push(mapData);
                                } else {
                                    if ($scope.salesDataFilter.orderBy == 'sales')
                                        data[indexOfItem][item.channel_id] = item.total || 0;
                                    else
                                        data[indexOfItem][item.channel_id] = item.num_order || 0;
                                }
                            });

                            var labelVar = 'orderdate';

                            var varNames = d3.keys(data[0]).filter(function (key) {
                                return key !== labelVar;
                            });
                            color.domain(varNames);

                            data.forEach(function (d) {
                                d.orderdate = format(d.orderdate);
                            });

                            var seriesData = color.domain().map(function (name) {
                                return {
                                    name: name,
                                    values: data.map(function (d) {
                                        return {
                                            orderdate: d.orderdate,
                                            label: name,
                                            value: +d[name]
                                        };
                                    })
                                };
                            });

                            x.domain(d3.extent(data, function (d) {
                                return d.orderdate;
                            }));

                           if (seriesData.length == 1) {
                               var yMax = d3.max(seriesData, function (c) {
                                                return d3.max(c.values, function (v) {
                                                    return v.value;
                                                });
                                            });
                               
                               if(yMax < 10) {yMax = 7;}
                               
                                y.domain([
                                    (d3.min(seriesData, function (c) {
                                        return d3.min(c.values, function (v) {
                                            return v.value;
                                        });
                                    }) - 1),yMax*5]);
                            } else {
                                y.domain([
                                    d3.min(seriesData, function (c) {
                                        return d3.min(c.values, function (v) {
                                            return v.value;
                                        });
                                    }),
                                    d3.max(seriesData, function (c) {
                                        return d3.max(c.values, function (v) {
                                            return v.value;
                                        });
                                    })*5
                                ]);
                           }

                            svg.append("g")
                                .attr("class", "x-axis")
                                .attr("transform", "translate(" + start + "," + height + ")")
                                .style({
                                    'stroke': '#666',
                                    'fill': 'none',
                                    'stroke-width': '1px',
                                    'shape-rendering': 'crispEdges'
                                })
                                .call(xAxis);

                            if ($scope.salesDataFilter.orderBy == 'sales') {
                                svg.append("g")
                                    .attr("class", "y-axis")
                                    .style({
                                        'stroke': '#666',
                                        'fill': 'none',
                                        'stroke-width': '1px',
                                        'shape-rendering': 'crispEdges'
                                    })
                                    .call(yAxis)
                                    .append("text")
                                    .attr("class", "salesText")
                                    .attr({'font-size':'10px',
                                           'font-weight':'bold',
                                           'font-family':'sans-serif',
                                           'stroke':'none',
                                           'stroke-width':'0',
                                           'fill':'#666'
                                    })
                                    .attr("transform", "rotate(-90)")
                                    .attr("y", 6)
                                    .attr("dy", ".71em")
                                    .style("text-anchor", "end")
                                    .text("Total Sales(in ₹)");
                            } else {
                                svg.append("g")
                                    .attr("class", "y-axis")
                                    .style({
                                        'stroke': '#666',
                                        'fill': 'none',
                                        'stroke-width': '1px',
                                        'shape-rendering': 'crispEdges'
                                    })
                                    .call(yAxis)
                                    .append("text")
                                    .attr("class", "salesText")
                                    .attr({'font-size':'10px',
                                           'font-weight':'bold',
                                           'font-family':'sans-serif',
                                           'stroke':'none',
                                           'stroke-width':'0',
                                           'fill':'#666'
                                    })
                                    .attr("transform", "rotate(-90)")
                                    .attr("y", 6)
                                    .attr("dy", ".71em")
                                    .style("text-anchor", "end")
                                    .text("No of Orders");
                            }
                            
                            $('g.x-axis g.tick text').attr({'font-size':'10px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
                            $('g.y-axis g.tick text').attr({'font-size':'10px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
                            
                            var series = svg.selectAll(".series")
                                .data(seriesData)
                                .enter().append("g")
                                .attr("class", "series")
                                .attr("transform", "translate(" + start + "," + 0 + ")");

                            series.selectAll(".point")
                                .data(function (d) {
                                    return d.values;
                                })
                                .enter().append("circle")
                                .attr("class", "point")
                                .attr("cx", function (d) {
                                    return x(d.orderdate)
                                })
                                .attr("cy", function (d) {
                                    return y(d.value);
                                })
                                .attr("r", "3px")
                                .style("fill", function (d) {
                                    return color(d.value);
                                })
                                .style("stroke", "grey")
                                .style("stroke-width", "2px")
                                .on("mouseover", function (d) {
                                    showPopLine.call(this, d);
                                })
                                .on("mouseout", function (d) {
                                    removePopovers();
                                })

                            series.append("path")
                                .attr("class", "line")
                                .attr("d", function (d) {
                                    return line(d.values);
                                })
                                .style("stroke", function (d) {
                                    return color(d.name);
                                })
                                .style({
                                    'stroke-width': '2px',
                                    'fill':'none'
                                });

                            var legend = svg.selectAll(".legend")
                                .data(varNames.slice().reverse())
                                .enter().append("g")
                                .attr("class", "salesLegend")
                                .attr("transform", function (d, i) {
                                    var xCoord = -width/2 + (i*80);
                                    var yCoord = height+25;
                                    return "translate(" + xCoord + "," + yCoord + ")";
                                });

                            legend.append("rect")
                                .attr("x", width - 10)
                                .attr("width", 10)
                                .attr("height", 10)
                                .style("fill", color);

                            legend.append("text")
                                .attr("x", width - 12)
                                .attr("y", 6)
                                .attr("dy", ".35em")
                                .style("text-anchor", "end")
                                .attr({'font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'})
                                .text(function (d) {
                                    return d;
                                });
                            
                        } else {
                            if (graphId == 'salesChart')
                                $('#salesChart').html("<div style='padding-top:10%;text-align:center;font-size:25px;'>No Data</div>");
                            else
                                $('#bigSalesChart').html("<div style='padding-top:20%;text-align:center;font-size:25px;height:450px;'>No Data</div>");
                        }
                    });
            
            function showPopLine(d) {
                $(this).popover({
                    title: d.label,
                    placement: 'auto top',
                    container: 'body',
                    trigger: 'manual',
                    html: true,
                    content: function () {
                        return ($scope.salesDataFilter.orderBy == 'sales') ? ("Date: " + d.orderdate.toLocaleDateString('en-GB') + "<br/>Sales Value: " + d.value) :
                            ("Date: " + d.orderdate.toLocaleDateString('en-GB') + "<br/>Number Of Orders: " + d.value);
                    }
                });
                $(this).popover('show');
            }

            function removePopovers() {
                $('.popover').each(function () {
                    $(this).remove();
                });
            }

        }, 100);
    }
});

var chart = $("#salesChart"),
    aspect = chart.width() / chart.height(),
    container = chart.parent();
$(window).on("resize", function() {
    var targetWidth = container.width();
    chart.attr("width", targetWidth);
    chart.attr("height", Math.round(targetWidth / aspect));
}).trigger("resize");