angular.module('multistory', ['ms-filters', 'ms-storage', 'dropbox'])

.config(function ($locationProvider, $routeProvider) {

  var authResolver = function (Dropbox) {
    return Dropbox.client.isAuthenticated();
  };

  $routeProvider

    .when('/auth/dropbox', {
      controller: 'AuthCtrl',
      template: 'Logging you in...'
    })

    .when('/auth/dropbox/error', {
      template: 'Login error. Damn.'
    })

    .when('/pick', {
      resolve: {
        isAuthenticated: authResolver
      },
      controller: 'PickCtrl',
      templateUrl: '/template/pick.html'
    })

    .when('/view', {
      resolve: {
        isAuthenticated: authResolver
      },
      controller: 'ViewCtrl',
      templateUrl: '/template/view.html'
    })

    .otherwise({
      templateUrl: '/template/landing.html'
    });

  $locationProvider.html5Mode(true);
})

// ==================================
// Authenticaton
// ==================================

.controller('AuthCtrl', function ($rootScope, $location, Dropbox) {
  $rootScope.$on('dropbox:auth:success', function () {
    console.log(Dropbox.client);
    $location.path('/pick');
  });

  $rootScope.$on('dropbox:auth:error', function () {
    console.log(Dropbox.client);
    $location.path('/auth/dropbox/error');
  });

  Dropbox.authenticate();
})

// ==================================
// Initial file picker
// ==================================

.controller('PickCtrl', function ($scope, $filter, $location, storage, Dropbox, isAuthenticated) {
  if (!isAuthenticated) { return $location.path('/'); }

  $scope.open = true;
  $scope.loadFile = function (file) {
    $location.path('/view').search({ path: file.path });
  };
})

// ==================================
// Story viewer
// ==================================

.controller('ViewCtrl', function ($scope, $filter, $location, storage, Dropbox) {
  if (!isAuthenticated) { return $location.path('/'); }



});