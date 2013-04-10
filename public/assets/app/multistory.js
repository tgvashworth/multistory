angular.module('multistory', ['ms-filters', 'ms-storage', 'ms-parse', 'dropbox'])

.config([
  '$locationProvider', '$routeProvider',
function ($locationProvider, $routeProvider) {

  var authResolver = function (Dropbox) {
    return Dropbox.client.isAuthenticated();
  };

  $routeProvider

    .when('/auth/dropbox', {
      controller: 'AuthCtrl',
      templateUrl: '/template/auth.html'
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
      controller: 'LandingCtrl',
      templateUrl: '/template/landing.html'
    });

  $locationProvider.html5Mode(true);
}])

.factory('forceLogin', [
  '$location',
function ($location) {
  return function (next) {
    next = next || $location.url();
    return $location
             .path('/auth/dropbox')
             .search({
               next: next
             })
             .replace();
  };
}])

// ==================================
// Landing
// ==================================

.controller('LandingCtrl', [
  '$scope', '$location', 'storage',
function ($scope, $location, storage) {
  if (storage.get('auth')) {
    $location.path('/auth/dropbox').replace();
  }
}])

// ==================================
// Authenticaton
// ==================================

.controller('AuthCtrl', [
  '$scope', '$rootScope', '$location',
  'storage', 'Dropbox',
function ($scope, $rootScope, $location, storage, Dropbox) {
  $scope.msg = 'Logging you in...';

  if ($location.search().next) {
    storage.save('auth:next', $location.search().next);
  }

  $rootScope.$on('dropbox:auth:success', function () {
    var next = storage.get('auth:next'),
        url = '/pick';
    storage.rm('auth:next');
    if (next) {
      url = next;
      return $location.url(next);
    }
    $location.path(url);
  });

  $rootScope.$on('dropbox:auth:error', function () {
    console.log(Dropbox.client);
    $location.path('/');
  });

  Dropbox.authenticate();
}])

// ==================================
// Initial file picker
// ==================================

.controller('PickCtrl', [
  '$scope', '$filter', '$location',
  'storage', 'Dropbox', 'isAuthenticated', 'forceLogin',
function ($scope, $filter, $location, storage, Dropbox, isAuthenticated, forceLogin) {
  if (!isAuthenticated) { return forceLogin(); }

  $scope.open = true;
  $scope.loadFile = function (file) {
    console.log(file);
    $location.path('/view').search({ file: file.path });
  };
}])

// ==================================
// Story viewer
// ==================================

.controller('ViewCtrl', [
  '$scope', '$filter', '$location', '$timeout',
  'storage', 'Dropbox', 'parse', 'isAuthenticated', 'forceLogin',
function ($scope, $filter, $location, $timeout,
          storage, Dropbox, parse, isAuthenticated, forceLogin) {

  if (!isAuthenticated) { return forceLogin(); }

  $scope.sections = [];
  $scope.view = {
    file: $location.search().file,
    raw: false,
    highlight: true,
    subitems: true,
    autoupdate: true,
    segments: ['who', 'what', 'why'],
    show: {
      who: true,
      what: true,
      why: true,
      unsized: false
    }
  };

  $scope.searchFor = function (text) {
    $scope.search = text;
  };

  // ==================================
  // Load the file from search
  // ==================================
  $scope.load = function () {
    if (!$scope.view.autoupdate) return;
    Dropbox.file($scope.view.file, function (err, data) {
      // Alert the error, or get out if nothing was returned
      if (err) return alert(err);
      if (!data) return;
      $scope.$apply(function () {
        // Indicate that things are reloading
        $scope.view.reloading = true;
        $timeout(function () {
          $scope.view.reloading = false;
        }, 500);
        // Parse the sections from the file data
        var sections = parse(data);
        $scope.sections = sections.map(function (stories) {
          // Maintain which sections are shown
          var matchingSections = $filter('filter')($scope.sections, { $key: stories.$key });
          if (matchingSections.length) {
            stories.show = matchingSections[0].show;
          } else {
            stories.show = !!stories.length;
          }
          return stories;
        });
      });
    });
  };

  $timeout(function reload(){
    $scope.load();
    $timeout(reload, 5000);
  }, 5000);

  $scope.load();

}]);