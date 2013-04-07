angular.module("dropbox",[]).factory("Dropbox",["$rootScope","$location",function($rootScope,$location){var client=new Dropbox.Client({key:"FGaYi1AdNxA=|ooVqJg/bZ06ETSKUK8FWlQ9vT9dKEdomuRRDFjqRtw=="});client.authDriver(new Dropbox.Drivers.Redirect({rememberUser:!0}));var doneAuth=function(error,client){$rootScope.$apply(function(){return error?$rootScope.$broadcast("dropbox:auth:error",error):(api.client=client,$rootScope.$broadcast("dropbox:auth:success",client),void 0)})};$location.search()._dropboxjs_scope&&client.authenticate(doneAuth);var api={client:client,authenticate:function(){client.authenticate(doneAuth)},dir:function(path,cb){client.readdir(path,function(err,entryList,e,entries){return cb(err,entries)})},file:function(path,cb){client.readFile(path,cb)}};return api}]).filter("fileType",function(){return function(array){return array.filter(function(element){return element.isFolder?!0:!!element.name.match(/\.(txt|md)/)})}}).directive("dropboxBrowser",["Dropbox","$filter",function(Dropbox,$filter){return{restrict:"A",templateUrl:"/template/dropboxBrowser.html",transclude:!0,scope:{file:"=?",fileChange:"&?",open:"=?"},link:function(scope,element,attrs){scope.path={dir:function(){return("/"+scope.path.stack.join("/")).replace(/\/{2,}/,"/")},file:function(){return scope.path.fileName?"/"+scope.path.stack.concat(scope.path.fileName).join("/"):void 0},fileName:"",stack:[],entries:[]},scope.$watch("open",function(newValue){newValue&&scope.loadStack()}),scope.loadStack=function(){scope.path.entries=[{name:"Loading..."}],Dropbox.dir(scope.path.dir(),function(err,entries){scope.$apply(function(){return err?scope.path.entries=[{name:"Error."}]:(scope.path.entries=$filter("fileType")(angular.copy(entries)),void 0)})})},scope.openFolder=function(name){scope.path.stack.push(name),scope.loadStack()},scope.back=function(){scope.path.stack.pop(),scope.loadStack()},scope.openFile=function(name){scope.path.fileName=name,attrs.fileChange&&scope.fileChange({file:{dir:scope.path.dir(),path:scope.path.file()}})}}}}]),angular.module("ms-filters",[]).filter("toArray",function(){return function(obj){return Object.keys(obj).map(function(key){return obj[key].$key=key,obj[key]})}}).filter("extract",function(){return function(array,key){return array.map(function(element){return element[key]}).filter(function(element){return!!element})}}).filter("storyOrder",function(){var lookup={icebox:100,backlog:90,"next sprint":85,"in progress":80,"in testing":60,done:40};return function(array){return array.sort(function(a,b){var aVal=lookup[a.$key.toLowerCase().trim()]||1e3,bVal=lookup[b.$key.toLowerCase().trim()]||1e3;return aVal-bVal})}}).filter("removeEmpty",function(){return function(array){return array?array.filter(function(subArray){return subArray?!!subArray.length:subArray}):array}}).filter("distinct",function(){return function(array){var lookup={};return array.filter(function(element){return lookup[element]?!1:lookup[element]=!0})}}).filter("fileType",function(){return function(array){return array.filter(function(element){return element.isFolder?!0:!!element.name.match(/\.(txt|md)/)})}}).filter("capitalize",function(){return function(text){return text.replace(/\b([a-z0-9]{2,}|i)\b/gi,function(match){return match.substr(0,1).toUpperCase()+match.substr(1)})}}),angular.module("multistory",["ms-filters","ms-storage","ms-parse","dropbox"]).config(["$locationProvider","$routeProvider",function($locationProvider,$routeProvider){var authResolver=function(Dropbox){return Dropbox.client.isAuthenticated()};$routeProvider.when("/auth/dropbox",{controller:"AuthCtrl",templateUrl:"/template/auth.html"}).when("/pick",{resolve:{isAuthenticated:authResolver},controller:"PickCtrl",templateUrl:"/template/pick.html"}).when("/view",{resolve:{isAuthenticated:authResolver},controller:"ViewCtrl",templateUrl:"/template/view.html"}).otherwise({controller:"LandingCtrl",templateUrl:"/template/landing.html"}),$locationProvider.html5Mode(!0)}]).factory("forceLogin",["$location",function($location){return function(next){return next=next||$location.url(),$location.path("/auth/dropbox").search({next:next}).replace()}}]).controller("LandingCtrl",["$scope","$location","storage",function($scope,$location,storage){storage.get("auth")&&$location.path("/auth/dropbox").replace()}]).controller("AuthCtrl",["$scope","$rootScope","$location","storage","Dropbox",function($scope,$rootScope,$location,storage,Dropbox){$scope.msg="Logging you in...",$location.search().next&&storage.save("auth:next",$location.search().next),$rootScope.$on("dropbox:auth:success",function(){var next=storage.get("auth:next"),url="/pick";return storage.rm("auth:next"),next?(url=next,$location.url(next)):($location.path(url),void 0)}),$rootScope.$on("dropbox:auth:error",function(){console.log(Dropbox.client),$location.path("/")}),Dropbox.authenticate()}]).controller("PickCtrl",["$scope","$filter","$location","storage","Dropbox","isAuthenticated","forceLogin",function($scope,$filter,$location,storage,Dropbox,isAuthenticated,forceLogin){return isAuthenticated?($scope.open=!0,$scope.loadFile=function(file){console.log(file),$location.path("/view").search({file:file.path})},void 0):forceLogin()}]).controller("ViewCtrl",["$scope","$filter","$location","$timeout","storage","Dropbox","parse","isAuthenticated","forceLogin",function($scope,$filter,$location,$timeout,storage,Dropbox,parse,isAuthenticated,forceLogin){return isAuthenticated?($scope.sections=[],$scope.view={file:$location.search().file,raw:!1,highlight:!0,subitems:!0,autoupdate:!0,segments:["who","what","why"],show:{who:!0,what:!0,why:!0,unsized:!1}},$scope.searchFor=function(text){$scope.search=text},$scope.load=function(){$scope.view.autoupdate&&($scope.view.reloading=!0,Dropbox.file($scope.view.file,function(err,data){$scope.$apply(function(){var sections=parse(data);$scope.sections=sections.map(function(stories){return stories.show=!!stories.length,stories}),$scope.view.reloading=!1})}))},$timeout(function reload(){$scope.load(),$timeout(reload,1e4)},1e4),$scope.load(),void 0):forceLogin()}]),angular.module("ms-parse",[]).factory("parseClean",function(){return function(text){return text=text||"",text.trim().toLowerCase()}}).factory("parseRegex",function(){return/([A-Z\s'\(\)\&]+)[A-Za-z\s.,!']([A-Z\s'\(\)\&]+)[A-Za-z\s.,!']([A-Z\s'\(\)\&]+)/g}).factory("parseSizeRegex",function(){return/\[.+?\]/g}).factory("parseSizes",function(){return function(sizes){return sizes.map(function(segment){return segment.replace("[","").replace("]","")})}}).factory("parseSubitem",["parseSizes","parseSizeRegex",function(parseSizes,parseSizeRegex){return function(originalLine){originalLine=originalLine.trim().replace(/^-/,"");for(var sizes=originalLine.match(parseSizeRegex),line=originalLine.replace(parseSizeRegex,""),text=line.split(/\s?[#@]\w+\s?/g),entities=line.match(/[#@]\w+/g),segments=[];text.length;)segments.push(text.shift()),entities&&entities.length&&segments.push(entities.shift());var subitem=segments.filter(function(seg){return!!seg}).map(function(seg){var obj={hashtag:!1,mention:!1,size:!1,text:!1,raw:seg};return seg.match(/#\w+/)?obj.hashtag=!0:seg.match(/@\w+/)?obj.mention=!0:obj.text=!0,obj});return sizes&&(subitem.sizes=parseSizes(sizes)),subitem.original=originalLine,subitem}}]).factory("parse",["parseClean","parseRegex","parseSubitem","$filter","parseSizes","parseSizeRegex",function(parseClean,parseRegex,parseSubitem,$filter,parseSizes,parseSizeRegex){return function(raw){raw=raw||"";var lines=raw.split("\n"),sections=[],groups={},groupname="icebox",lastStory={};return lines.forEach(function(line,index){var cleanedSizes=[];if(line.match("---")?groupname=parseClean(lines[index-1]):line.match(/^#+\s/)&&(groupname=parseClean(line)),groups[groupname]||(groups[groupname]=[],groups[groupname].$key=$filter("capitalize")(groupname),sections.push(groups[groupname])),line.match(/^\s+/)){var subitem=parseSubitem(line);return lastStory.subitems.push(subitem)}line=line.trim().replace(/^-/,"");var res=line.match(parseRegex),sizes=line.match(parseSizeRegex);if(res){sizes&&(cleanedSizes=parseSizes(sizes));var cleaned=res.map(function(segment,index){var str=(segment||"").replace(",","").replace(/as a/i,"").trim();return 0===index&&(str=str.replace(/ i/i,"")),parseClean(str)});cleaned=cleaned.slice(0,2).concat(cleaned.slice(2).join(" ")),lastStory={who:cleaned[0],what:cleaned[1],why:cleaned[2],sizes:cleanedSizes,raw:line,subitems:[]},groups[groupname].push(lastStory)}}),sections}}]),angular.module("ms-storage",[]).factory("storage",function(){return{get:function(identifier){var result=localStorage.getItem(identifier);try{result=JSON.parse(result)}catch(e){}return result||void 0},save:function(identifier,data){return angular.isObject(data)&&(data=JSON.stringify(data)),localStorage.setItem(identifier,data)},rm:function(identifier){return localStorage.removeItem(identifier)}}});