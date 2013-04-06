angular.module('multistory', ['ms-filters', 'ms-storage', 'dropbox'])

.config(function ($locationProvider, $routeProvider) {
  $routeProvider
    .otherwise({
      templateUrl: '/template/landing.html'
    });

  $locationProvider.html5Mode(true);
})

.controller('MultistoryCtrl', function ($scope, $filter, $location, storage, Dropbox) {

  // ==================================
  // Authentication
  // ==================================

  // Trigger auth
  // $scope.auth = function () {
  //   dropbox.authenticate();
  // };

  // ==================================
  // Dropbox
  // ==================================

  // $scope.$on('dropbox:success', function (e, client) {
  //   if ($scope.authenticated) return;
  //   $location
  //     .search({})
  //     .replace();
  //   $scope.authenticated = true;
  //   $scope.loadStack();
  // });

  // $scope.$on('dropbox:error', function (e, client) {
  //   $scope.authenticated = false;
  // });

});