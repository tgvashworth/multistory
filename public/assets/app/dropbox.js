angular.module('dropbox', [])

.factory('dropbox', function ($rootScope, $location) {

  var client = new Dropbox.Client({
      key: "FGaYi1AdNxA=|ooVqJg/bZ06ETSKUK8FWlQ9vT9dKEdomuRRDFjqRtw==",
      sandbox: true
  });

  client.authDriver(new Dropbox.Drivers.Redirect());

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
    }
  };

  return api;

});