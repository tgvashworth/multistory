angular.module('dropbox', [])

.factory('Dropbox', function ($rootScope, $location) {

  var client = new Dropbox.Client({
      key: "FGaYi1AdNxA=|ooVqJg/bZ06ETSKUK8FWlQ9vT9dKEdomuRRDFjqRtw=="
  });

  client.authDriver(new Dropbox.Drivers.Redirect({
    rememberUser: true
  }));

  var doneAuth = function (error, client) {
    $rootScope.$apply(function () {
      if (error) return $rootScope.$broadcast('dropbox:error', error);

      api.client = client;
      $rootScope.$broadcast('dropbox:success', client);
    });
  };

  if ($location.search()._dropboxjs_scope) {
    client.authenticate(doneAuth);
  }

  var api = {
    client: client,
    authenticate: function () {
      client.authenticate(doneAuth);
    },
    dir: function (path, cb) {
      client.readdir(path, function (err, entryList, e, entries) {
        return cb(err, entries);
      });
    },
    file: function (path, cb) {
      client.readFile(path, cb);
    }
  };

  return api;

})

.filter('fileType', function () {
  return function (array) {
    return array.filter(function (element) {
      return element.isFolder ? true : !!element.name.match(/\.(txt|md)/);
    });
  };
})

.directive('dropboxBrowser', function (Dropbox) {
  return {
    restrict: 'A',
    templateUrl: '/template/dropboxBrowser.html',
    transclude: true,
    scope: {
      file: '=',
      fileChange: '&?',
      open: '=?'
    },
    link: function (scope, element, attrs) {

      console.log.apply(console, [].slice.call(arguments));

      scope.$watch('file', function (newValue) {
        if (attrs.fileChange) {
          attrs.fileChange.apply(null, [].slice.call(arguments));
        }
      });

      scope.$watch('open', function (newValue) {
        if (!!newValue) {
          scope.loadStack();
        }
      });

      scope.path = {
        current: function () {
          return ('/' + scope.path.stack.join('/')).replace(/\/+/, '/');
        },
        stack: [],
        entries: []
      };

      scope.loadStack = function () {
        scope.path.entries = [{name: 'Loading...'}];
        Dropbox.dir(scope.path.current(), function (err, entries) {
          scope.$apply(function () {
            if (err) { return scope.path.entries = [{name: 'Error.'}]; }
            scope.dropbox.entries = $filter('fileType')(angular.copy(entries));
          });
        });
      };

      scope.openFolder = function (name) {
        scope.path.stack.push(name);
        scope.loadStack();
      };

      scope.openFile = function (name) {
        var stack = angular.copy(scope.path.stack),
            path;
        stack.push(name);
        path = '/' + stack.join('/');
        Dropbox.file(path, function (err, data) {
          scope.$apply(function () {
            if (err) { return scope.path.entries = [{name: 'Error.'}]; }
            scope.file = data;
          });
        });
      };

      scope.back = function () {
        scope.path.stack.pop();
        scope.loadStack();
      };

    }
  };
})

;