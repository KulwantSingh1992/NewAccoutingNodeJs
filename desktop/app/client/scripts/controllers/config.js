'use strict';

/**
 * @ngdoc function
 * @name paxcomTerminalApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the paxcomTerminalApp
 */
angular.module('paxcomTerminalApp').controller('ConfigCtrl', function ($scope, $http, growl, sessionService, configService) {
    $scope.main = {};
    $scope.settingDetail = {};
    $scope.wForm = {};
    $scope.wForm.index = 1;
    $scope.currentFormId = '';
    $scope.submit = '';
    $scope.formName ={};

    init();

    function init() {
        $scope.main = sessionService.getMain();
        $scope.settingDetail = configService.getConfig();
    };

    $scope.deactivateSetting = function (formName) {
        var channel = formName.substring(0, formName.indexOf('-')).toUpperCase();
        var data = {};
        var setting = {};
        setting[channel] = JSON.stringify($scope.settingDetail[channel].settingDetails);
        data.data = setting;
        data.active = false;
        
        var msgConfig = {ttl: 6000};
        configService.submitSetting(data, function () {
            $('.'+ formName + '-deactivate').show();
            growl.addSuccessMessage('Deactivated channel successfully', msgConfig);
            $('.'+ formName + '-deactivate').hide();
            $scope.main.dashboard = 'dashboard';
            console.log('.'+ formName + '-deactivate');
        }, function (errMsg) {
            console.error(errMsg);
            growl.addErrorMessage(errMsg, msgConfig);
            $('.'+ formName + '-deactivate').hide();
        });
    }

   

    $scope.submitSetting = function (formName, submitSettingSuccessCallback) {
		if(formName == 'wizard'){
			clientSideValidation(formName, function (isValid, forms) {
				if (isValid) {
					var data = {};
					var channel;
					forms.map(function (index, form) {
						var formId = $(form).attr('id');
						$scope.currentFormId = formId;
						channel = formId.substring(0, formId.indexOf('-'));
						var formData = $(form).serializeArray();
						var setting = {};
						formData.map(function (config) {
							setting[config.name] = config.value;
						});
						data[channel] = JSON.stringify(setting);
                        $('.'+ $scope.currentFormId + '-submit').show();
					});
                    serverSideValidationAndSubmit(data, channel, submitSettingSuccessCallback);
                    //$scope.wForm.index = $scope.wForm.index + 1
				}
			});
		}
        else{
			if($("input:radio[name="+ formName + "-status]:checked").val() == 1 )
            {
				clientSideValidation(formName, function (isValid, forms, formName) {
					if (isValid) {
						var data = {};
						var channel;
						forms.map(function (index, form) {
							var formId = $(form).attr('id');
							$scope.currentFormId = formId;
							//console.log($scope.currentFormId);
							$('.'+ $scope.currentFormId + '-submit').show();
							channel = formId.substring(0, formId.indexOf('-'));
							var formData = $(form).serializeArray();
							var setting = {};
							formData.map(function (config) {
                                if(config.name != formName+'-status'){
                                    setting[config.name] = config.value;
                                }
							});
							data[channel] = JSON.stringify(setting);
						});
                        serverSideValidationAndSubmit(data, channel, submitSettingSuccessCallback);
                        if(formName == 'wizard'){
                            $scope.wForm.index = $scope.wForm.index + 1
                        }else{
                        $scope.main.dashboard = 'dashboard';
                            
                        }
					}
					
				});
			}else if($("input:radio[name="+ formName + "-status]:checked").val() == 0 ){
				$scope.deactivateSetting(formName);
			}	
		
	}	
    };
    
    var serverSideValidationAndSubmit = function(data, channel, submitSettingSuccessCallback, formName) {
        console.log(data);
        var active = true;
        var msgConfig = {
            ttl: 6000
        };
        configService.validateSetting(data, function (validateResponse, formName) {
            console.log(validateResponse);
            $('.'+ $scope.currentFormId + '-submit').show();
            if(validateResponse.result) {
                if(!$.isEmptyObject(validateResponse.data)) {
                    var setting = JSON.parse(data[channel]);
                    var extra = JSON.parse(validateResponse.data);
                    for(var key in extra) {setting[key] = extra[key]}
                    data[channel] = JSON.stringify(setting)
                }
                
                var req = {
                    data: data,
                    active: active
                };

                configService.submitSetting(req, function (msg) {
                    $('.'+ $scope.currentFormId + '-submit').show();
                    growl.addSuccessMessage(msg, msgConfig);
                    $('.'+ $scope.currentFormId + '-submit').hide();
                    if(submitSettingSuccessCallback)  submitSettingSuccessCallback();
                    $http.post('/setting/load').success(function(response) {
                        $scope.settingDetail = configService.getConfig();
                        configService.setConfig(response.configData);
                        
                        
                    });
                }, function (errMsg) {
                    console.error(errMsg);
                    growl.addErrorMessage(errMsg, msgConfig);
                    $('.'+ $scope.currentFormId + '-submit').hide();
                });
            } else {
                growl.addErrorMessage(validateResponse.msg, msgConfig);
                $('.'+ $scope.currentFormId + '-submit').hide();
            }
        }, function (errMsg) {
            console.error(errMsg);
            growl.addErrorMessage(errMsg, msgConfig);
            $('.'+ $scope.currentFormId + '-submit').hide();
        });
    }

    $scope.submitAndNext = function () {
        $scope.submitSetting('wizard', function () {
            $scope.wForm.index = $scope.wForm.index + 1
        });
    }

    $scope.submitSettingAndFinish = function () {
        $scope.submitSetting('wizard', function () {
            $scope.main.dashboard = 'dashboard';
        });
    }

    var clientSideValidation = function (formName, cb) {
        var isValid = false;

        if (formName === 'wizard') {
            formName = $('form').attr('id');
        }
        if (formName == 'FK-setting-form') {
            isValid = flipkartFormValidate();
        }
        if (formName == 'AMAZON-setting-form') {
            isValid = amazonFormValidate();
        }
        if (formName == 'TALLY-setting-form') {
            isValid = tallyFormValidate();
        }
        if (formName == 'OTHER-setting-form') {
            isValid = otherPageValidate();
        }
        if (formName == 'SD-setting-form') {
            isValid = sdPageValidate();
        }
        if (formName == 'PTM-setting-form') {
            isValid = ptmPageValidate();
        }
        var forms = $('#' + formName);
        cb(isValid, forms);
    }

    var flipkartFormValidate = function () {
        var valid = true;
        var p1 = $('#flipkart-password');
        var p2 = $('#flipkart-confirm-password');
        var userName = $("#UserName");
        if (!userName.val()) {
            valid = false;
            userName.css('border', '1px solid red');
        } else {
            userName.css("border-color", "#ccc");
        }

        if (p1.val() != p2.val() || p1.val() == '' || p2.val() == '') {
            valid = false;
            p1.css('border', '1px solid red');
            p2.css('border', '1px solid red');
        } else {
            p1.css("border-color", "#ccc");
            p2.css("border-color", "#ccc");
        }

        if (valid) {
            userName.css("border-color", "#ccc");
        }
        return valid;
    }

    var amazonFormValidate = function () {
        var valid = true;

        if (($("#SellerIDAmaz").val()).match(/\s/g) || (!$("#SellerIDAmaz").val()) ) {
            valid = false;
            $('#SellerIDAmaz').css({
                'border': '1px solid red'
            });
        } else {
            $("#SellerIDAmaz").css("border-color", "#ccc");
        }
        if (($("#MarketplaceID").val()).match(/\s/g) || (!$("#MarketplaceID").val()) ) {
            valid = false;
            $('#MarketplaceID').css({
                'border': '1px solid red'
            });
        } else {
            $("#MarketplaceID").css("border-color", "#ccc");
        }
        if (($("#AWSAccessKeyID").val()).match(/\s/g) || (!$("#AWSAccessKeyID").val()) ) {
            valid = false;
            $('#AWSAccessKeyID').css({
                'border': '1px solid red'
            });
        } else {
            $("#AWSAccessKeyID").css("border-color", "#ccc");
        }
        if (($("#SecretKey").val()).match(/\s/g) || (!$("#SecretKey").val()) ) {
            valid = false;
            $('#SecretKey').css({
                'border': '1px solid red'
            });
        } else {
            $("#SecretKey").css("border-color", "#ccc");
        }

        if (valid) {
            $('input').addClass('valid-input');
        }
        return valid;
    }

    var tallyFormValidate = function () {
        var valid = true;

        if (($("#URL").val()).match(/\s/g) || (!$("#URL").val()) ) {
            valid = false;
            $('#URL').css({
                'border': '1px solid red'
            });
        } else {
            $("#URL").css("border-color", "#ccc");
        }
        if (!$('#CompanyName').val()) {
            valid = false;
            $('#CompanyName').css({
                'border': '1px solid red'
            });
        } else {
            $("#CompanyName").css("border-color", "#ccc");
        }
        if (valid) {
            $('input').addClass('valid-input');
        }
        return valid;
    }

    var otherPageValidate = function () {
        var valid = true;

       if (($("#fname").val()).match(/\s/g) || (!$("#fname").val()) ) {
            valid = false;
            $('#fname').css({
                'border': '1px solid red'
            });
        } else {
            $("#fname").css("border-color", "#ccc");
        }
       if (($("#lname").val()).match(/\s/g) || (!$("#lname").val()) ) {
            valid = false;
            $('#lname').css({
                'border': '1px solid red'
            });
        } else {
            $("#lname").css("border-color", "#ccc");
        }
        if (jQuery('#email').val() == '') {
            valid = false;
            jQuery('#email').css({
                'border': '1px solid red'
            });
        } else if (!ValidateEmail(jQuery("#email").val())) {
            valid = false;
            jQuery('#email').css({
                'border': '1px solid red'
            });
        } else {
            jQuery('#email').css({
                'border': '1px solid #ccc'
            });
        }
        if (valid) {
            $('input').addClass('valid-input');
        }
        return valid;
    }

    var validateSettingPage = function () {
        var valid = true;

        if (($("#fname").val()).match(/\s/g) || (!$("#fname").val()) ) {
            valid = false;
            $('#fname').css({
                'border': '1px solid red'
            });
        } else {
            $("#fname").css("border-color", "#ccc");
        }
        if (($("#lname").val()).match(/\s/g) || (!$("#lname").val()) ) {
            valid = false;
            $('#lname').css({
                'border': '1px solid red'
            });
        } else {
            $("#lname").css("border-color", "#ccc");
        }
        if (($("#email").val()).match(/\s/g) || (!$("#email").val()) ){
            valid = false;
            $('#email').css({
                'border': '1px solid red'
            });
        } else {
            $("#email").css("border-color", "#ccc");
        }
        if (!valid) {
            return false;
        } else {
            $('#fname').css({
                'border': '1px solid #ccc'
            });
            $('#lname').css({
                'border': '1px solid #ccc'
            });
            $('#email').css({
                'border': '1px solid #ccc'
            });
            $scope.submitSetting('all');
        }
    }

    var sdPageValidate = function () {
        var valid = true;

       if (($("#sduserName").val()).match(/\s/g) || (!$("#sduserName").val()) ) {
            valid = false;
            $('#sduserName').css({
                'border': '1px solid red'
            });
        } else {
            $("#sduserName").css("border-color", "#ccc");
        }
       if (($("#password").val()).match(/\s/g) || (!$("#password").val()) ) {
            valid = false;
            $('#password').css({
                'border': '1px solid red'
            });
        } else {
            $("#password").css("border-color", "#ccc");
        }
        if (valid) {
            $('input').addClass('valid-input');
        }
        return valid;
    }

    var ptmPageValidate = function () {
        var valid = true;

        if (($("#ptmmerchantId").val()).match(/\s/g) || (!$("#ptmmerchantId").val()) ) {
            valid = false;
            $('#ptmmerchantId').css({
                'border': '1px solid red'
            });
        } else {
            $("#ptmmerchantId").css("border-color", "#ccc");
        }
       if (($("#ptmClientId").val()).match(/\s/g) || (!$("#ptmClientId").val()) ) {
            valid = false;
            $('#ptmClientId').css({
                'border': '1px solid red'
            });
        } else {
            $("#ptmClientId").css("border-color", "#ccc");
        }
       if (($("#ptmclientSecret").val()).match(/\s/g) || (!$("#ptmclientSecret").val()) ) {
            valid = false;
            $('#ptmclientSecret').css({
                'border': '1px solid red'
            });
        } else {
            $("#ptmclientSecret").css("border-color", "#ccc");
        }
       if (($("#ptmusername").val()).match(/\s/g) || (!$("#ptmusername").val()) ) {
            valid = false;
            $('#ptmusername').css({
                'border': '1px solid red'
            });
        } else {
            $("#ptmusername").css("border-color", "#ccc");
        }
        if (($("#ptmPassword").val()).match(/\s/g) || (!$("#ptmPassword").val()) ) {
            valid = false;
            $('#ptmPassword').css({
                'border': '1px solid red'
            });
        } else {
            $("#ptmPassword").css("border-color", "#ccc");
        }

        if (valid) {
            $('input').addClass('valid-input');
        }
        return valid;

    }
});

function ValidateEmail(email) {
    var expr = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
    return expr.test(email);
  }