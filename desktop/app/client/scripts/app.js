'use strict';

/**
 * @ngdoc overview
 * @name paxcomTerminalApp
 * @description
 * # paxcomTerminalApp
 *
 * Main module of the application.
 */
angular.module('paxcomTerminalApp', [
    'ngAnimate',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngSanitize',
    'ngTouch',
    'ngDragDrop',
    'smart-table',
    'angular-growl',
    'ui.bootstrap',
    'ui.select'
]).config(function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|file|mailto|chrome-extension):/);
});

function camelCase(s) {
    return (s || '').toLowerCase().replace(/(\b|-|_)\w/g, function (m) {
        return m.toUpperCase().replace(/-|_/, '');
    });
}

function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}

function showLoader(){
    $('#loader').show();
}

function hideLoader(){
    $('#loader').hide();
}