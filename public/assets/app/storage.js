angular.module('ms-storage', [])

.factory('storage', function () {
  return {
    get: function (identifier) {
      var result = localStorage.getItem(identifier);
      try {
        result = JSON.parse(result);
      } catch(e) {}
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