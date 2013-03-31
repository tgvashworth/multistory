angular.module('multistory', ['ms-filters', 'ms-storage', 'dropbox'])

.config(function ($locationProvider, $routeProvider) {
  $routeProvider
    .otherwise({
      templateUrl: '/template/panels.html'
    });

  $locationProvider.html5Mode(true);
})

.controller('MultistoryCtrl', function ($scope, $filter, $location, storage, dropbox) {

  // ==================================
  // Authentication
  // ==================================

  // Trigger auth
  $scope.auth = function () {
    dropbox.authenticate();
  };

  // ==================================
  // Dropbox
  // ==================================

  $scope.$on('dropbox:success', function (e, client) {
    if ($scope.authenticated) return;
    $location
      .search({})
      .replace();
    $scope.authenticated = true;
    $scope.loadStack();
  });

  $scope.$on('dropbox:error', function (e, client) {
    $scope.authenticated = false;
  });

  // ==================================
  // Files
  // ==================================

  $scope.dropbox = {
    entries: [],
    open: true
  };
  $scope.path = {
    current: '/',
    stack: []
  };

  $scope.loadStack = function () {
    $scope.entries = [{name: 'Loading...'}];
    $scope.path.current = '/' + $scope.path.stack.join('/');
    dropbox.dir($scope.path.current, function (err, entries) {
      $scope.$apply(function () {
        $scope.dropbox.entries = $filter('fileType')(angular.copy(entries));
        storage.save('entries', $scope.dropbox.entries);
      });
    });
  };

  $scope.openFolder = function (name) {
    $scope.path.stack.push(name);
    $scope.loadStack();
  };

  $scope.openFile = function (name) {
    var stack = angular.copy($scope.path.stack),
        path;
    stack.push(name);
    path = '/' + stack.join('/');
    dropbox.file(path, function (err, data) {
      $scope.$apply(function () {
        $scope.file.raw = data;
        $scope.dropbox.open = false;
      });
    });
  };

  $scope.back = function () {
    $scope.path.stack.pop();
    $scope.loadStack();
  };

  // ==================================
  // Editor
  // ==================================

  $scope.file = {
    raw: 'Paste your user stories here, or open a file by signing in with Dropbox.',
    groups: []
  };

  $scope.$watch('file.raw', function () {
    $scope.parse();
    $scope.groupsArray = $filter('storyOrder')(
                           $filter('toArray')(
                             $scope.file.groups
                           )
                         );
    var actors = [];
    $scope.groupsArray.forEach(function (stories) {
      actors = actors.concat(stories.map(function (story) {
        return story.who;
      }));
    });
    $scope.actors = $filter('distinct')(actors);
  });

  $scope.parse = function () {
    var lines = $scope.file.raw.split('\n'),
        groupname = 'icebox';

    $scope.file.groups = {};

    lines.forEach(function (line, index) {

      var cleanedSizes = [];

      if (line.match('---')) {
        groupname = lines[index - 1].trim().toLowerCase();
      }
      if (!$scope.file.groups[groupname]) $scope.file.groups[groupname] = [];

      var res = line.match(/([A-Z\s'\(\)]+)[A-Za-z\s.,!']([A-Z\s'\(\)]+)[A-Za-z\s.,!']([A-Z\s'\(\)]+)/g),
          size = line.match(/\[.+\]/g);


      if (!res) return;

      if (size) {
        cleanedSizes = size.map(function (segment) {
          return segment
                  .replace('[', '')
                  .replace(']', '');
        });
      }

      var cleaned = res.map(function (segment, index) {
        var str = (segment || '')
                    .replace(',', '')
                    .replace(/as a/i, '')
                    .trim();
        if (index === 0) str = str.replace(/ i/i, '').trim();
        return str.toLowerCase();
      });

      cleaned = cleaned.slice(0,2).concat(cleaned.slice(2).join(' '));

      var story = _.object(['who', 'what', 'why'], cleaned);

      story.sizes = cleanedSizes;

      $scope
        .file
        .groups[groupname]
        .push(story);

    });

    storage.save('file', $scope.file);
  };

  $scope.searchFor = function (actor) {
    $scope.search = actor.trim();
  };

});