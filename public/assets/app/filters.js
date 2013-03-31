angular.module('ms-filters', [])

.filter('toArray', function () {
  return function (obj) {
    return Object.keys(obj).map(function (key) {
      obj[key].$key = key;
      return obj[key];
    });
  };
})

.filter('extract', function () {
  return function (array, key) {
    return array.map(function (element) {
      return element[key];
    }).filter(function (element) {
      return !!element;
    });
  };
})

.filter('storyOrder', function () {
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

      var aVal = lookup[a.$key.toLowerCase().trim()] || 1000,
          bVal = lookup[b.$key.toLowerCase().trim()] || 1000;
      return aVal - bVal;
    });
  };
})

.filter('removeEmpty', function () {
  return function (array) {
    return array.filter(function (subArray) {
      return !!subArray.length;
    });
  };
})

.filter('distinct', function () {
  return function (array) {
    var lookup = {};
    return array.filter(function (element) {
      return lookup[element] ? false : lookup[element] = true;
    });
  };
})

.filter('fileType', function () {
  return function (array) {
    return array.filter(function (element) {
      return element.isFolder ? true : !!element.name.match(/\.(txt|md)/);
    });
  };
});