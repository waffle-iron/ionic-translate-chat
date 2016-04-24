/**
 * @author Hana Lee
 * @since 2016-04-23 21:06
 */
/*jslint
 browser  : true,
 continue : true,
 devel    : true,
 indent   : 2,
 maxerr   : 50,
 nomen    : true,
 plusplus : true,
 regexp   : true,
 vars     : true,
 white    : true,
 todo     : true,
 unparam  : true,
 node     : true
 */
/*global angular */
angular.module('translate-chat.account-controller', [])
  .controller('AccountCtrl', function ($scope, UserService) {
    'use strict';

    $scope.user = UserService.get();

    console.log('user information : ', $scope.user);

    $scope.settings = {
      enableFriends : true
    };
  });
