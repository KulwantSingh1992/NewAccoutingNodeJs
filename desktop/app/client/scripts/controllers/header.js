'use strict';

/**
 * @ngdoc function
 * @name paxcomTerminalApp.controller:HeaderCtrl
 * @description
 * # HeaderCtrl
 * Controller of the paxcomTerminalApp
 */
angular.module('paxcomTerminalApp').controller('HeaderCtrl', function ($scope, $http, growl,configService) {
    $scope.isChecked = false;
    var mask = document.createElement("div"),
        items = $('.menu.slide-menu-left li'),
        activeNav;
    mask.className = "mask";

    /* slide menu left */
    $scope.toggleSlideLeft = function () {
        $('body').addClass("sml-open");
        document.body.appendChild(mask);
        activeNav = "sml-open";
        $('#slideMenu').show();
    };

    /* hide active menu if mask is clicked */
    mask.addEventListener("mouseover", function () {
        hideSlideMenu();
    });

    /* hide active menu if mask is clicked */
    mask.addEventListener("mouseover", function () {
        hideSlideMenu();
    });

    function hideSlideMenu() {
        $('body').removeClass(activeNav);
        activeNav = "";
        document.body.removeChild(mask);
    }

    $scope.getOrderDetails = function () {
        $http.post('/getDetails').success(function (res) {});
    }

    $scope.sendFeedback = function () {
        var isSend = false;
        var body = {
            ischecked: $scope.isChecked,
            text: $("#FeedbackTextArea").val()
        }

        isSend = isValidate();

        if (isSend) {
            $('#feedbackLoaderImg').show();
            $http.post('/sendFeedback', body).success(function (res) {
                if (res) {
                    $('#feedbackLoaderImg').hide();
                    growl.addErrorMessage('Feedback cannot be send');
                } else {
                    $('#feedbackLoaderImg').hide();
                    $("#FeedbackTextArea").val('');
                    $scope.isChecked = false;
                    growl.addSuccessMessage('Feedback is submit successfully');
                }
            });
        }
    }

    function isValidate() {
        var isValid = false;
        if (!$("#FeedbackTextArea").val()) {
            $("#FeedbackTextArea").css({
                'border': '1px solid red'
            });
            isValid = false;
        } else {
            $("#FeedbackTextArea").css({
                'border-color': '#ccc'
            });;
            isValid = true;
        }

        return isValid;
    }

     $scope.checkRadioButtonStatus = function() {
        var activeChannelConfig = configService.getConfig();
        for (var channel in activeChannelConfig) {
            if (activeChannelConfig[channel].is_active == 0) {
                $("[name='" + channel + "-setting-form-status']").val([0]);
            }else{
                $("[name='" + channel + "-setting-form-status']").val([1]);
            }
        }
    }
})