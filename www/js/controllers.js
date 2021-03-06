angular.module('app.controllers', ['ngRoute','ionic', 'app.services', 'ngCordova', 'angularUUID2', 'ngStorage', 'ngInputModified'])

   // used to view JSONs that have already been created.
.controller('viewCtrl', function($scope, DynamicPage, ObjectCounter, $rootScope, $ionicHistory, $sce, $q, $ionicLoading, SaveNew, Camera, GPS,
                                 $ionicPlatform, Utility) {

	// get the JSON
	var related;


	$scope.document = false;
	$scope.service = false;
    $scope.images = 'ion-images';
    $scope.camera = "ion-android-camera";


	//http://stackoverflow.com/questions/4878756/javascript-how-to-capitalize-first-letter-of-each-word-like-a-2-word-city
	$scope.title = DynamicPage.getRoute().charAt(0).toUpperCase() + DynamicPage.getRoute().substr(1).toLowerCase() + 's';


	$scope.JSON = DynamicPage.getJSON();
	if ( angular.isDefined ($scope.JSON ['Photo'])){
		  $scope.imageData = $scope.JSON ['Photo'];
	}

	// loads the data into the page based on the title of the page
	switch ($scope.title){
		case 'Site Networks':
				$scope.service = true;
				$scope.JSON['Principal Investigator'] = JSON.stringify($scope.JSON['Principal Investigator']);
			break;

		case 'Sites':
                related = $scope.JSON['Network'];
				$scope.JSON ['Permit Holder'] = JSON.stringify($scope.JSON['Permit Holder']);
				$scope.JSON ['Land Owner'] = JSON.stringify($scope.JSON['Land Owner']);
			break;

		case 'Systems':
				//$scope.JSON['Manager'];
				related = $scope.JSON['Site'];
			break;

		case 'Deployments':
				related = $scope.JSON['System'];
			break;

		case 'Components':
				$scope.service = true;
				related = $scope.JSON['Deployment'];
			break;

		case 'Serviceentriess':
				$scope.service = true;
			break;

	}

    // save JSON button
	$scope.saveJSON = function (deletable){
        //pretty hacky
        //but we need to update mod dates with edit
        $scope.JSON["Modification Date"] = new Date();

        //store the photo in image data
        //handles case where image in imageData is base64
        if(angular.isDefined($scope.imageData) && Utility.IsHex($scope.imageData)){
            $scope.JSON["Photo"] = $scope.imageData;
        } else if( angular.isDefined($scope.imageData)) {
            $scope.JSON["Photo"] = Utility.baseSwap_64_to_16($scope.imageData);
        }

        if (!angular.isDefined (deletable) || deletable == false){
            var bool = false;
            if ($scope.title != "Service entriess"){
                for (var i = 0; i < $rootScope.editJSON[$scope.title].length; i ++){
                    if ($scope.JSON["Unique Identifier"] == $rootScope.editJSON[$scope.title][i]["Unique Identifier"]){
                         $rootScope.editJSON[$scope.title][i] = $scope.JSON;
                         bool = true;
                    }
                }
                if (bool == false)
                    SaveNew.save ($scope.title, false, $scope.JSON, $rootScope.editJSON[$scope.title], $scope.imageData, related);
             }
             else{
                for (var i = 0; i < $rootScope.editJSON["Service Entries"].length; i ++){
                    if ($scope.JSON["Unique Identifier"] == $rootScope.editJSON["Service Entries"][i]["Unique Identifier"]){
                         $rootScope.editJSON.ServiceEntries[i] = $scope.JSON;
                         bool = true;
                    }
                }
            if (bool == false)
                SaveNew.save ($scope.title, false, $scope.JSON, $rootScope.editJSON["Service Entries"], $scope.imageData, related);
             }
        }
        else{
            if ($scope.title != "Service entriess"){
                SaveNew.save ($scope.title, false, $scope.JSON, $rootScope.unsyncedJSON[$scope.title], $scope.imageData, related);
            }
            else{
               SaveNew.save ($scope.title, false, $scope.JSON, $rootScope.unsyncedJSON['Service Entries'], $scope.imageData, related);
            }
        }
	};



    //wrapper for the openGallery factory so we can call it from the choosePicture button.
    // in root scope so it can be called from all buttons
    $rootScope.choosePicture = function (){
        return $q (
            function (resolve, reject){
                    $ionicLoading.show({
                        templateUrl: 'templates/directive_templates/loading-spinner.html',
                        noBackdrop: true
                    })
                    Camera.checkPermissions();
                    Camera.openGallery()
                    .then(function (image){
                        $ionicLoading.hide();
                        $scope.imageData = image.result;
                        resolve(image.raw);
                    })
                    .catch(function(error){
                        $ionicLoading.hide();
                    });
            }
        )
    };

    //wrapper for the take image factory so we can call it from the takePhoto button
    // in root scope so it can be called from all buttons
    $rootScope.takePicture = function (){
         return $q(
            function (resolve, reject){
                Camera.checkPermissions();
                Camera.openCamera()
                .then($ionicLoading.show({
                    templateUrl: 'templates/directive_templates/loading-spinner.html',
                    noBackdrop: false
                }))
                .then(function (image){
                    $ionicLoading.hide();
                    $scope.imageData =  image.result;
                    resolve(image.raw);
                })
                .catch(function(error){
                        $ionicLoading.hide();
                });
            });

    };

})

.controller('LoginController', function($ionicModal, $scope, $rootScope, $q, $location, Login){
    $rootScope.modalHidden = true;
    $scope.modal = null;


    //$scope.loginJSON = {};
    //$rootScope.associatedNetworks = {};

    var initialize = function (){
        $scope.loginJSON = {};
        $rootScope.associatedNetworks = {};
        $rootScope.loggedIn = false;
    }



    //open a modal for viewing
    //creates a new modal if one has not been instantiated
    //elsewise opens the old modal
    $scope.openModal = function() {

        //clear variable on modal open and that's it
        initialize();

        $rootScope.modalHidden = false;
        // If a modal is not
        // already instantiated in this scope
        if($scope.modal == null){
            $ionicModal.fromTemplateUrl('templates/login.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then( function(modal) {
                $scope.modal = modal;
                $scope.modal.show();
            })

        }
        else {
           $scope.modal.show();
        }
    };

    //close Modal
    $scope.closeModal = function() {
        $scope.modal.remove().then (function (){
                $scope.modal = null;
        });
    };

    //destroy modal to prevent memory leaks
    $scope.destroyModal = function() {
        return $q(function (resolve, reject){
        	$rootScope.modalHidden = true;
        	$scope.modal.remove().then (function (){
                $scope.modal = null;
                resolve();
        	});
        })

    };

     $scope.resolveLogin = function(){
        return $q(function(resolve, reject){
                resolve();
            });
     }


    $scope.login = function (){

       var promise = $q (function (resolve, reject){
        	Login.adminLogin ($scope.loginJSON).then (function Success (response){
        		$rootScope.associatedNetworks = response;
            	$rootScope.loggedIn = true;
            	$scope.loginJSON ['Username'] = null;
        		$scope.loginJSON ['Password'] = null;
                $scope.closeModal();
        	}, function Failure (error){
            	$rootScope.associatedNetworks = error;
            	$rootScope.loggedIn = false;
        		$scope.loginJSON ['Password'] = null;
        	});

      	})

    }
})

 // controller for the main menu
.controller('mainMenuCtrl', function($scope, $rootScope, $q, $window, sync, Login, $http, $ionicModal, DynamicPage, ObjectCounter,
                                     File, $cordovaFile, $cordovaNetwork, $ionicLoading, $stateParams, $timeout, $ionicPlatform) {



    function onDeviceReady() {
		$rootScope.platform = device.platform;
	}

    DynamicPage.setTitle ("Networks");



    // posting JSONs
	$rootScope.editJSON = {People:[], "Site Networks":[], Sites:[], Systems:[], Deployments:[], Components:[], Documents: [], "Service Entries": [] };
	$rootScope.unsyncedJSON = {People:[], "Site Networks":[], Sites:[], Systems:[], Deployments:[], Components:[], Documents: [], "Service Entries": [] };

    //levels for tiered traversal of
    //lists
    $rootScope.listLevel = 0;
    $rootScope.itemLevel = 0;


	// URL list
	$rootScope.baseURL = "http://sensor.nevada.edu/services/QAEdge/Edge.svc/ProtoNRDC/";
	$rootScope.urlPaths = ["people", "networks", "sites", "systems", "deployments", "components", "documents","ServiceEntries"];
    var parent = ["Unique Identifier", "Site Network", "Site", "System", "Deployment"];


	// check for main directory
	File.createDirectory();



    /**************************************
     Does some fanciness for randomizing
     and displaying data on app title screen
    ****************************************/

    $scope.randomTimingOffset = [];
    $scope.progressiveTimingOffset = [];

    //randomizes the appearance of tile buttons on main page
    $scope.setRndTimingOffsets = function(){

        for( tile = 0; tile < 10; tile++ ){
            $scope.randomTimingOffset[tile] = {};
            $scope.randomTimingOffset[tile]["-webkit-animation-delay"] = (Math.random()/2) + 's';
            $scope.randomTimingOffset[tile]["animation-delay"] = $scope.randomTimingOffset[tile]["-webkit-animation-delay"];
        }
    }

    $scope.setProgressiveTimingOffsets = function(){

        for( tile = 0; tile < 10; tile++ ){
            $scope.progressiveTimingOffset[tile] = {};
            $scope.progressiveTimingOffset[tile]["-webkit-animation-delay"] = (tile * .1) + 's';
            $scope.progressiveTimingOffset[tile]["animation-delay"] = $scope.progressiveTimingOffset[tile]["-webkit-animation-delay"];
        }
    }


    $scope.setRandomBackground = function(){
        rand = Math.floor((Math.random() * 100) % 7);
        $scope.randomBackground = {};
        $scope.randomBackground["background-image"] = "url(img/bg" + rand + '.jpg)';
        $scope.randomBackground["background-size"] = '160%';
        $scope.randomBackground["background-position"] = 'center';
    }


  	$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
		// for when user hits the back bottom arrow to head back to the main menu
	    if (fromState.name == "list" && toState.name == "mainMenu"){
            $rootScope.itemLevel =  0;
            $rootScope.listLevel =  0;
		}
	})


    /************************************
    Handles uploading of all unsynched
    JSON to edge services
    ************************************/


    // upload button
    $scope.uploadJSONS = function(){
    	   // posts the unsynced json to edge
           sync.post ($rootScope.baseURL+'Update/', $rootScope.unsyncedJSON, $rootScope.loggedIn).then ( function (){
                $rootScope.unsyncedJSON = {People:[], "Site Networks":[], Sites:[], Systems:[], Deployments:[], Components:[], Documents:[], "Service Entries":[] };
            });

           sync.edit ($rootScope.baseURL+'Update/', $rootScope.editJSON, $rootScope.loggedIn).then (function (){
                 $rootScope.editJSON = {People:[], "Site Networks":[], Sites:[], Systems:[], Deployments:[], Components:[], Documents:[], "Service Entries":[] };

                 $rootScope.unsyncedJSON ["Last Sync Date"] = new Date ();
                // the menu is reinitiated
                $scope.init ();
    	   });
    }

    /**
      * Name: Progressive List Switch
      * Usage: Called from main menu controller to move us into the
      *        the list controller
      *
      */
    $scope.progressiveListSwitch = function(){
        var tieredTitles = ["Site Networks", "Sites", "Systems", "Deployments", "Components"];
        var tieredRoutes = ["network", "site", "system", "deployment", "component"];
        var tieredJSON = [$rootScope.networkJSON,$rootScope.siteJSON,$rootScope.systemJSON,$rootScope.deploymentJSON,$rootScope.componentJSON];
        var tieredSyncedJSON = [$rootScope.networkSyncedJSON,$rootScope.siteSyncedJSON,$rootScope.systemSyncedJSON,$rootScope.deploymentSyncedJSON,$rootScope.componentSyncedJSON];



        // should work to sort list based on log in
        if ($rootScope.loggedIn){
        	$scope.temp = [];
        	for (var j = 0; j < $rootScope.associatedNetworks.length; j++){

        		for ( var i = 0; i < $rootScope.networkSyncedJSON["Site Networks"].length; i ++){

        			if ($rootScope.associatedNetworks [j] == $rootScope.networkSyncedJSON["Site Networks"][i]['Unique Identifier']){
        				        $scope.temp[$scope.temp.length] = $rootScope.networkSyncedJSON["Site Networks"][i];

        			}
        		}
        	}
            $rootScope.networkSyncedJSON = {"Site Networks":[]};
            $rootScope.networkSyncedJSON["Site Networks"] = $scope.temp;
        }

        for (var i = 0; i < $rootScope.editJSON['Site Networks'].length; i++){
            for (var j = 0; j < $rootScope.networkSyncedJSON["Site Networks"].length; j++){
                if ($rootScope.editJSON['Site Networks'][i]["Unique Identifier"] == $rootScope.networkSyncedJSON["Site Networks"][j]["Unique Identifier"]){
                    $rootScope.networkSyncedJSON["Site Networks"][j] = $rootScope.editJSON['Site Networks'][i];
                }
            }
        }

        tieredSyncedJSON[0] = $rootScope.networkSyncedJSON;



        $scope.listSwitch(tieredSyncedJSON, tieredTitles, $rootScope.listLevel);

        DynamicPage.setJSON();

        //store the json of the
        //list item clicked
        $scope.clickedJSON = DynamicPage.getJSON();

        //set the route of dynamic page one level back
        //so we can view the info of what we just clicked
        DynamicPage.setTitle(tieredTitles[$rootScope.listLevel]);
        DynamicPage.setRoute(tieredRoutes[$rootScope.itemLevel]);

        $scope.route = DynamicPage.getRoute();
        $scope.title = DynamicPage.getTitle();

    }


    $scope.listSwitch = function(syncedJSONs, titles, level){
    	$scope.unsyncedListJSON = {};
        var title = titles[level];
        var syncedJSON = syncedJSONs[level];

        //reset the title with every switch
		$scope.title = title;

        var promise = $q (function (resolve, reject){

            if (title != "Service Entries"){
                for (var i = 0; i < $rootScope.unsyncedJSON[title].length; i++){
                    if (title == "People")  {
                        $scope.unsyncedListJSON[i] = $rootScope.unsyncedJSON[title][i]['First Name'] + " "+ $rootScope.unsyncedJSON[title][i]['Last Name'];
                    }
                    else{
                        $scope.unsyncedListJSON[i] = $rootScope.unsyncedJSON[title][i]['Name'];
                    }
                }


                $rootScope.chosenJSONlist = $rootScope.unsyncedJSON[title].concat(syncedJSON[title]);
                for (var i = 0; i < $rootScope.editJSON[title].length; i++){
                    for (var j = 0; j < $rootScope.chosenJSONlist.length; j++){
                        if ($rootScope.editJSON[title][i]["Unique Identifier"] == $rootScope.chosenJSONlist[j]["Unique Identifier"]){
                            $rootScope.chosenJSONlist[j] = $rootScope.editJSON[title][i];
                        }
                    }
                }
            }

            else {
                for (var i = 0; i < $rootScope.unsyncedJSON.ServiceEntries.length; i++){
                    $scope.unsyncedListJSON[i] = $rootScope.unsyncedJSON.ServiceEntries[i]['Name'];
                }

                $rootScope.chosenJSONlist = $rootScope.unsyncedJSON.ServiceEntries.concat (syncedJSON.ServiceEntries);
                for (var i = 0; i < $rootScope.editJSON.ServiceEntries.length; i++){
                    for (var j = 0; j < $rootScope.chosenJSONlist.length; j++){
                        if ($rootScope.editJSON.ServiceEntries[i]["Unique Identifier"] == $rootScope.chosenJSONlist[j]["Unique Identifier"]){
                            $rootScope.chosenJSONlist[j] = $rootScope.editJSON.ServiceEntries[i];
                        }
                    }
                }

            }
            resolve ($rootScope.chosenJSONlist);

        })

            //return promise
        promise.then ( function success (){
            $rootScope.listJSON = $scope.filter($rootScope.chosenJSONlist, level);
        });


        //filter out list according to a specific criteria of a parent at a given level
        $scope.filter = function (unfilteredList, listLevel){
            var parentName = parent[listLevel];
            var lastClickedJSON = DynamicPage.getJSON();
            var filteredList = [];

            if(parentName == "Unique Identifier"){
                return unfilteredList;
            }
            else {
                if (angular.isUndefined (lastClickedJSON [parentName])){
                    $rootScope.related = lastClickedJSON["Unique Identifier"];
                }
                else{
                    $rootScope.related = lastClickedJSON [parentName];
                }
                 $rootScope.relatedTitle = parentName;
                 filteredList = unfilteredList.filter(belongsToParent(parentName, lastClickedJSON));
                 return filteredList;
            }
        }

        //helper function
        function belongsToParent(parent, presentJSON){
            return function(object){
                if (object[parent] == presentJSON[parent]){
                    return object;
                }
            }
        }

    }

// only runs the first time the program is called.
// Reads from the server and inputs into array
    $scope.init = function (){


        showLoading();
        $scope.timeout = true;

        //start timeout
        $timeout(function () {
            if($scope.timeout == true){
                $ionicLoading.hide();
                $scope.makeTimeoutModal();
            }
        }, 20000);

        //setupVars
       variableSetup();


    	//get permissions
    	//unblock before packaging
    	//Camera.checkPermissions();
    $q (function (resolve, reject){
        // gets unsynced data back from local storage and puts in unsyncedJSON
        var list = ["People","Site Networks", "Sites", "Systems", "Deployments", "Components", "Documents","Service Entries"];

        if (File.checkFile ('Edit')){
            File.readFile ('Edit').then (function Success (response){
                if (response != null){
                    for (var i = 0; i < list.length; i++){
                            $rootScope.editJSON[list[i]] = $rootScope.editJSON[list[i]].concat(response[list[i]]);
                    }

                    if( angular.isDefined($rootScope.editJSON["Last Sync Date"]) &&
                        $rootScope.editJSON["Last Sync Date"] > response["Last Sync Date"]) {
                        //do nothing
                    }
                    else {
                        $rootScope.editJSON["Last Sync Date"] = new Date(response["Last Sync Date"]);
                    }
                }
            })
            if (!angular.isDefined ($rootScope.editJSON['Last Sync Date'])){
                 $rootScope.editJSON['Last Sync Date'] = new Date();
            }
            resolve();
        }
    }).then (function () {
	$q (function (resolve, reject){
    	// gets unsynced data back from local storage and puts in unsyncedJSON
		var list = ["People", "Site Networks", "Sites", "Systems", "Deployments", "Components", "Documents", "Service Entries"];

    	if (File.checkFile ('Unsynced')){
			File.readFile ('Unsynced').then (function Success (response){
				if (response != null){
					for (var i = 0; i < list.length; i++){
						 $rootScope.unsyncedJSON[list[i]] = $rootScope.unsyncedJSON[list[i]].concat (response[list[i]]);
					}
				}
			})
			resolve();
		}
	}).then (function () {
 		$q (function (resolve, reject){
    	// people read. Same as sync.read factory, but has to be seperated because we need first and last name
    	var promise = $q (function (resolve, reject){$http.get($rootScope.baseURL + "Retrieve/" + $rootScope.urlPaths[0]+"/", {timeout: 10000}).then (function(result){
    		$rootScope.peopleSyncedJSON = result.data;
    		File.PhotoSafeWriteFile( 'People', $rootScope.peopleSyncedJSON);
    		resolve ($rootScope.peopleSyncedJSON);
    	}, function (result){
    		File.readFile('People').then (function(success){
    			$rootScope.peopleSyncedJSON = success;
    			resolve ($rootScope.peopleSyncedJSON);
    		});

     	})})
   		promise.then (function(result){
    		for (var i = 0; i < $rootScope.peopleSyncedJSON.People.length; i++){
				$rootScope.peopleJSON [$rootScope.peopleSyncedJSON.People[i]['Person']] =  $rootScope.peopleSyncedJSON.People[i]['First Name'] + " " + $rootScope.peopleSyncedJSON.People[i]['Last Name'];
			}
			resolve ();
    	})
   	}).then (function () {
 		$q (function (resolve, reject){

    	// site network read
    	sync.read($rootScope.baseURL + "Retrieve/" + $rootScope.urlPaths[1]+"/", $rootScope.networkSyncedJSON, 'Site Network', $rootScope.networkJSON).then (function (result){
    		// redudant, but nessecary.  Doesnt work otherwise for some reason
    		$rootScope.networkSyncedJSON = result;
    		// writes to local storage
    		File.checkandWriteFile('Site Network', $rootScope.networkSyncedJSON);
    		resolve ();
    	})
    }).then (function () {
 		$q (function (resolve, reject){

    	// site read
    	sync.read($rootScope.baseURL + "Retrieve/" + $rootScope.urlPaths[2]+"/", $rootScope.siteSyncedJSON,'Site', $rootScope.siteJSON).then(function(result){
    		$rootScope.siteSyncedJSON = result;
    		File.checkandWriteFile('Site', $rootScope.siteSyncedJSON);
    		resolve();
    	});

    }).then (function () {
 		$q (function (resolve, reject){

    	// system read
    	sync.read($rootScope.baseURL + "Retrieve/" + $rootScope.urlPaths[3]+"/", $rootScope.systemSyncedJSON, 'System', $rootScope.systemJSON).then (function(result){
    		$rootScope.systemSyncedJSON = result;
    		File.PhotoSafeWriteFile('System', $rootScope.systemSyncedJSON);
    		resolve();
    	})
    }).then (function () {
 		$q (function (resolve, reject){

    	// deployment read
    	sync.read($rootScope.baseURL + "Retrieve/" + $rootScope.urlPaths[4]+"/", $rootScope.deploymentSyncedJSON, 'Deployment', $rootScope.deploymentJSON).then (function(result){
    		$rootScope.deploymentSyncedJSON = result;
    		File.checkandWriteFile('Deployment', $rootScope.deploymentSyncedJSON);
    		resolve();
    	})
    }).then (function () {
 		$q (function (resolve, reject){

    	// component read
    	sync.read($rootScope.baseURL + "Retrieve/" + $rootScope.urlPaths[5]+"/", $rootScope.componentSyncedJSON, 'Component', $rootScope.componentJSON).then (function(result){
    		$rootScope.componentSyncedJSON = result;
    	    File.PhotoSafeWriteFile('Component', $rootScope.componentSyncedJSON);
    		resolve();
    	});
    }).then (function () {
 		$q (function (resolve, reject){

    	// 	document read
		sync.read($rootScope.baseURL + "Retrieve/" + $rootScope.urlPaths[6]+"/", $rootScope.documentSyncedJSON, 'Document', $rootScope.documentJSON).then (function(result){
			$rootScope.documentSyncedJSON = result;
			File.checkandWriteFile('Document', $rootScope.documentSyncedJSON);
			resolve()
		});
	}).then (function () {
 		$q (function (resolve, reject){
   		// service Entries read. Seperate due to service enteries having a space
    	var promise = $q (function (resolve, reject){$http.get($rootScope.baseURL + "Retrieve/ServiceEntries/", {timeout: 10000}).then (function(result){
                $rootScope.serviceSyncedJSON = result.data;
        		File.PhotoSafeWriteFile( 'Service Entry', $rootScope.serviceSyncedJSON);
        		resolve ($rootScope.serviceSyncedJSON);
    		}, function (result){
    			File.readFile('Service Entry').then (function(success){
    			$rootScope.serviceSyncedJSON = success;
    			resolve ($rootScope.serviceSyncedJSON);
    		});
     		})})
  	 	promise.then (function(result){

            for (var i = 0; i < $rootScope.serviceSyncedJSON["Service Entries"].length; i++){
				$rootScope.serviceJSON [$rootScope.serviceSyncedJSON["Service Entries"][i]['Service Entry']] =  $rootScope.serviceSyncedJSON["Service Entries"][i]['Name'];
			}

            //HACK FIX BECAUSE I DONT KNOW HOW THIS WORKS
            // But it wasn't resolving when there are no service entries was the problem!
            //*******************************************************************
            resolve();
    	})
  	 }).then(function (){

         //hide loading screen
         $ionicLoading.hide();

         //throw flag for timeout function
         $scope.timeout = false;

  	})})})})})})})})})})
    }

    function showLoading(){
    	//Indicating Initilaize is loading
    	$ionicLoading.show({
        	templateUrl: 'templates/directive_templates/loading-spinner.html',
        	noBackdrop: false
    	});
    }



/**********************************************
    Controlling functions for the notification modal
    when init times out.
************************************************/


    $scope.makeTimeoutModal = function(){
        $ionicModal.fromTemplateUrl('templates/modal_templates/timeout.html',{
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal){
            $scope.modal = modal;
            $scope.modal.show();
        });
    };

    $scope.showTimeoutModal = function(){
        $scope.modal.show();
    }

    $scope.removeTimeoutModal = function(){
        $scope.modal.remove();
    }


/*************************************************
Provides an email service which sends an email to
app administrator.
*************************************************/
    $scope.notifyOfServicesError = function() {
        if(window.plugins && window.plugins.emailComposer) {
            window.plugins.emailComposer.showEmailComposerWithCallback(function(result) {
            },
            "Services Are Down", // Subject
            "This is an automated email notification to the administrator of the NRDC QA app that the data download and upload services are down and need to be fixed.",  // Body
            ["cscully-allison@nevada.unr.edu"],    // To
            null,                    // CC
            null,                    // BCC
            false,                   // isHTML
            null,                    // Attachments
            null);                   // Attachment Data
        }
    }


    function variableSetup(){

            // create global variables,could probably be cut down but that would mean changing everything
        	$rootScope.peopleSyncedJSON = {};
        	$rootScope.peopleJSON = {};
        	$rootScope.networkSyncedJSON = {};
        	$rootScope.networkJSON = {};
        	$rootScope.siteSyncedJSON = {};
        	$rootScope.siteJSON = {};
        	$rootScope.systemSyncedJSON = {};
        	$rootScope.systemJSON = {};
        	$rootScope.deploymentSyncedJSON = {};
        	$rootScope.deploymentJSON = {};
        	$rootScope.componentSyncedJSON = {};
        	$rootScope.componentJSON = {};
        	$rootScope.documentSyncedJSON = {};
        	$rootScope.documentJSON = {};
        	$rootScope.serviceSyncedJSON = {};
        	$rootScope.serviceJSON = {};

        	// special lists for service entries for list
        	$rootScope.servicelistJSON = {};
        	$rootScope.serviceJSONlist = [];
        	$rootScope.serviceEntryListJSON = [];

        	// special lists for documents for listView
        	$rootScope.documentlistJSON = {};
        	$rootScope.documentJSONlist = [];
        	$rootScope.docListJSON = [];
    }

    //initalize
    //hacky workaround to prevent data from being loaded from file after conflict resolution
    if(angular.isUndefined($stateParams.resolved)){
        $scope.init();
    } else if($stateParams.resolved == null){
        $scope.init();
    }



})

/**
    Controller handles scroll functionality,
    binds to arrow objects,
    hides arrow objects
*/
.controller('scrollController', function($scope, $state, $ionicScrollDelegate) {
    $scope.isBottom = false;
    smoothnessOffset = 15;  //ensures smooth dissapearnce of arrow

    //scrolls the content window to the bottom
    $scope.scrlBot = function(){
        $ionicScrollDelegate.$getByHandle('scrollable').scrollBottom(true);
    }

    //hide arrow when user scrolls nearly to bottom
    //hides using angular logic
    //updates bool evaluated by ng-hide
    $scope.cndHideArrow = function(){
        $scope.isBottom = ($ionicScrollDelegate.getScrollPosition().top >=
                            $ionicScrollDelegate.getScrollView().__maxScrollTop - smoothnessOffset)
        $scope.$apply();
    }
})

// listView controller
.controller('listCtrl', function($scope, $rootScope, DynamicPage, $state, ObjectCounter, $ionicHistory, ionicMaterialInk, $ionicLoading, $q, $ionicPlatform) {


/* Variable Declaration **************************************
**********************************************************/
    var tieredTitles = ["Site Networks", "Sites", "Systems", "Deployments", "Components"];
    var tieredRoutes = ["network", "site", "system", "deployment", "component"];
    var parent = ["Unique Identifier", "Site Network", "Site", "System", "Deployment"];
    var tieredSyncedJSON =[$rootScope.networkSyncedJSON, $rootScope.siteSyncedJSON, $rootScope.systemSyncedJSON, $rootScope.deploymentSyncedJSON, $rootScope.componentSyncedJSON];
    $scope.clickedJSONHist = [];

/* Function Declaration *************************************
**********************************************************/

    //function scope binding
    $rootScope.back = back;
    $scope.viewItem = viewItem;
    $scope.newItem = newItem;
    $scope.select = select;
    $scope.progressiveListSwitch = progressiveListSwitch;
    $scope.regressiveListSwitch = regressiveListSwitch;
    $scope.listSwitch = listSwitch;
    $scope.filter = filter;


/* Registration and Startup ******************************
**********************************************************/

    //registers custom back button functionality on
     // hardware back button
     // 101 - Priority just above "100 - return to previous view"
     $ionicPlatform.registerBackButtonAction( $rootScope.back, 101);

    //does thing on state change success
     $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
         // works on every load after
         $scope.title = DynamicPage.getTitle();
         $scope.route = DynamicPage.getRoute();
         $scope.modalCheck = true;
+
         if(fromState.name == "component" && toState.name == "list"){
             console.log(toState, fromState);

             //reset the item route to our deployments level
             $rootScope.itemLevel--;
             console.log($scope.clickedJSONHist);
             DynamicPage.setJSON($scope.clickedJSONHist.pop());
             DynamicPage.setRoute(tieredRoutes[$rootScope.itemLevel]);
             $scope.route = DynamicPage.getRoute();

         }

     })



     // gets data from the DynamicPage factory. Only works on first load
     $scope.title = DynamicPage.getTitle();
     $scope.route = DynamicPage.getRoute();
     $scope.modalCheck = true;


     if (angular.isDefined (DynamicPage.getJSON())){
     	$scope.UUID = DynamicPage.getJSON()['Unique Identifier'];

     	for (var i = 0; i < $rootScope.unsyncedJSON[DynamicPage.getTitle()].length; i ++){
 			if ($scope.UUID == $rootScope.unsyncedJSON[DynamicPage.getTitle()][i]['Unique Identifier']){
 				$scope.modalCheck = false;
 			}
 		}
 	}






 /* Function Implementation **********************************
 **********************************************************/

    //custom back button functinality
    function back(){
          //if we are in main menu do nothing
        if($state.$current.self.name == 'mainMenu'){
            return;
        }
        //if we are no in a list go back like normal
        else if($state.$current.self.name != 'list'){
            $ionicHistory.goBack();
        }
        //if we are in a list but not the top tier
        // call custom list switch function
        else if($rootScope.listLevel > 0){
            $scope.regressiveListSwitch();
        }
        //if we are in at the network level
        //of our list
        else{
            $ionicHistory.goBack();
            //reset list levels
            $rootScope.itemLevel =  0;
            $rootScope.listLevel =  0;
        }
    }

    //enables the viewing of our currently selected
    //data (i.e. will enable us to see the current network,
    //document, component, site etc.)
    function viewItem(){
        $state.go($scope.route);
    }

    //for the creation of a new item
    function newItem(){
        $state.go("createNew"+$scope.title);
    }


	// wrapper for person select button
	function select(JSON){
		DynamicPage.getRoute();
        DynamicPage.setJSON(JSON);
	}

    function storePrevJSON(){
        var previousViewJSON = $scope.clickedJSON;
        if($scope.clickedJSONHist.length < 5){
            $scope.clickedJSONHist.push(previousViewJSON);
        }
    }

    //calls for the next tier of
    //items in the site network hierarchy
    function progressiveListSwitch(){

        if($rootScope.listLevel < 4){
        	$scope.modalCheck = true;

            //store my previous view's JSON for return
            storePrevJSON();

            if (angular.isDefined (DynamicPage.getJSON())){
            	$scope.UUID = DynamicPage.getJSON()['Unique Identifier'];

            	for (var i = 0; i < $rootScope.unsyncedJSON[DynamicPage.getTitle()].length; i ++){
        			if ($scope.UUID == $rootScope.unsyncedJSON[DynamicPage.getTitle()][i]['Unique Identifier']){

                		$scope.modalCheck = false;

                	}
        		}
        	}

            //increment the level of my list and of my
            //item clicked until we hit the bottom list
            //presently components
            if($rootScope.listLevel < (tieredTitles.length - 1)){
                $rootScope.listLevel++;
            }

            //determine the level of our selected route
            if($rootScope.itemLevel < 3){
                $rootScope.itemLevel = $rootScope.listLevel - 1;
            }
            else{
                $rootScope.itemLevel = 4;
            }

            $scope.temp = $rootScope.listLevel;

            //call the fucntion which swtiches out switch view data
            $scope.listSwitch(tieredSyncedJSON, tieredTitles, $rootScope.listLevel);
            $rootScope.listLevel = $scope.temp;

            //store the json of the
            //list item clicked
            $scope.clickedJSON = DynamicPage.getJSON();


            //set the route of dynamic page one level back
            //so we can view the info of what we just clicked
            DynamicPage.setTitle(tieredTitles[$rootScope.listLevel]);
            DynamicPage.setRoute(tieredRoutes[$rootScope.itemLevel]);


            $scope.route = DynamicPage.getRoute();
            $scope.title = DynamicPage.getTitle();


            //sends data to the scope so view
            // knows to hide FAB button on networks
    		if ($scope.title.localeCompare("Networks")){
    			$scope.networkListFlag = true;
    		}
    		else{
    			$scope.networkListFlag = false;
            }
        }

        //this else statmenet makes it so compoanents are a button
        // that shows component info
        else{
            //increment item level for routes
            $rootScope.itemLevel++;
            DynamicPage.setRoute(tieredRoutes[$rootScope.itemLevel]);
            $scope.route = DynamicPage.getRoute();
            storePrevJSON();

            $rootScope.related = DynamicPage.getJSON()["Component"];
            $rootScope.relatedTitle = "Component";

            $scope.viewItem();
        }
    }

    //navigate in the opposite direction
    function regressiveListSwitch(){

    	$scope.modalCheck = true;

        if (angular.isDefined (DynamicPage.getJSON())){
        	$scope.UUID = DynamicPage.getJSON()['Unique Identifier'];
        	for (var i = 0; i < $rootScope.unsyncedJSON[DynamicPage.getTitle()].length; i ++){
    			if ($scope.UUID == $rootScope.unsyncedJSON[DynamicPage.getTitle()][i]['Unique Identifier']){
    				$scope.modalCheck = false;
    			}
    		}
    	}


        /** Replace with safe decrement function **/
        if ($rootScope.listLevel != -1){
        	if($rootScope.listLevel != $rootScope.itemLevel){
            	$rootScope.listLevel--;
        	}

       		 //determine the level of our selected route
       		 if($rootScope.itemLevel != 4){
           		 $rootScope.itemLevel = $rootScope.listLevel - 1;
        		} else {
           		 $rootScope.itemLevel--;
       		 }

        	$scope.listSwitch(tieredSyncedJSON, tieredTitles, $rootScope.listLevel);
        	$scope.select($scope.clickedJSONHist.pop());
        }

        //store the json of the
        //list item clicked
        $scope.clickedJSON = DynamicPage.getJSON();

        //set the route of dynamic page one level back
        //so we can view the info of what we just clicked
        DynamicPage.setTitle(tieredTitles[$rootScope.listLevel]);
        DynamicPage.setRoute(tieredRoutes[$rootScope.itemLevel]);

        $scope.route = DynamicPage.getRoute();
        $scope.title = DynamicPage.getTitle();

        //sends data to the scope so view
        // knows to hide FAB button on networks
        if ($scope.title.localeCompare("Networks")){
            $scope.networkListFlag = true;
        }
        else
            $scope.networkListFlag = false;

    }

    function listSwitch(syncedJSONs, titles, level){
    	$scope.unsyncedListJSON = {};
        var title = titles[level];
        var syncedJSON = syncedJSONs[level];


        //reset the title with every call
		$scope.title = title;

        //make a promise as to ensure sequential execution
    	var promise = $q(function (resolve, reject){
    		if (title != "Service Entries"){
        		for (var i = 0; i < $rootScope.unsyncedJSON[title].length; i++){
        			if (title == "People")	{
        				$scope.unsyncedListJSON[i] = $rootScope.unsyncedJSON[title][i]['First Name'] + " "+ $rootScope.unsyncedJSON[title][i]['Last Name'];
        			}
        			else{
        				$scope.unsyncedListJSON[i] = $rootScope.unsyncedJSON[title][i]['Name'];
        			}
    			}

    		    $rootScope.chosenJSONlist = $rootScope.unsyncedJSON[title].concat(syncedJSON[title]);
                for (var i = 0; i < $rootScope.editJSON[title].length; i++){
                    for (var j = 0; j < $rootScope.chosenJSONlist.length; j++){
                        if ($rootScope.editJSON[title][i]["Unique Identifier"] == $rootScope.chosenJSONlist[j]["Unique Identifier"]){
                            $rootScope.chosenJSONlist[j] = $rootScope.editJSON[title][i];
                        }
                    }
                }
		    }

            else {
                for (var i = 0; i < $rootScope.unsyncedJSON.ServiceEntries.length; i++){
                	$scope.unsyncedListJSON[i] = $rootScope.unsyncedJSON.ServiceEntries[i]['Name'];
                }
    			$rootScope.chosenJSONlist = $rootScope.unsyncedJSON.ServiceEntries.concat (syncedJSON.ServiceEntries);
                for (var i = 0; i < $rootScope.editJSON.ServiceEntries.length; i++){
                    for (var j = 0; j < $rootScope.chosenJSONlist.length; j++){
                        if ($rootScope.editJSON.ServiceEntries[i]["Unique Identifier"] == $rootScope.chosenJSONlist[j]["Unique Identifier"]){
                            $rootScope.chosenJSONlist[j] = $rootScope.editJSON.ServiceEntries[i];
                        }
                    }
                }
		    }

		    resolve ($rootScope.chosenJSONlist);
    	});

        //return promise
        promise.then ( function success (){
            $rootScope.listJSON = $scope.filter($rootScope.chosenJSONlist, level);
            $scope.service = setServiceFlag($scope.title);
        })

   }

    //filter out list according to a specific criteria of a parent at a given level
    function filter(unfilteredList, listLevel){
        var parentName = parent[listLevel];
        var lastClickedJSON = DynamicPage.getJSON();
        var filteredList = [];
        if(parent[listLevel] == "Unique Identifier"){
            return unfilteredList;
        }
        else {
        	if (angular.isUndefined (lastClickedJSON [parentName])){
				$rootScope.related = lastClickedJSON["Unique Identifier"];
         	}
        	else{
                $rootScope.related = lastClickedJSON [parentName];
         	}

            $rootScope.relatedTitle = parentName;
    	    filteredList = unfilteredList.filter(belongsToParent(parentName, lastClickedJSON));
    	    return filteredList;
        }
    }

    //helper function
    //uses callback to filter according to weither a
    //item belongs to filter
    function belongsToParent(parent, presentJSON){
        return function(object){
            if (object[parent] == presentJSON[parent]){
                return object;
            }
        }
    }

    function safeDecrement(listLevel){

    }


    function setServiceFlag(title){
        console.log(title);
        switch (title){
            case 'Site Networks':
                    return false;
                break;

            case 'Sites':
                    return false;
                break;

            case 'Systems':
                    return true;
                break;

            case 'Deployments':
                    return true;
                break;

            case 'Components':
                    return true; // returns true off by one becase of assymetric list level and item level
                break;

            case 'Serviceentriess':
                    return false;
                break;

        }
    }


    //required for ink ripple effect on material button press
    ionicMaterialInk.displayEffect();
})

.controller('documentListCtrl', function($scope, $rootScope, $state, $ionicModal, DynamicPage, SaveNew, $ionicHistory, $ionicPlatform) {
	$scope.documentList = function (selectedTitle){
		// setting up the page
        //store the json of the
        //list item clicked
        selected = DynamicPage.getJSON();
        $rootScope.docListJSON = [];
        $rootScope.docJSON = selected;
    	$scope.temp = $rootScope.documentSyncedJSON['Documents'].concat ($rootScope.unsyncedJSON['Documents']);
    	for (var i = 0; i < $scope.temp.length; i ++){
    		if (angular.isDefined ($scope.temp[i][selectedTitle]) && ($scope.temp[i][selectedTitle] == selected[selectedTitle])){
    			$rootScope.docListJSON.push ($scope.temp[i]);
    		}
    	}
    }

    //custom back button functinality
    $scope.backList = function(){
		$rootScope.docListJSON = [];
		$ionicHistory.goBack();
    }

    $scope.select = function(item){
    	$rootScope.storedRoute = DynamicPage.getRoute();
    	DynamicPage.setRoute ('Document');
    	$rootScope.storedJSON = DynamicPage.getJSON();
    	DynamicPage.setJSON (item);
    	$state.go ('document');
    }

    $scope.newDoc = function(){
        $state.go("createNewDocuments");
    }



})


.controller('ServiceListCtrl', function($scope, $rootScope, $state, $ionicModal, DynamicPage, SaveNew, $ionicHistory) {
	$scope.serviceList = function (selectedTitle){



        // setting up the page
        //store the json of the
        //list item clicked
        selected = DynamicPage.getJSON();
        $rootScope.serviceEntryListJSON = [];
        $rootScope.seJSON = selected;

        console.log(selectedTitle, selected);

    	$scope.temp = $rootScope.serviceSyncedJSON['Service Entries'].concat ($rootScope.unsyncedJSON['Service Entries']);
    	for (var i = 0; i < $scope.temp.length; i ++){
    		if (angular.isDefined ($scope.temp[i][selectedTitle]) && ($scope.temp[i][selectedTitle] == selected[selectedTitle])){
    			$rootScope.serviceEntryListJSON.push($scope.temp[i]);
    		}
    	}
    }


    //custom back button functinality
    $scope.backList = function(){
		$rootScope.serviceEntryListJSON = [];
		$ionicHistory.goBack();
    }

    $scope.select = function(item){
    	$rootScope.storedRoute = DynamicPage.getRoute();
    	DynamicPage.setRoute ('Service Entries');
    	$rootScope.storedJSON = DynamicPage.getJSON();
    	DynamicPage.setJSON (item);
    	$state.go ('serviceEntry');
    }

    $scope.newSE = function(){
        $state.go("createNewServiceEntries");
    }
})

// for when a new entry is being created
.controller('modalController', function($scope, $rootScope, $state, $ionicModal, $ionicLoading, $q, DynamicPage, SaveNew, $cordovaCamera, Camera, GPS, $sce, $ionicHistory, ObjectCounter) {
    $scope.rawImg;
	// set imageData to null in case there is no picture
	$scope.imageData = null;
	// allow saves
	$scope.checked = false;

    //start with modal hidden and
    //modal nonexistant
    $rootScope.modalHidden = true;
    $scope.modal = null;

    // create JSON
    $scope.JSON = {};

    $scope.images = 'ion-images';
    $scope.camera = "ion-android-camera";

    $scope.clear = function(){
        if($scope.JSON['Name'] == "New " + DynamicPage.getTitle()){
            $scope.JSON['Name'] = "";
        }
    }


  	// save JSON
	$scope.saveJSON = function (){
		// go to SaveNew factory
		SaveNew.save (DynamicPage.getTitle(), true, $scope.JSON, $rootScope.unsyncedJSON[DynamicPage.getTitle()], $scope.imageData, $rootScope.related);
		// I have no idea why it doesnt work with Networks
		if (DynamicPage.getTitle() != "Networks"){
			$rootScope.listJSON.push($scope.JSON);
        }
		$rootScope.chosenJSONlist.push($scope.JSON);
	};




	//wrapper for the openGallery factory so we can call it from the choosePicture button.
	// in root scope so it can be called from all buttons
	$rootScope.choosePicture = function (){
        return $q (
            function (resolve, reject){
                    $ionicLoading.show({
                        templateUrl: 'templates/directive_templates/loading-spinner.html',
                        noBackdrop: true
                    })
                    Camera.checkPermissions();
                    Camera.openGallery()
                    .then(function (image){
                        $ionicLoading.hide();
                        $scope.imageData = image.result;
                        resolve(image.raw);
                    })
                    .catch(function(error){
                        $ionicLoading.hide();
                    });
            }
        )
    };

	//wrapper for the take image factory so we can call it from the takePhoto button
	// in root scope so it can be called from all buttons
	$rootScope.takePicture = function (){
         return $q(
            function (resolve, reject){
                Camera.checkPermissions();
                Camera.openCamera()
                .then($ionicLoading.show({
                    templateUrl: 'templates/directive_templates/loading-spinner.html',
                    noBackdrop: false
                }))
                .then(function (image){
                    $ionicLoading.hide();
                    $scope.imageData =  image.result;
                    resolve(image.raw);
                })
                .catch(function(error){
                        $ionicLoading.hide();
                });
            });

	}


	//wrapper for the GPS factory so we can call it from the getGPS button
	// in root scope so it can be called from all buttons
	$rootScope.getGPS = function (JSON){
		GPS.checkPermissions();
		GPS.getLocation(JSON);
	}

    $scope.back = function(){
        //conditional to fix problem of double
        //back when modal closed
        if($rootScope.modalHidden != false){
            $ionicHistory.goBack();
            $scope.modal = null;
        }
    }

})


// document modal controller, works the same as the ModalController, but needs to be its on controller so in can show up inside a modal
.controller('DocumentModalController', function($scope, $rootScope, $state, $ionicModal, DynamicPage, SaveNew, $cordovaCamera, Camera, GPS, $sce, $ionicHistory, ObjectCounter ) {
	$scope.checked = false;
    $scope.JSON = {};


	$scope.saveJSON = function (){
		// nulls entries that may not have any data
		$scope.JSON ['Network'] = null;
		$scope.JSON ['Site'] = null;
		$scope.JSON ['System'] = null;
		$scope.JSON ['Deployment'] = null;
		$scope.JSON ['Component'] = null;
		$scope.JSON ['Service Entry'] = null;

        $scope.JSON [$rootScope.relatedTitle] = $rootScope.related;

		// adds data for the entry the document is related to
		//$scope.JSON [DynamicPage.getRoute().charAt(0).toUpperCase() + DynamicPage.getRoute().slice(1)] = $rootScope.docJSON [DynamicPage.getRoute().charAt(0).toUpperCase() + DynamicPage.getRoute().slice(1)];
		// SaveNew factory
		SaveNew.save ("Documents", true, $scope.JSON, $rootScope.unsyncedJSON['Documents'], $scope.imageData, $rootScope.related);
		// pushes into list
		$rootScope.docListJSON.push ($scope.JSON);
        $scope.JSON = {};

	};

    $scope.back = function(){
        //conditional to fix problem of double
        //back when modal closed
        if($rootScope.modalHidden != false){
            $ionicHistory.goBack();
        }
     };
})


//Controls the behavior of the service modals for particular networks, sites, sysyems etc
.controller('ServiceModalController', function($scope, $rootScope, $state, $ionicModal, DynamicPage, SaveNew, $cordovaCamera, Camera, GPS, $sce, $ionicHistory, ObjectCounter) {
	$scope.imageData = null;
	$scope.checked = false;
    $scope.JSON = {};


    $scope.images = 'ion-images';
    $scope.camera = "ion-android-camera";



	$scope.saveJSON = function (){
		// nulls entries that may not have any data
		$scope.JSON ['Site'] = null;
		$scope.JSON ['System'] = null;
		$scope.JSON ['Deployment'] = null;

		// adds data for the entry the service entry is related to
		var JSON = DynamicPage.getJSON();

        $scope.JSON [$rootScope.relatedTitle] = $rootScope.related;
		SaveNew.save ('Service Entries', true, $scope.JSON, $rootScope.unsyncedJSON['Service Entries'], $scope.imageData, $rootScope.related);
		// pushes into list
		$rootScope.serviceEntryListJSON.push ($scope.JSON);

        $scope.JSON = {};
	};


    $scope.back = function(){
        //conditional to fix problem of double
        //back when modal closed
        if($rootScope.modalHidden != false){
            $ionicHistory.goBack();
        }
     };
})
