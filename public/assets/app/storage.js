angular.module('ms-storage', [])

.factory('storage', function () {
  return {
    get: function (identifier) {
      return JSON.parse(localStorage.getItem(identifier)) || undefined;
    },
    save: function (identifier, data) {
      return localStorage.setItem(identifier, JSON.stringify(data));
    }
  };
});