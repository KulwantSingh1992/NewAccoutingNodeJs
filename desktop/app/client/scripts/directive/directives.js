'use strict';

angular.module('paxcomTerminalApp').directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter, {
                        'event': event
                    });
                });
                event.preventDefault();
            }
        });
    };
}).directive('stPersist', function () {
        return {
            require: '^stTable',
            link: function (scope, element, attr, ctrl) {
                var nameSpace = attr.stPersist;

                //save the table state every time it changes
                scope.$watch(function () {
                    return ctrl.tableState();
                }, function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        localStorage.setItem(nameSpace, JSON.stringify(newValue));
                    }
                }, true);

                //fetch the table state when the directive is loaded
                if (localStorage.getItem(nameSpace)) {
                    var savedState = JSON.parse(localStorage.getItem(nameSpace));
                    var tableState = ctrl.tableState();

                    angular.extend(tableState, savedState);
                    ctrl.pipe();
                }
            }
        };
    });;