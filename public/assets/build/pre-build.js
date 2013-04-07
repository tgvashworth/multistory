angular.module('dropbox', []).factory('Dropbox', [
  '$rootScope',
  '$location',
  function ($rootScope, $location) {
    var client = new Dropbox.Client({ key: 'FGaYi1AdNxA=|ooVqJg/bZ06ETSKUK8FWlQ9vT9dKEdomuRRDFjqRtw==' });
    client.authDriver(new Dropbox.Drivers.Redirect({ rememberUser: true }));
    var doneAuth = function (error, client) {
      $rootScope.$apply(function () {
        if (error)
          return $rootScope.$broadcast('dropbox:auth:error', error);
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
          client.readFile(path, cb);
        }
      };
    return api;
  }
]).filter('fileType', function () {
  return function (array) {
    return array.filter(function (element) {
      return element.isFolder ? true : !!element.name.match(/\.(txt|md)/);
    });
  };
}).directive('dropboxBrowser', [
  'Dropbox',
  '$filter',
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
        scope.path = {
          dir: function () {
            return ('/' + scope.path.stack.join('/')).replace(/\/{2,}/, '/');
          },
          file: function () {
            if (!scope.path.fileName)
              return;
            return '/' + scope.path.stack.concat(scope.path.fileName).join('/');
          },
          fileName: '',
          stack: [],
          entries: []
        };
        scope.$watch('open', function (newValue) {
          if (!!newValue) {
            scope.loadStack();
          }
        });
        scope.loadStack = function () {
          scope.path.entries = [{ name: 'Loading...' }];
          Dropbox.dir(scope.path.dir(), function (err, entries) {
            scope.$apply(function () {
              if (err) {
                return scope.path.entries = [{ name: 'Error.' }];
              }
              scope.path.entries = $filter('fileType')(angular.copy(entries));
            });
          });
        };
        scope.openFolder = function (name) {
          scope.path.stack.push(name);
          scope.loadStack();
        };
        scope.back = function () {
          scope.path.stack.pop();
          scope.loadStack();
        };
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
  }
]);
;angular.module('ms-filters', []).filter('toArray', function () {
  return function (obj) {
    return Object.keys(obj).map(function (key) {
      obj[key].$key = key;
      return obj[key];
    });
  };
}).filter('extract', function () {
  return function (array, key) {
    return array.map(function (element) {
      return element[key];
    }).filter(function (element) {
      return !!element;
    });
  };
}).filter('storyOrder', function () {
  var lookup = {
      'icebox': 100,
      'backlog': 90,
      'next sprint': 85,
      'in progress': 80,
      'in testing': 60,
      'done': 40
    };
  return function (array) {
    return array.sort(function (a, b) {
      var aVal = lookup[a.$key.toLowerCase().trim()] || 1000, bVal = lookup[b.$key.toLowerCase().trim()] || 1000;
      return aVal - bVal;
    });
  };
}).filter('removeEmpty', function () {
  return function (array) {
    if (!array)
      return array;
    return array.filter(function (subArray) {
      if (!subArray)
        return subArray;
      return !!subArray.length;
    });
  };
}).filter('distinct', function () {
  return function (array) {
    var lookup = {};
    return array.filter(function (element) {
      return lookup[element] ? false : lookup[element] = true;
    });
  };
}).filter('fileType', function () {
  return function (array) {
    return array.filter(function (element) {
      return element.isFolder ? true : !!element.name.match(/\.(txt|md)/);
    });
  };
}).filter('capitalize', function () {
  return function (text) {
    return text.replace(/\b([a-z0-9]{2,}|i)\b/gi, function (match) {
      return match.substr(0, 1).toUpperCase() + match.substr(1);
    });
  };
});
;angular.module('multistory', [
  'ms-filters',
  'ms-storage',
  'ms-parse',
  'dropbox'
]).config([
  '$locationProvider',
  '$routeProvider',
  function ($locationProvider, $routeProvider) {
    var authResolver = function (Dropbox) {
      return Dropbox.client.isAuthenticated();
    };
    $routeProvider.when('/auth/dropbox', {
      controller: 'AuthCtrl',
      templateUrl: '/template/auth.html'
    }).when('/pick', {
      resolve: { isAuthenticated: authResolver },
      controller: 'PickCtrl',
      templateUrl: '/template/pick.html'
    }).when('/view', {
      resolve: { isAuthenticated: authResolver },
      controller: 'ViewCtrl',
      templateUrl: '/template/view.html'
    }).otherwise({
      controller: 'LandingCtrl',
      templateUrl: '/template/landing.html'
    });
    $locationProvider.html5Mode(true);
  }
]).factory('forceLogin', [
  '$location',
  function ($location) {
    return function (next) {
      next = next || $location.url();
      return $location.path('/auth/dropbox').search({ next: next }).replace();
    };
  }
]).controller('LandingCtrl', [
  '$scope',
  '$location',
  'storage',
  function ($scope, $location, storage) {
    if (storage.get('auth')) {
      $location.path('/auth/dropbox').replace();
    }
  }
]).controller('AuthCtrl', [
  '$scope',
  '$rootScope',
  '$location',
  'storage',
  'Dropbox',
  function ($scope, $rootScope, $location, storage, Dropbox) {
    $scope.msg = 'Logging you in...';
    if ($location.search().next) {
      storage.save('auth:next', $location.search().next);
    }
    $rootScope.$on('dropbox:auth:success', function () {
      var next = storage.get('auth:next'), url = '/pick';
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
  }
]).controller('PickCtrl', [
  '$scope',
  '$filter',
  '$location',
  'storage',
  'Dropbox',
  'isAuthenticated',
  'forceLogin',
  function ($scope, $filter, $location, storage, Dropbox, isAuthenticated, forceLogin) {
    if (!isAuthenticated) {
      return forceLogin();
    }
    $scope.open = true;
    $scope.loadFile = function (file) {
      console.log(file);
      $location.path('/view').search({ file: file.path });
    };
  }
]).controller('ViewCtrl', [
  '$scope',
  '$filter',
  '$location',
  '$timeout',
  'storage',
  'Dropbox',
  'parse',
  'isAuthenticated',
  'forceLogin',
  function ($scope, $filter, $location, $timeout, storage, Dropbox, parse, isAuthenticated, forceLogin) {
    if (!isAuthenticated) {
      return forceLogin();
    }
    $scope.sections = [];
    $scope.view = {
      file: $location.search().file,
      raw: false,
      highlight: true,
      subitems: true,
      autoupdate: true,
      segments: [
        'who',
        'what',
        'why'
      ],
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
    $scope.load = function () {
      if (!$scope.view.autoupdate)
        return;
      $scope.view.reloading = true;
      Dropbox.file($scope.view.file, function (err, data) {
        $scope.$apply(function () {
          var sections = parse(data);
          $scope.sections = sections.map(function (stories) {
            stories.show = !!stories.length;
            return stories;
          });
          $scope.view.reloading = false;
        });
      });
    };
    $timeout(function reload() {
      $scope.load();
      $timeout(reload, 10000);
    }, 10000);
    $scope.load();
  }
]);angular.module('ms-parse', []).factory('parseClean', function () {
  return function (text) {
    text = text || '';
    return text.trim().toLowerCase();
  };
}).factory('parseRegex', function () {
  return /([A-Z\s'\(\)\&]+)[A-Za-z\s.,!']([A-Z\s'\(\)\&]+)[A-Za-z\s.,!']([A-Z\s'\(\)\&]+)/g;
}).factory('parseSubitem', function () {
  return function (line) {
    line = line.trim().replace(/^-/, '');
    var text = line.split(/\s?[#@]\w+\s?/g), entities = line.match(/[#@]\w+/g), segments = [];
    while (text.length) {
      segments.push(text.shift());
      if (entities && entities.length) {
        segments.push(entities.shift());
      }
    }
    segments = segments.filter(function (seg) {
      return !!seg;
    }).map(function (seg) {
      var obj = {
          hashtag: false,
          mention: false,
          text: false,
          raw: seg
        };
      if (seg.match(/#\w+/)) {
        obj.hashtag = true;
      } else if (seg.match(/@\w+/)) {
        obj.mention = true;
      } else {
        obj.text = true;
      }
      return obj;
    });
    segments.original = line;
    return segments;
  };
}).factory('parse', [
  'parseClean',
  'parseRegex',
  'parseSubitem',
  '$filter',
  function (parseClean, parseRegex, parseSubitem, $filter) {
    return function (raw) {
      raw = raw || '';
      var lines = raw.split('\n'), sections = [], groups = {}, groupname = 'icebox', lastStory = {};
      lines.forEach(function (line, index) {
        var cleanedSizes = [];
        if (line.match('---')) {
          groupname = parseClean(lines[index - 1]);
        } else if (line.match(/^#+\s/)) {
          groupname = parseClean(line);
        }
        if (!groups[groupname]) {
          groups[groupname] = [];
          groups[groupname].$key = $filter('capitalize')(groupname);
          sections.push(groups[groupname]);
        }
        if (line.match(/^\s+/)) {
          var subitem = parseSubitem(line);
          return lastStory.subitems.push(subitem);
        }
        line = line.trim().replace(/^-/, '');
        var res = line.match(parseRegex), sizes = line.match(/\[.+?\]/g);
        if (!res)
          return;
        if (sizes) {
          cleanedSizes = sizes.map(function (segment) {
            return segment.replace('[', '').replace(']', '');
          });
        }
        var cleaned = res.map(function (segment, index) {
            var str = (segment || '').replace(',', '').replace(/as a/i, '').trim();
            if (index === 0)
              str = str.replace(/ i/i, '');
            return parseClean(str);
          });
        cleaned = cleaned.slice(0, 2).concat(cleaned.slice(2).join(' '));
        lastStory = {
          who: cleaned[0],
          what: cleaned[1],
          why: cleaned[2],
          sizes: cleanedSizes,
          raw: line,
          subitems: []
        };
        groups[groupname].push(lastStory);
      });
      return sections;
    };
  }
]);
;angular.module('ms-storage', []).factory('storage', function () {
  return {
    get: function (identifier) {
      var result = localStorage.getItem(identifier);
      try {
        result = JSON.parse(result);
      } catch (e) {
      }
      return result || undefined;
    },
    save: function (identifier, data) {
      if (angular.isObject(data)) {
        data = JSON.stringify(data);
      }
      return localStorage.setItem(identifier, data);
    },
    rm: function (identifier) {
      return localStorage.removeItem(identifier);
    }
  };
});