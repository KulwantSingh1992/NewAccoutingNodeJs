'use strict';

/**
 * @ngdoc function
 * @name paxcomTerminalApp.controller:topProductChartCtrl
 * @description
 * # topProductChartCtrl
 * Controller of the paxcomTerminalApp
 */
angular.module('paxcomTerminalApp').controller('topProductChartCtrl', function ($scope, desktopService) {

    $scope.selectedGraphId = '';
    $scope.optionSet = angular.copy(desktopService.getOptionSet());

    var mostProductCB = function (start, end, label) {
        $scope.optionSet.startDate = start;
        $scope.optionSet.endDate = end;
        $('.mostProductRange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        $scope.sellingProduct('bigTopProductChart');
    }
    var mostCancelCB = function (start, end, label) {
        $scope.optionSet.startDate = start;
        $scope.optionSet.endDate = end;
        $('.mostCancelRange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        $scope.mostCancel('bigMostCancelProductChart');
    }

    $scope.graphData = {
        topProductChart: {
            width: 300,
            height: 145
        },
        bigTopProductChart: {
            width: 600,
            height: 400,
            datePickerClass: 'mostProductRange',
            cb: mostProductCB,
            count: 0
        },
        mostCancelProductChart: {
            width: 300,
            height: 145
        },
        bigMostCancelProductChart: {
            width: 600,
            height: 400,
            datePickerClass: 'mostCancelRange',
            cb: mostCancelCB,
            count: 0
        }
    };

    $scope.initDatePicker = function (graphDataForCurrent) {
        if (graphDataForCurrent.datePickerClass) {
            if (graphDataForCurrent.count != 1) {
                $('.' + graphDataForCurrent.datePickerClass + ' span').html(moment().subtract(30, 'days').format('MMMM D, YYYY') + ' - ' + moment().format('MMMM D, YYYY'));
            }
            $('.' + graphDataForCurrent.datePickerClass).daterangepicker($scope.optionSet, graphDataForCurrent.cb);
            graphDataForCurrent.count = 1;
        }
    }

    $scope.sellingProduct = function (graphId) {
        if(graphId != 'topProductChart'){
           $('#topOrderChartModal').modal('show');
        }
        $scope.selectedGraphId = graphId;
        var graphDataForCurrent = $scope.graphData[graphId];
        $scope.initDatePicker(graphDataForCurrent);
        $('.calendar').hide();
        $('.range_inputs').hide();
        $('.ranges ul li:last-child').hide();
        setTimeout(function () {
            var width = graphDataForCurrent.width,
                height = graphDataForCurrent.height,
                radius = Math.min(width, height) / 2;
            var modalRadius = radius - 50;

            if (graphId == 'topProductChart')
                var arc = d3.svg.arc().outerRadius(radius).innerRadius(radius / 1.5);
            else
                var arc = d3.svg.arc().outerRadius(radius * 1.01).innerRadius(radius * 1.01 - 75);

            var arc0 = d3.svg.arc().outerRadius(radius / 1.57).innerRadius(radius / 1.62);
            var arc2 = d3.svg.arc().outerRadius(radius * 1.07).innerRadius((radius / 1.5));

            var arcmodal = d3.svg.arc().outerRadius(modalRadius * .9).innerRadius(modalRadius * 0.65);
            var arcmodal2 = d3.svg.arc().outerRadius(modalRadius * .98).innerRadius(modalRadius * 0.65);
            var arcmodal0 = d3.svg.arc().outerRadius(modalRadius * .63).innerRadius(modalRadius * 0.61);

            var pie = d3.layout.pie().sort(null).value(function (d) {
                return d.total_quantity;
            });

            $('#' + graphId).html('');

            var svg = d3.select("#" + graphId).append("svg")
                .attr("width", width)
                .attr("height", height + 15)
                .append("g")
                .attr("transform", "translate(" + (parseInt(height / 2) + 50) + "," + (parseInt(height / 2) + 10) + ")");

            var color = d3.scale.ordinal().range(["#FF8000", "#00CC00", "#DC143C", "#6495ED", "#DAA520"]);

            if (graphId == 'topProductChart') {
                svg.append("svg:text").attr("class", "smallTopProductCenterText").attr("dy", "-0.96em").attr("text-anchor", "middle").text("Top 5").attr({'font-size':'10px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
                svg.append("svg:text").attr("class", "smallTopProductCenterText").attr("dy", ".27em").attr("text-anchor", "middle").text("Selling").attr({'font-size':'10px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
                svg.append("svg:text").attr("class", "smallTopProductCenterText").attr("dy", "1.6em").attr("text-anchor", "middle").text("Products").attr({'font-size':'10px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
            } else {
                svg.append("svg:text").attr("class", "bigTopProductCenterText").attr("dy", "-0.96em").attr("text-anchor", "middle").text("Top 5").attr({'font-size':'30px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
                svg.append("svg:text").attr("class", "bigTopProductCenterText").attr("dy", ".27em").attr("text-anchor", "middle").text("Selling").attr({'font-size':'30px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
                svg.append("svg:text").attr("class", "bigTopProductCenterText").attr("dy", "1.6em").attr("text-anchor", "middle").text("Products").attr({'font-size':'30px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
            }

            d3.text('/topSellingProducts')
                .header("Content-Type", "application/json")
                .post(
                    JSON.stringify({
                        startDate: new Date($scope.optionSet.startDate).getTime(),
                        endDate: new Date($scope.optionSet.endDate).getTime()
                    }),
                    function (err, data) {
                        data = JSON.parse(data);
                        if (data.length > 0) {
                            var ageNames = data.map(function (item) {
                                return item.order_item
                            });

                            var g = svg.selectAll(".arc")
                                .data(pie(data))
                                .enter().append("g")
                                .attr("class", "arc")
                                .on("mouseover", function (d) {
                                    showPopDonut.call(this, d);
                                })
                                .on("mouseout", function (d) {
                                    removePopovers();
                                });

                            if (graphId == 'topProductChart') {

                                g.append("path")
                                    .attr("d", arc)
                                    .attr("id", "arcslice")
                                    .attr('stroke', 'none')
                                    .attr('stroke-width', '4')
                                    .style("fill", function (d) {
                                        return color(d.data.order_item);
                                    })
                                    .on("mouseenter", function (d) {
                                        d3.selectAll('#arcslice').transition().duration(200).attr("d", arc);
                                        d3.select(this).transition().duration(200).attr("d", arc2);
                                        d3.selectAll('#arcnewslice').style('display', 'block');
                                    })
                                    .on('mouseout', function (d) {
                                        d3.selectAll('#arcnewslice').style('display', 'none');
                                        d3.selectAll('#arcslice').transition().duration(200).attr("d", arc);
                                    });

                                g.append("path")
                                    .attr("d", arc)
                                    .attr("id", "arcnewslice")
                                    .style("fill", function (d) {
                                        return color(d.data.order_item);
                                    })
                                    .on("mouseenter", function (d) {
                                        d3.selectAll('#arcnewslice').transition().duration(200).attr("d", arc);
                                        d3.select(this).transition().duration(200).attr("d", arc0);
                                    });

                                g.append("text")
                                    .attr("transform", function (d) {
                                        return "translate(" + arc.centroid(d) + ")";
                                    })
                                    .attr("dy", ".35em")
                                    .style("text-anchor", "middle")
                                    .text(function (d) {
                                        return d.data.total_quantity;
                                    });

                                var legend = svg.selectAll(".legend").data(ageNames.slice().reverse()).enter().append("g").attr("class", "legend")
                                    .attr("transform", function (d, i) {
                                        var y = i * 20 - 60;
                                        return "translate(-200," + y + ")";
                                    });
                                legend.append("rect").attr("x", width - 10).attr("width", 10).attr("height", 10).style("fill", color);
                                legend.append("text").attr("x", width - 12).attr("y", 6).attr("dx", "1.7em").attr("dy", ".32em").style("text-anchor", "start").attr({'font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'})
                                    .text(function (d) {
                                        return (d.length > 24 ? (d.substring(0, 25) + '...') : d);
                                    });

                            } else {

                                g.append("path")
                                    .attr("d", arcmodal)
                                    .attr("id", "arcslicemodal")
                                    .attr('stroke', 'none')
                                    .attr('stroke-width', '4')
                                    .style("fill", function (d) {
                                        return color(d.data.order_item);
                                    })
                                    .on("mouseenter", function (d) {
                                        d3.selectAll('#arcslicemodal').transition().duration(200).attr("d", arcmodal);
                                        d3.select(this).transition().duration(200).attr("d", arcmodal2);
                                        d3.selectAll('#arcnewslicemodal').style('display', 'block');
                                    })
                                    .on('mouseout', function (d) {
                                        d3.selectAll('#arcnewslicemodal').style('display', 'none');
                                        d3.selectAll('#arcslicemodal').transition().duration(200).attr("d", arcmodal);
                                    });

                                g.append("path")
                                    .attr("d", arcmodal)
                                    .attr("id", "arcnewslicemodal")
                                    .style("fill", function (d) {
                                        return color(d.data.order_item);
                                    })
                                    .on("mouseenter", function (d) {
                                        d3.selectAll('#arcnewslicemodal').transition().duration(200).attr("d", arcmodal);
                                        d3.select(this).transition().duration(200).attr("d", arcmodal0);
                                    });

                                g.append("text")
                                    .attr("transform", function (d) {
                                        return "translate(" + arcmodal.centroid(d) + ")";
                                    })
                                    .attr("dy", ".35em")
                                    .style("font-size", "25px")
                                    .style("text-anchor", "middle")
                                    .text(function (d) {
                                        return d.data.total_quantity;
                                    });

                                var legend = svg.selectAll(".legend").data(ageNames.slice().reverse()).enter().append("g").attr("class", "legend")
                                    .attr("transform", function (d, i) {
                                        var y = (i * 30) - 100;
                                        return "translate(-400," + y + ")";
                                    });
                                legend.append("rect").attr("x", width - 25).attr("width", 25).attr("height", 25).style("fill", color);
                                legend.append("text").attr("x", width - 24).attr("y", 12).attr("dx", "2.8em").attr("dy", ".52em").style("font-size", "12px").style("text-anchor", "start").attr({'font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'})
                                    .text(function (d) {
                                        return (d.length > 24 ? (d.substring(0, 25) + '...') : d);
                                    });

                            }

                        } else {
                            var data = [{
                                order_item: "No Data",
                                total_quantity: 1
}];
                            var ageNames = data.map(function (item) {
                                return item.order_item
                            });
                            var g = svg.selectAll(".arc")
                                .data(pie(data))
                                .enter().append("g")
                                .attr("class", "arc")
                                .style('stroke', 'black')
                                .style('stroke-width', .5);

                            if (graphId == 'topProductChart') {

                                g.append("path")
                                    .attr("d", arc)
                                    .style("fill", function (d) {
                                        return "#ffffff";
                                    });
                            } else {
                                g.append("path")
                                    .attr("d", arcmodal)
                                    .style("fill", function (d) {
                                        return "#ffffff";
                                    });
                            }
                        }

                        function showPopDonut(d) {
                            $(this).popover({
                                title: '',
                                placement: 'auto top',
                                container: 'body',
                                trigger: 'manual',
                                html: true,
                                content: function () {
                                    return "Product: " + d.data.order_item + "<br/>Quantity: " + d.value;
                                }
                            });
                            $(this).popover('show')
                        }

                        function removePopovers() {
                            $('.popover').each(function () {
                                $(this).remove();
                            });
                        }
                    });
        }, 100);
    }

    $scope.mostCancel = function (graphId) {
        if(graphId != 'mostCancelProductChart'){
           $('#mostCancelChartModal').modal('show');
        }
        $scope.selectedGraphId = graphId;
        var graphDataForCurrent = $scope.graphData[graphId];
        $scope.initDatePicker(graphDataForCurrent);
        $('.calendar').hide();
        $('.range_inputs').hide();
        $('.ranges ul li:last-child').hide();
        setTimeout(function () {
            var width = graphDataForCurrent.width,
                height = graphDataForCurrent.height,
                radius = Math.min(width, height) / 2;
            var modalRadius = radius - 50;

            if (graphId == 'mostCancelProductChart')
                var arc = d3.svg.arc().outerRadius(radius).innerRadius(radius / 1.5);
            else
                var arc = d3.svg.arc().outerRadius(radius).innerRadius(radius - 80);

            var arc0 = d3.svg.arc().outerRadius(radius / 1.57).innerRadius(radius / 1.62);
            var arc2 = d3.svg.arc().outerRadius(radius * 1.07).innerRadius((radius / 1.5));

            /*var arcmodal = d3.svg.arc().outerRadius(radius*.9).innerRadius(radius*0.65);
            var arcmodal2 = d3.svg.arc().outerRadius(radius*.98).innerRadius(radius*0.65);
            var arcmodal0 = d3.svg.arc().outerRadius(radius*.63).innerRadius(radius*0.61);*/

            var arcmodal = d3.svg.arc().outerRadius(modalRadius * .9).innerRadius(modalRadius * 0.65);
            var arcmodal2 = d3.svg.arc().outerRadius(modalRadius * .98).innerRadius(modalRadius * 0.65);
            var arcmodal0 = d3.svg.arc().outerRadius(modalRadius * .63).innerRadius(modalRadius * 0.61);

            var pie = d3.layout.pie().sort(null).value(function (d) {
                return d.total_quantity;
            });

            $('#' + graphId).html('');

            var svg = d3.select("#" + graphId).append("svg")
                .attr("width", width)
                .attr("height", height + 15)
                .append("g")
                .attr("transform", "translate(" + (parseInt(height / 2) + 50) + "," + (parseInt(height / 2) + 10) + ")");

            //var color = d3.scale.ordinal().range(["#6495ED", "#DAA520", "#00CC00", "#FF8000", "#DC143C"]);

            var color = d3.scale.ordinal().range(["#FF8000", "#00CC00", "#DC143C", "#6495ED", "#DAA520"]);

            if (graphId == 'mostCancelProductChart') {
                svg.append("svg:text").attr("class", "smallMostCancelCenterText").attr("dy", "-0.96em").attr("text-anchor", "middle").text("Most").attr({'font-size':'10px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
                svg.append("svg:text").attr("class", "smallMostCancelCenterText").attr("dy", ".27em").attr("text-anchor", "middle").text("Cancelled").attr({'font-size':'10px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
                svg.append("svg:text").attr("class", "smallMostCancelCenterText").attr("dy", "1.6em").attr("text-anchor", "middle").text("Products").attr({'font-size':'10px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
            } else {
                svg.append("svg:text").attr("class", "bigMostCancelCenterText").attr("dy", "-0.96em").attr("text-anchor", "middle").text("Most").attr({'font-size':'30px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
                svg.append("svg:text").attr("class", "bigMostCancelCenterText").attr("dy", ".27em").attr("text-anchor", "middle").text("Cancelled").attr({'font-size':'30px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
                svg.append("svg:text").attr("class", "bigMostCancelCenterText").attr("dy", "1.6em").attr("text-anchor", "middle").text("Products").attr({'font-size':'30px','font-weight':'bold','font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'});
            }

            d3.text('/mostCancelledProducts')
                .header("Content-Type", "application/json")
                .post(
                    JSON.stringify({
                        startDate: new Date($scope.optionSet.startDate).getTime(),
                        endDate: new Date($scope.optionSet.endDate).getTime()
                    }),
                    function (err, data) {
                        data = JSON.parse(data);
                        if (data.length > 0) {
                            var ageNames = data.map(function (item) {
                                return item.order_item
                            });

                            var g = svg.selectAll(".arc")
                                .data(pie(data))
                                .enter().append("g")
                                .attr("class", "arcCancel")
                                .on("mouseover", function (d) {
                                    showPopDonut.call(this, d);
                                })
                                .on("mouseout", function (d) {
                                    removePopovers();
                                });


                            if (graphId == 'mostCancelProductChart') {

                                g.append("path")
                                    .attr("d", arc)
                                    .attr("id", "arcsliceCancel")
                                    .attr('stroke', 'none')
                                    .attr('stroke-width', '4')
                                    .style("fill", function (d) {
                                        return color(d.data.order_item);
                                    })
                                    .on("mouseenter", function (d) {
                                        d3.selectAll('#arcsliceCancel').transition().duration(200).attr("d", arc);
                                        d3.select(this).transition().duration(200).attr("d", arc2);
                                        d3.selectAll('#arcnewsliceCancel').style('display', 'block');
                                    })
                                    .on('mouseout', function (d) {
                                        d3.selectAll('#arcnewsliceCancel').style('display', 'none');
                                        d3.selectAll('#arcsliceCancel').transition().duration(200).attr("d", arc);
                                    });

                                g.append("path")
                                    .attr("d", arc)
                                    .attr("id", "arcnewsliceCancel")
                                    .style("fill", function (d) {
                                        return color(d.data.order_item);
                                    })
                                    .on("mouseenter", function (d) {
                                        d3.selectAll('#arcnewsliceCancel').transition().duration(200).attr("d", arc);
                                        d3.select(this).transition().duration(200).attr("d", arc0);
                                    });

                                g.append("text")
                                    .attr("transform", function (d) {
                                        return "translate(" + arc.centroid(d) + ")";
                                    })
                                    .attr("dy", ".35em")
                                    .style("text-anchor", "middle")
                                    .text(function (d) {
                                        return d.data.total_quantity;
                                    });
                                var legend = svg.selectAll(".legend").data(ageNames.slice().reverse()).enter().append("g").attr("class", "legend")
                                    .attr("transform", function (d, i) {
                                        var y = i * 20 - 60;
                                        return "translate(-200," + y + ")";
                                    });
                                legend.append("rect").attr("x", width - 10).attr("width", 10).attr("height", 10).style("fill", color);
                                legend.append("text").attr("x", width - 12).attr("y", 6).attr("dx", "1.7em").attr("dy", ".32em").style("text-anchor", "start").attr({'font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'})
                                    .text(function (d) {
                                        return (d.length > 24 ? (d.substring(0, 25) + '...') : d);
                                    });
                            } else {
                                
                                 g.append("path")
                                    .attr("d", arcmodal)
                                    .attr("id", "arcslicemodalCancel")
                                    .attr('stroke', 'none')
                                    .attr('stroke-width', '4')
                                    .style("fill", function (d) {
                                        return color(d.data.order_item);
                                    })                                   
                                .on("mouseenter", function (d) {
                                        d3.selectAll('#arcslicemodalCancel').transition().duration(200).attr("d", arcmodal);
                                        d3.select(this).transition().duration(200).attr("d", arcmodal2);
                                        d3.selectAll('#arcnewslicemodalCancel').style('display', 'block');
                                    })
                                    .on('mouseout', function (d) {
                                        d3.selectAll('#arcnewslicemodalCancel').style('display', 'none');
                                        d3.selectAll('#arcslicemodalCancel').transition().duration(200).attr("d", arcmodal);
                                    });

                                
                                g.append("path")
                                    .attr("d", arcmodal)
                                    .attr("id", "arcnewslicemodalCancel")
                                    .style("fill", function (d) {
                                        return color(d.data.order_item);
                                    })
                                .on("mouseenter", function (d) {
                                        d3.selectAll('#arcnewslicemodalCancel').transition().duration(200).attr("d", arcmodal);
                                        d3.select(this).transition().duration(200).attr("d", arcmodal0);
                                    });
                                
                                g.append("text")
                                    .attr("transform", function (d) {
                                        return "translate(" + arcmodal.centroid(d) + ")";
                                    })
                                    .attr("dy", ".35em")
                                    .style("font-size", "25px")
                                    .style("text-anchor", "middle")
                                    .text(function (d) {
                                        return d.data.total_quantity;
                                    });
                                var legend = svg.selectAll(".legend").data(ageNames.slice().reverse()).enter().append("g").attr("class", "legend")
                                    .attr("transform", function (d, i) {
                                        var y = (i * 30) - 100;
                                        return "translate(-400," + y + ")";
                                    });
                                legend.append("rect").attr("x", width - 25).attr("width", 25).attr("height", 25).style("fill", color);
                                legend.append("text").attr("x", width - 24).attr("y", 12).attr("dx", "2.8em").attr("dy", ".52em").style("font-size", "12px").style("text-anchor", "start").attr({'font-family':'sans-serif','stroke':'none','stroke-width':'0','fill':'#666'})
                                    .text(function (d) {
                                        return (d.length > 24 ? (d.substring(0, 25) + '...') : d);
                                    });
                            }
                        } else {
                            var data = [{
                                order_item: "No Data",
                                total_quantity: 1
}];
                            var ageNames = data.map(function (item) {
                                return item.order_item
                            });
                            var g = svg.selectAll(".arc")
                                .data(pie(data))
                                .enter().append("g")
                                .attr("class", "arcCancel")
                                .style('stroke', 'black')
                                .style('stroke-width', .5);

                            if (graphId == 'mostCancelProductChart') {
                                g.append("path")
                                    .attr("d", arc)
                                    .style("fill", function (d) {
                                        return "#ffffff";
                                    });
                            } else {
                                g.append("path")
                                    .attr("d", arcmodal)
                                    .style("fill", function (d) {
                                        return "#ffffff";
                                    });
                            }
                        }

                        function showPopDonut(d) {
                            $(this).popover({
                                title: '',
                                placement: 'auto top',
                                container: 'body',
                                trigger: 'manual',
                                html: true,
                                content: function () {
                                    return "Product: " + d.data.order_item + "<br/>Cancelled Order: " + d.value;
                                }
                            });
                            $(this).popover('show')
                        }

                        function removePopovers() {
                            $('.popover').each(function () {
                                $(this).remove();
                            });
                        }
                    });
        }, 100);
    }

    $scope.notSoldProducts = function () {
        var salesData = [];
        var timeFrame = {
            startDate: moment().subtract(7, 'day').valueOf(),
            endDate: moment.valueOf()
        };
        desktopService.notSoldProducts(timeFrame).$promise.then(function (products) {
            $scope.salesData = products;
        });
    }

});