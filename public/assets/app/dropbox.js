angular.module('dropbox', [])

.factory('Dropbox', [
  '$rootScope', '$location',
function ($rootScope, $location) {

  var client = new Dropbox.Client({
      key: "FGaYi1AdNxA=|ooVqJg/bZ06ETSKUK8FWlQ9vT9dKEdomuRRDFjqRtw=="
  });

  var fileRev = {};

  client.authDriver(new Dropbox.Drivers.Redirect({
    rememberUser: true
  }));

  var doneAuth = function (error, client) {
    $rootScope.$apply(function () {
      if (error) return $rootScope.$broadcast('dropbox:auth:error', error);

      api.client = client;
      $rootScope.$broadcast('dropbox:auth:success', client);
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
      // Check if the file has been modified before reloading it.
      client.stat(path, function (err, stat) {
        stat = stat.json();
        // Has the revision changed?
        if (fileRev[path] !== stat.rev) {
          // Yep, go get that badboy.
          client.readFile(path, function (err, data) {
            // Save the new revision
            if (!err && data) fileRev[path] = stat.rev;
            cb.apply(null, [].slice.call(arguments));
          });
        } else {
          // File not modified
          cb();
        }
      });
    }
  };

  return api;

}])

.filter('fileType', function () {
  return function (array) {
    return array.filter(function (element) {
      return element.isFolder ? true : !!element.name.match(/\.(txt|md)/);
    });
  };
})

.directive('dropboxBrowser', [
  'Dropbox', '$filter',
function (Dropbox, $filter) {
  return {
    restrict: 'A',
    templateUrl: '/template/dropboxBrowser.html',
    transclude: true,
    scope: {
      file: '=?',
      fileChange: '&?',
      open: '=?'
    },
    link: function (scope, element, attrs) {

      // ==================================
      // File browser models
      // ==================================
      scope.path = {
        dir: function () {
          return ('/' + scope.path.stack.join('/')).replace(/\/{2,}/, '/');
        },
        file: function () {
          if (!scope.path.fileName) return;
          return '/' + scope.path.stack.concat(scope.path.fileName).join('/');
        },
        fileName: '',
        stack: [],
        entries: []
      };

      // ==================================
      // Load the stack when opened
      // ==================================
      scope.$watch('open', function (newValue) {
        if (!!newValue) {
          scope.loadStack();
        }
      });

      // ==================================
      // Load the current directory stack
      // ==================================
      scope.loadStack = function () {
        scope.path.entries = [{name: 'Loading...'}];
        Dropbox.dir(scope.path.dir(), function (err, entries) {
          scope.$apply(function () {
            if (err) { return scope.path.entries = [{name: 'Error.'}]; }
            scope.path.entries = $filter('fileType')(angular.copy(entries));
          });
        });
      };

      // ==================================
      // Open the clicked folder
      // ==================================
      scope.openFolder = function (name) {
        scope.path.stack.push(name);
        scope.loadStack();
      };

      // ==================================
      // Navigate back (up) through the stack
      // ==================================
      scope.back = function () {
        scope.path.stack.pop();
        scope.loadStack();
      };

      // ==================================
      // Open the clicked file
      // ==================================
      scope.openFile = function (name) {
        scope.path.fileName = name;
        if (attrs.fileChange) {
          scope.fileChange({
            file: {
              dir: scope.path.dir(),
              path: scope.path.file()
            }
          });
        }
      };

    }
  };
}])

;