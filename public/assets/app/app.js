angular.module('multistory', ['ms-filters', 'ms-storage', 'ms-parse', 'dropbox'])

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
    console.log(file);
    $location.path('/view').search({ file: file.path });
  };
})

// ==================================
// Story viewer
// ==================================

.controller('ViewCtrl', function ($scope, $filter, $location, storage, Dropbox, parse, isAuthenticated) {
  if (!isAuthenticated) { return $location.path('/'); }

  $scope.sections = [];

  Dropbox.file($location.search().file, function (err, data) {
    console.log.apply(console, [].slice.call(arguments));

    $scope.$apply(function () {
      $scope.sections = parse(data);
    });
  });

});