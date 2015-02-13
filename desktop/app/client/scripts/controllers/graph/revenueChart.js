'use strict';

/**
 * @ngdoc function
 * @name paxcomTerminalApp.controller:RevenueGraph
 * @description
 * # RevenueGraph
 * Controller of the paxcomTerminalApp
 */
angular.module('paxcomTerminalApp').controller('RevenueChartCtrl', function ($scope, desktopService) {

    $scope.optionSet = angular.copy(desktopService.getOptionSet());
    $scope.graphData = {
        costSaleChart: {
            width: 600,
            height: 150
        },
        bigCostSaleChart: {
            width: 800,
            height: 450
        }
    };

    var revenueChartCB = function (start, end, label) {
        $scope.optionSet.startDate = start;
        $scope.optionSet.endDate = end;
        $('.costSaleRange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        $scope.revenueChart('bigCostSaleChart');
    }

    $scope.initDatePicker = function (graphId) {
        if (graphId == 'costSaleChart')
            $('.costSaleRange span').html(moment().subtract(30, 'days').format('MMMM D, YYYY') + ' - ' + moment().format('MMMM D, YYYY'));
        $('.costSaleRange').daterangepicker($scope.optionSet, revenueChartCB);
    }

    $scope.revenueChart = function (graphId) {
        if(graphId != 'costSaleChart'){
           $('#barChartModal').modal('show');
        }
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
                    left: 40
                },
                width = graphDataForCurrent.width - margin.left - margin.right,
                height = graphDataForCurrent.height - margin.top - margin.bottom;

            //var x0 = d3.scale.ordinal().rangeRoundBands([0, width], .1);
            var x0 = d3.scale.ordinal().rangePoints([0, width], 0.8);

            var x1 = d3.scale.ordinal();

            var y = d3.scale.linear().range([height, 0]);

            var color = d3.scale.category10();

            var xAxis = d3.svg.axis().scale(x0).orient("bottom");

            var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(d3.format(".2s"));

            $('#' + graphId).html('');
            
            if(graphId == 'costSaleChart'){
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
            
            d3.text("/getSalesAndRevenueData")
                .header("Content-Type", "application/json")
                .post(
                    JSON.stringify({
                        startDate: new Date($scope.optionSet.startDate).getTime(),
                        endDate: new Date($scope.optionSet.endDate).getTime()
                    }),
                    function (error, data) {
                        data = JSON.parse(data);
                        if (data.length >= 1) {
                            var ageNames = d3.keys(data[0]).filter(function (key) {
                                return key !== "orderdate";
                            });

                            data.forEach(function (d) {
                                d.ages = ageNames.map(function (name) {
                                    return {
                                        name: name,
                                        value: +d[name]
                                    };
                                });
                            });

                            x0.domain(data.map(function (d) {
                                return d.orderdate;
                            }));
                            //x1.domain(ageNames).rangeRoundBands([0, x0.rangeBand()]);
                            x1.domain(ageNames).rangeRoundBands([0, 60]);
                            y.domain([0, d3.max(data, function (d) {
                                return d3.max(d.ages, function (d) {
                                    return d.value;
                                });
                            })]);

                            svg.append("g")
                                .attr("class", "x-axis")
                                .attr("transform", "translate(0," + height + ")")
                                .style({
                                    'stroke': '#666',
                                    'fill': 'none',
                                    'stroke-width': '1px',
                                    'shape-rendering': 'crispEdges'
                                })
                                .call(xAxis);

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
                                .attr("class", "costSaleText")
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
                                .text("Amount");
                            
                             $('g.x-axis g.tick text').attr({'font-size':'10px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
                            $('g.y-axis g.tick text').attr({'font-size':'10px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
                            
                            var month = svg.selectAll(".month")
                                .data(data)
                                .enter().append("g")
                                .attr("class", "g")
                                .attr("transform", function (d) {
                                    return "translate(" + (x0(d.orderdate)-30) + ",0)";
                                });

                            month.selectAll("rect")
                                .data(function (d) {
                                    return d.ages;
                                })
                                .enter().append("rect")
                                //.attr("width", x1.rangeBand())
                                .attr("width", "30px")
                                .attr("x", function (d) {
                                    return x1(d.name);
                                })
                                .attr("y", function (d) {
                                    return y(d.value);
                                })
                                .attr("height", function (d) {
                                    return height - y(d.value);
                                })
                                .style("fill", function (d) {
                                    return color(d.name);
                                })
                                .on("mouseover", function (d) {
                                    showPopBar.call(this, d);
                                })
                                .on("mouseout", function (d) {
                                    removePopovers();
                                });

                            var legend = svg.selectAll(".legend")
                                .data(ageNames.slice())
                                .enter().append("g")
                                .attr("class", "costSaleLegend")
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
                            if (graphId == 'costSaleChart')
                                $('#costSaleChart').html("<div style='padding-top:10%;text-align:center;font-size:25px;'>No Data</div>");
                            else
                                $('#bigCostSaleChart').html("<div style='padding-top:20%;text-align:center;font-size:25px;height:450px;'>No Data</div>");
                        }
                    });

            function showPopBar(d) {
                $(this).popover({
                    title: d.name,
                    placement: 'auto top',
                    container: 'body',
                    trigger: 'manual',
                    html: true,
                    content: function () {
                        return "Total: " + d3.format(",")(d.value ? d.value : d.y1 - d.y0);
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

var chart = $("#costSaleChart"),
    aspect = chart.width() / chart.height(),
    container = chart.parent();
$(window).on("resize", function() {
    var targetWidth = container.width();
    chart.attr("width", targetWidth);
    chart.attr("height", Math.round(targetWidth / aspect));
}).trigger("resize");
