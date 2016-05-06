var identity = angular.module("identity", ["ngRoute", 'ui.bootstrap', 'ngSanitize', 'ngCsv', 'ngMaterial', 'ngMessages', 'md.data.table']);

identity.config(function ($routeProvider) {
    $routeProvider
        .when("/monitor", {
            templateUrl: "/web-app/views/monitor.html",
            controller: "MonitorCtrl"
        })
        .when("/credentials", {
            templateUrl: "/web-app/views/credentials.html",
            controller: "CredentialsCtrl"
        })
        .when("/create/:type", {
            templateUrl: "/web-app/views/create.html",
            controller: "NewCtrl"
        })

        .when("/import", {
            templateUrl: "/web-app/views/import.html",
            controller: "ImportCtrl"
        })
        .otherwise({
            redirectTo: "/monitor/"
        })
}).config(function($mdThemingProvider){
    $mdThemingProvider.theme('default')
        .primaryPalette('green');
});


identity.factory("userTypesService", function () {
    var userTypes = [
        {name: "CLOUD_PPSK", selected: false},
        {name: "CLOUD_RADIUS", selected: false}
    ];
    return {
        getUserTypes: function () {
            return userTypes;
        },
        getArrayForRequest: function () {
            var arrayForRequest = [];
            userTypes.forEach(function (userType) {
                if (userType.selected) arrayForRequest.push(userType.name);
            });
            if (arrayForRequest.length === userTypes.length) return [];
            else return arrayForRequest;
        }
    }
});

identity.factory("userGroupsService", function ($http, $q) {
    var enableEmailApproval;
    var userGroups;
    var isLoaded = false;

    function init() {
        userGroups = [];
    }

    init();

    function getUserGroups() {
        init();

        var canceller = $q.defer();
        var request = $http({
            url: "/api/identity/userGroup",
            method: "POST",
            timeout: canceller.promise
        });

        var promise = request.then(
            function (response) {
                if (response.data.error) return response.data;
                else {
                    enableEmailApproval = response.data.enableEmailApproval;
                    response.data.userGroups.forEach(function (group) {
                        group["selected"] = false;
                        userGroups.push(group);
                    });
                    isLoaded = true;
                    return {userGroups: userGroups, reqId: response.data.reqId};
                }
            });

        promise.abort = function () {
            canceller.resolve();
        };
        promise.finally(function () {
            console.info("Cleaning up object references.");
            promise.abort = angular.noop;
            canceller = request = promise = null;
        });

        return promise;
    }

    return {
        getUserGroups: getUserGroups,
        getEmailApprouval: function () {
            return enableEmailApproval;
        },
        getUserGroupName: function (groupId) {
            var groupName = "";
            userGroups.forEach(function (group) {
                if (group.id === groupId) groupName = group.name;
            });
            return groupName;
        },
        isLoaded: function () {
            return isLoaded;
        },
        getArrayForRequest: function () {
            var arrayForRequest = [];
            userGroups.forEach(function (userGroup) {
                if (userGroup.selected) arrayForRequest.push(userGroup.id);
            });
            if (arrayForRequest.length === userGroups.length) return [];
            else return arrayForRequest;
        }
    }
});

identity.factory("exportService", function () {
    var exportFields = [
        {name: 'userName', selected: true, display: "User Name"},
        {name: 'email', selected: true, display: "Email"},
        {name: 'phone', selected: true, display: "Phone"},
        {name: 'organization', selected: true, display: "Organization"},
        {name: 'groupId', selected: true, display: "Group ID"},
        {name: 'groupName', selected: true, display: "Group Name"},
        {name: 'credentialType', selected: true, display: "Credential Type"},
        {name: 'createTime', selected: true, display: "Create Time"},
        {name: 'activeTime', selected: true, display: "Active Time"},
        {name: 'expireTime', selected: true, display: "Expire Time"},
        {name: 'lifeTime', selected: true, display: "Life Time"},
        {name: 'ssids', selected: true, display: "SSIDs"},
        {name: 'visitPurpose', selected: true, display: "Visit Purpose"}
    ];
    return {
        getFields: function () {
            return exportFields;
        }
    }
});

identity.factory("newUser", function ($http, $q) {
    var userFieldsToDisplay = [
        {name: 'firstName', display: 'First Name'},
        {name: 'lastName', display: 'Last Name'},
        {name: 'email', display: 'Email'},
        {name: 'phone', display: 'Phone'},
        {name: 'organization', display: 'Organization'},
        {name: 'purpose', display: 'Purpose of Visit'}
    ];
    var user;
    var deliverMethod = ['NO_DELIVERY', 'EMAIL', 'SMS', 'EMAIL_AND_SMS'];
    init();

    function init() {
        user = {
            'firstName': '',
            'lastName': '',
            'email': '',
            'phone': '',
            'organization': '',
            'purpose': '',
            'groupId': 0,
            'policy': 'GUEST',
            'deliverMethod': 'NO_DELIVERY'
        };
    }

    function saveUser(user) {
        var canceller = $q.defer();
        var request = $http({
            url: "/api/identity/credentials",
            method: "POST",
            data: {hmCredentialsRequestVo: user},
            timeout: canceller.promise
        });
        var promise = request.then(
            function (response) {
                if (response.data.error) return response.data;
                else {
                    return response.data;
                }
            },
            function (response) {
                if (response.status >= 0) {
                    console.log("error");
                    console.log(response);
                    return ($q.reject("error"));
                }
            });

        promise.abort = function () {
            canceller.resolve();
        };
        promise.finally(function () {
            console.info("Cleaning up object references.");
            promise.abort = angular.noop;
            canceller = request = promise = null;
        });

        return promise;
    }

    return {
        getUser: function () {
            return user;
        },
        getUserFieldsToDisplay: function () {
            return userFieldsToDisplay;
        },
        getDeliverMethod: function () {
            return deliverMethod;
        },
        saveUser: saveUser,
        clear: init
    }
});

identity.factory("deleteUser", function ($http, $q) {

    function deleteCredentials(ids) {

        var canceller = $q.defer();
        var request = $http({
            url: "/api/identity/credentials",
            method: "DELETE",
            params: {ids: ids},
            timeout: canceller.promise
        });
        var promise = request.then(
            function (response) {
                if (response && response.data && response.data.error) return response.data;
                else return response;
            },
            function (response) {
                if (response.status >= 0) {
                    console.log("error");
                    return ($q.reject("error"));
                }
            });

        promise.abort = function () {
            canceller.resolve();
        };
        promise.finally(function () {
            console.info("Cleaning up object references.");
            promise.abort = angular.noop;
            canceller = request = promise = null;
        });

        return promise;
    }

    return {
        deleteCredentials: deleteCredentials
    }
});

identity.factory("credentialsService", function ($http, $q, userTypesService, userGroupsService) {
    var dataLoaded = false;

    function getCredentials() {
        var params = {
            credentialType: userTypesService.getArrayForRequest(),
            userGroup: userGroupsService.getArrayForRequest()
        };
        dataLoaded = false;

        var canceller = $q.defer();
        var request = $http({
            url: "/api/identity/credentials",
            method: "GET",
            params: params,
            timeout: canceller.promise
        });
        var promise = request.then(
            function (response) {
                if (response.data.error) return response.data;
                else {
                    var credentials = [];

                    response.data.forEach(function (credential) {
                        credential.groupName = userGroupsService.getUserGroupName(credential.groupId);
                        credentials.push(credential);
                    });
                    dataLoaded = true;
                    return credentials;
                }
            },
            function (response) {
                if (response.status >= 0) {
                    console.log("error");
                    console.log(response);
                    return ($q.reject("error"));
                }
            });

        promise.abort = function () {
            canceller.resolve();
        };
        promise.finally(function () {
            console.info("Cleaning up object references.");
            promise.abort = angular.noop;
            canceller = request = promise = null;
        });

        return promise;
    }


    return {
        getCredentials: getCredentials,
        isLoaded: function isLoaded() {
            return dataLoaded;
        },
        setIsLoaded: function setIsLoaded(isLoaded) {
            dataLoaded = isLoaded;
        }
    }
});

identity.factory("monitorService", function ($http, $q, userTypesService, userGroupsService) {
    var dataLoaded = false;

    function getDevices() {
        var params = {
            credentialType: userTypesService.getArrayForRequest(),
            userGroup: userGroupsService.getArrayForRequest()
        };
        dataLoaded = false;

        var canceller = $q.defer();
        var request = $http({
            url: "/api/monitor/devices",
            method: "GET",
            params: params,
            timeout: canceller.promise
        });
        var promise = request.then(
            function (response) {
                if (response.data.error) return response.data;
                else {
                    var credentials = [];

                    response.data.forEach(function (credential) {
                        credential.groupName = userGroupsService.getUserGroupName(credential.groupId);
                        credentials.push(credential);
                    });
                    dataLoaded = true;
                    return credentials;
                }
            },
            function (response) {
                if (response.status >= 0) {
                    console.log("error");
                    console.log(response);
                    return ($q.reject("error"));
                }
            });

        promise.abort = function () {
            canceller.resolve();
        };
        promise.finally(function () {
            console.info("Cleaning up object references.");
            promise.abort = angular.noop;
            canceller = request = promise = null;
        });

        return promise;
    }


    return {
        getDevices: getDevices,
        isLoaded: function isLoaded() {
            return dataLoaded;
        },
        setIsLoaded: function setIsLoaded(isLoaded) {
            dataLoaded = isLoaded;
        }
    }
});

identity.controller("CredentialsCtrl", function ($scope, $mdDialog, userTypesService, userGroupsService, credentialsService, exportService, deleteUser) {
$scope.test = null;
    var requestForUserGroups = null;
    var initialized = false;
    $scope.exportFields = exportService.getFields();
    $scope.userTypes = userTypesService.getUserTypes();

    $scope.requestForCredentials = null;
    $scope.credentials = null;
    // table items
    $scope.selectAllChecked = false;
    $scope.selectedItems = 0;
    // pagination
    $scope.itemsByPage = 10;
    $scope.currentPage = 1;

    if (requestForUserGroups) requestForUserGroups.abort();
    requestForUserGroups = userGroupsService.getUserGroups();
    requestForUserGroups.then(function (promise) {
        if (promise && promise.error) $scope.$broadcast("apiError", promise.error);
        else {
            $scope.userGroups = promise.userGroups;
            $scope.requestForCredentials = credentialsService.getCredentials();
            $scope.requestForCredentials.then(function (promise) {
                initialized = true;
                if (promise && promise.error) $scope.$broadcast("apiError", promise.error);
                else {
                    $scope.credentials = promise;
                }
            });
        }
    });

    $scope.$watch('userTypes', function () {
        $scope.refresh();
    }, true);
    $scope.$watch('userGroups', function () {
        $scope.refresh();
    }, true);
    $scope.$watch("userGroups", function () {
        $scope.userGroupsLoaded = function () {
            return userGroupsService.isLoaded();
        };
    });
    $scope.$watch("credentials", function () {
        $scope.credentialsLoaded = function () {
            return credentialsService.isLoaded()
        };
    });
    $scope.selectAll = function () {
        $scope.credentials.forEach(function (cred) {
            cred.selected = $scope.selectAllChecked;
        });
        if ($scope.selectAllChecked) $scope.selectedItems = $scope.credentials.length;
        else $scope.selectedItems = 0;
    };
    $scope.selectOne = function (cred) {
        cred.selected = !cred.selected;
        if (cred.selected){
            $scope.selectedItems ++;
        } else $scope.selectedItems --;
        $scope.selectAllChecked = $scope.selectedItems == $scope.credentials.length;
    };
    $scope.refresh = function () {
        if (initialized) {
            $scope.requestForCredentials.abort();
            $scope.requestForCredentials = credentialsService.getCredentials();
            $scope.requestForCredentials.then(function (promise) {
                if (promise && promise.error) $scope.$broadcast("apiError", promise.error);
                else {
                    $scope.credentials = promise;
                }
            });
        }
    };
    $scope.getExportHeader = function () {
        var header = [];
        $scope.exportFields.forEach(function (field) {
            if (field.selected) header.push(field.name);
        });
        header[0] = '#' + header[0];
        return header;
    };
    $scope.export = function () {
        if ($scope.credentials) {
            var exportData = [];
            $scope.credentials.forEach(function (credential) {
                var user = {};
                $scope.exportFields.forEach(function (field) {
                    if (field.selected) user[field.name] = credential[field.name];
                });
                exportData.push(user);
            });
            return exportData;
        }
    };
    $scope.deleteCredentials = function (ev) {
        var ids = [];
        var userNames = [];
        $scope.credentials.forEach(function (credential) {
            if (credential.selected) {
                ids.push(credential.id);
                userNames.push(credential.userName);
            }
        });
        if (ids.length == 1) {
            var confirm = $mdDialog.confirm()
                .title('Are you sure?')
                .textContent('Do you want to delete the account ' + userNames[0] + '?')
                .ariaLabel('Confirmation')
                .targetEvent(ev)
                .ok('Please do it!')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function () {
                credentialsService.setIsLoaded(false);
                var deleteCredentials = deleteUser.deleteCredentials(ids);
                deleteCredentials.then(function (promise) {
                    credentialsService.setIsLoaded(true);
                    if (promise && promise.error) $scope.$broadcast("apiWarning", promise.error);
                    else $scope.refresh();
                });
            })

        } else if (ids.length > 1) {
            var confirm = $mdDialog.confirm()
                .title('Are you sure?')
                .textContent('Do you want to delete these ' + ids.length + ' accounts?')
                .ariaLabel('Confirmation')
                .targetEvent(ev)
                .ok('Please do it!')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function () {
                credentialsService.setIsLoaded(false);
                var deleteCredentials = deleteUser.deleteCredentials(ids);
                deleteCredentials.then(function (promise) {
                    credentialsService.setIsLoaded(true);
                    if (promise && promise.error) $scope.$broadcast("apiWarning", promise.error);
                    else $scope.refresh();
                });
            })
        }
    };

    $scope.export = function () {
        var parentEl = angular.element(document.body);
        console.log($scope.exportFields);
        $mdDialog.show({
            parent: parentEl,
            templateUrl: 'views/modalExportContent.html',
            preserveScope: true,
            controller: function DialogController($scope, $mdDialog) {
                $scope.closeDialog = function () {
                    $mdDialog.hide();
                }
            }
        });
    }
});

identity.controller("NewCtrl", function ($scope, $rootScope, $location, userGroupsService, newUser, credentialsService) {
    var requestForUserGroups = null;
    var initialized = false;

    if (initialized) requestForUserGroups.abort();
    requestForUserGroups = userGroupsService.getUserGroups();
    requestForUserGroups.then(function (promise) {
        initialized = true;
        if (promise && promise.error) $scope.$broadcast("apiError", promise.error);
        else {
            $scope.userGroups = angular.copy(promise.userGroups);
        }
    });

    var masterBulk = {
        prefix: "",
        prefixIsNotValid: true,
        domain: "",
        domainIsNotValid: true,
        result: false,
        numberOfAccounts: 0,
        maxNumberOfAccounts: 1000
    };
    $scope.bulk = angular.copy(masterBulk);

    $scope.bulkResultHeaders = [];
    $scope.bulkResult = [];
    $scope.bulkError = [];
    var masterUser = newUser.getUser();

    $scope.userFields = newUser.getUserFieldsToDisplay();
    $scope.deliverMethod = newUser.getDeliverMethod();
    $scope.username = {
        name: false,
        email: true,
        phone: false
    };
    $scope.disableEmail = false;
    $scope.disablePhone = false;

    $scope.selectedUserGroup = function (id) {
        return $scope.user.groupId === id;
    };
    $scope.selectUserGroup = function (id) {
        if ($scope.user.groupId === id) $scope.user.groupId = 0;
        else $scope.user.groupId = id;
    };

    $scope.displayUserDetails = function (path) {
        //return !!((path === $location.path().toString().split("/")[2]) && $scope.user.groupId !== 0);
        return !!((path === $location.path().toString().split("/")[2]));
    };

    $scope.displayBulkResult = function () {
        return ($scope.bulk && $scope.bulk.result);
    };
    $scope.displayBulkError = function () {
        return $scope.bulkError.length > 0;
    };
    $scope.$watch("user.deliverMethod", function (newVal) {
        $scope.disableEmail = false;
        $scope.disablePhone = false;
        if (newVal.toString() === "EMAIL") {
            $scope.usernameField('email');
            $scope.username.email = true;
            $scope.disableEmail = true;
        } else if (newVal.toString() === "SMS") {
            $scope.usernameField('phone');
            $scope.username.phone = true;
            $scope.disablePhone = true;
        } else if (newVal.toString() === "EMAIL_AND_SMS") {
            $scope.usernameField('phone');
            $scope.username.email = true;
            $scope.username.phone = true;
            $scope.disableEmail = true;
            $scope.disablePhone = true;
        } else {
            $scope.deliverMethod = false;
        }
    });

    $scope.$watch("bulk.prefix", function () {
        var re = /^([0-9a-zA-Z_\-.]{2,})$/i;
        $scope.bulk.prefixIsNotValid = !(re.test($scope.bulk.prefix));
    });
    $scope.$watch("bulk.domain", function () {
        var re = /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/i;
        $scope.bulk.domainIsNotValid = !(re.test($scope.bulk.domain));
    });

    $scope.isNotValid = function (creationType) {
        if (creationType === "single") {
            if ($scope.user.deliverMethod == "EMAIL") return $scope.user.email == "";
            if ($scope.user.deliverMethod == "SMS") return $scope.user.phone == "";
            if ($scope.user.deliverMethod == "EMAIL_AND_SMS") return ($scope.user.email == "" && $scope.user.phone == "");
            else return ($scope.user.email == "" && $scope.user.phone == "");
        }
        else if (creationType === "bulk") {
            return (
            $scope.bulk.prefixIsNotValid ||
            $scope.bulk.domainIsNotValid);
        }
    };

    $scope.usernameField = function (field) {
        $scope.username[field] = true;
    };
    $scope.reset = function (creationType) {
        if (creationType === "single" || !creationType) {
            if ($scope.user && $scope.user.groupId > 0) {
                var groupId = $scope.user.groupId;
                $scope.user = angular.copy(masterUser);
                $scope.user.groupId = groupId;
            } else {
                $scope.user = angular.copy(masterUser);
            }
        } else if (creationType === 'bulk' || !creationType) {
            $scope.bulk = angular.copy(masterBulk);
        }
    };
    $scope.save = function (creationType) {
        if (creationType === "single") {
            newUser.saveUser($scope.user).then(function (promise) {
                if (promise && promise.error) {
                    $rootScope.$broadcast("apiWarning", promise.error);
                } else {
                    console.log(promise);
                    $rootScope.$broadcast('newSingle', promise);
                }
            });
        } else if (creationType === "bulk") {
            $scope.bulk.result = true;
            var requestForCredentials = credentialsService.getCredentials();
            requestForCredentials.then(function (promise) {
                if (promise && promise.error) $scope.$broadcast("apiError", promise.error);
                else {
                    var credentials = promise;
                    var createdAccountsInitiated = 0;
                    $scope.createdAccountsFinished = 0;
                    var currentAccount = 1;
                    var stringAccount = "";
                    var alreadyExists;
                    while (createdAccountsInitiated < $scope.bulk.numberOfAccounts) {
                        alreadyExists = false;
                        var fillingNumber = "";
                        for (var j = 5; j > currentAccount.toString().length; j--) {
                            fillingNumber += "0";
                        }
                        stringAccount = $scope.bulk.prefix + '_' + fillingNumber + currentAccount + '@' + $scope.bulk.domain;
                        credentials.forEach(function (credential) {
                            if (credential.userName === stringAccount) alreadyExists = true;
                        });
                        if (!alreadyExists) {
                            createdAccountsInitiated++;
                            newUser.saveUser({
                                groupId: $scope.user.groupId,
                                email: stringAccount,
                                policy: "GUEST",
                                'deliverMethod': 'NO_DELIVERY'
                            }).then(function (promise2) {
                                if (promise2 && promise2.error) {
                                    $scope.bulkError.push(promise2.error);
                                } else {
                                    if ($scope.bulkResultHeaders.length == 0) {
                                        for (var key in promise2) {
                                            $scope.bulkResultHeaders.push(key);
                                        }
                                    }
                                    $scope.bulkResult.push(promise2);
                                    $scope.createdAccountsFinished++;

                                }
                            });
                        }
                        currentAccount++;

                    }
                }
            });
        }
    };
    $scope.getBulkExportHeader = function () {
        return $scope.bulkResultHeaders;
    };
    $scope.bulkExport = function () {
        if ($scope.bulkResult) {
            return $scope.bulkResult;
        }
    };
    $scope.reset();
});


identity.filter("ssidStringFromArray", function () {
    return function (input) {
        if (!input || input.length === 0) return "";
        else {
            var string = "";
            input.forEach(function (ssid) {
                string += ssid + ", ";
            });
            string = string.trim().slice(0, -1);
            return string;
        }
    }
});
identity.filter("userType", function () {
    return function (input) {
        if (input === "CLOUD_PPSK") return "PPSK";
        else if (input === "CLOUD_RADIUS") return "RADIUS";
        else return "";
    }
});
identity.filter("deliverMethod", function () {
    return function (input) {
        var string = input.replace(/_/g, " ");
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
});

identity.directive("sub-create", function () {

});

identity.controller("HeaderCtrl", function ($scope, $location) {
    $scope.appDetails = {};

    $scope.nav = {};
    $scope.nav.isActive = function (path) {
        if (path === $location.path().toString().split("/")[1]) return true;
        else return false;
    };
    $scope.subnav = {};
    $scope.subnav.isActive = function (path) {
        if (path === $location.path().toString().split("/")[2]) return true;
        else return false;
    }
});
identity.directive('fileChange', ['$parse', function ($parse) {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function ($scope, element, attrs, ngModel) {
            var attrHandler = $parse(attrs['fileChange']);
            var handler = function (e) {
                $scope.$apply(function () {
                    attrHandler($scope, {$event: e, files: e.target.files});
                });
            };
            element[0].addEventListener('change', handler, false);
        }
    }
}]);
identity.controller("ImportCtrl", function ($scope, userGroupsService, newUser, credentialsService) {
    $scope.csvFile = [];
    $scope.csvHeader = [];
    $scope.csvRows = [];
    var masterImportUsers = {
        email: "",
        phone: "",
        organization: "",
        purpose: "",
        deliverMethod: "NO_DELIVERY",
        groupId: 0
    };
    $scope.importUsers = angular.copy(masterImportUsers);
    $scope.result = false;
    $scope.numberOfAccounts = 0;
    var csvFile = undefined;
    $scope.fields = undefined;


    $scope.bulkResultHeaders = [];
    $scope.bulkResult = [];
    $scope.bulkError = [];


    userGroupsService.getUserGroups().then(function (promise) {
        if (promise && promise.error) $scope.$broadcast("apiError", promise.error);
        else {
            $scope.userGroups = promise.userGroups;
        }
    });

    $scope.selectedUserGroup = function (id) {
        return $scope.importUsers.groupId === id;
    };
    $scope.selectUserGroup = function (id) {
        if ($scope.importUsers.groupId === id) $scope.user.groupId = 0;
        else $scope.importUsers.groupId = id;
    };

    $scope.handler = function (e, files) {
        var reader = new FileReader();
        reader.onload = function (e) {
            csvFile = reader.result;
            parseCsv();
        };
        reader.readAsText(files[0]);
    };

    $scope.$watch('delimiter', function () {
        parseCsv();
    }, true);

    function parseCsv() {
        $scope.csvRows = [];
        $scope.fields = [];
        $scope.csvHeader = [];
        if (csvFile) {
            var rows = csvFile.split('\n');
            var delimiter;
            if ($scope.delimiter) delimiter = $scope.delimiter;
            else delimiter = ",";

            $scope.numberOfAccounts = 0;
            rows.forEach(function (val) {
                if (val.indexOf("#") == 0) {
                    $scope.csvHeader = val.split(delimiter);
                    $scope.csvHeader[0] = $scope.csvHeader[0].replace("#", "");
                    if ($scope.fields.length == 0) {
                        $scope.fields = $scope.csvHeader;
                    }
                } else {
                    console.log($scope.csvHeader);
                    var o = val.split(delimiter);
                    $scope.csvRows.push(o);
                    $scope.numberOfAccounts++;
                    if ($scope.fields.length == 0) {
                        for (var i = 0; i < o.length; i++) {
                            $scope.csvHeader.push("Field " + i);
                            $scope.fields.push("Field " + i);
                        }
                        console.log($scope.csvHeader);
                    }
                }
            });
            $scope.$apply();
        }

    }

    $scope.reset = function () {
        $scope.importUsers = angular.copy(masterImportUsers);
    };
    $scope.isNotValid = function () {
        if ($scope.importUsers.email == "" && $scope.importUsers.phone == "") return true;
        if ($scope.importUsers.deliverMethod == "EMAIL" && $scope.importUsers.email == "") return true;
        else if ($scope.importUsers.deliverMethod == "SMS" && $scope.importUsers.phone == "") return true;
        else if ($scope.importUsers.deliverMethod == "EMAIL_AND_SMS" && ($scope.importUsers.email == "" || $scope.importUsers.phone == "")) return true;
        else return false;
    };
    $scope.create = function () {
        $scope.result = true;
        var requestForCredentials = credentialsService.getCredentials();
        requestForCredentials.then(function (promise) {
            if (promise && promise.error) $scope.$broadcast("apiError", promise.error);
            else {
                var user = {};
                var credentials = promise;
                var createdAccountsInitiated = 0;
                $scope.createdAccountsFinished = 0;
                var currentAccount = 1;
                var stringAccount = "";
                var alreadyExists;
                $scope.csvRows.forEach(function (row) {
                    alreadyExists = false;
                    user = {
                        email: "",
                        phone: "",
                        purpose: "",
                        organization: ""
                    };
                    user.email = row[$scope.importUsers.email];
                    user.phone = row[$scope.importUsers.phone];
                    user.purpose = row[$scope.importUsers.purpose];
                    user.organization = row[$scope.importUsers.organization];
                    console.log(user);
                    credentials.forEach(function (credential) {
                        if (credential.userName === user.email || credential.userName === user.phone) {
                            alreadyExists = true;
                            $scope.bulkError.push(credential.userName + " already exists");
                        }
                    });
                    if (!alreadyExists) {
                        createdAccountsInitiated++;
                        newUser.saveUser({
                            groupId: $scope.importUsers.groupId,
                            email: user.email,
                            phone: user.phone,
                            organization: user.organization,
                            visitPurpose: user.purpose,
                            policy: "GUEST",
                            'deliverMethod': $scope.importUsers.deliverMethod
                        }).then(function (promise2) {
                            if (promise2 && promise2.error) {
                                $scope.bulkError.push(promise2.error);
                            } else {
                                if ($scope.bulkResultHeaders.length == 0) {
                                    for (var key in promise2) {
                                        $scope.bulkResultHeaders.push(key);
                                    }
                                }
                                $scope.bulkResult.push(promise2);
                                $scope.createdAccountsFinished++;

                            }
                        });
                    }
                    currentAccount++;

                });
            }
        });
    };
    $scope.displayResult = function () {
        return $scope.result;
    };
    $scope.displayBulkError = function () {
        return $scope.bulkError.length > 0;
    };
    $scope.getBulkExportHeader = function () {
        return $scope.bulkResultHeaders;
    };
    $scope.bulkExport = function () {
        if ($scope.bulkResult) {
            return $scope.bulkResult;
        }
    };
});


identity.controller("MonitorCtrl", function ($scope, monitorService, userGroupsService, userTypesService) {
    $scope.requestForMonitor = null;
    var requestForUserGroups = null;
    var initialized = false;
    var devices = [];
    $scope.devices = [];
    $scope.userTypes = userTypesService.getUserTypes();

    // pagination var
    $scope.itemsByPage = 10;
    $scope.currentPage = 1;

    // filter only on connected user by default
    $scope.connected = true;
    $scope.notConnected = false;


    $scope.removeFilter = function () {
        $scope.filter.show = false;
        $scope.query.filter = '';

        if($scope.filter.form.$dirty) {
            $scope.filter.form.$setPristine();
        }
    };

    if (requestForUserGroups) requestForUserGroups.abort();
    requestForUserGroups = userGroupsService.getUserGroups();
    requestForUserGroups.then(function (promise) {
        if (promise && promise.error) {
            console.log(promise);
            $scope.$broadcast("apiError", promise.error);
        }
        else {
            $scope.userGroups = promise.userGroups;
            $scope.requestForMonitor = monitorService.getDevices();
            $scope.requestForMonitor.then(function (promise) {
                initialized = true;
                if (promise && promise.error) $scope.$broadcast("apiError", promise.error);
                else {
                    devices = promise;
                    filterConnectionState();
                }
            });
        }
    });

    function filterConnectionState() {
        if (devices){
            if ($scope.connected == false && $scope.notConnected == false) {
                $scope.devices = angular.copy(devices);
            } else {
                $scope.devices = [];
                if ($scope.connected == true) {
                    devices.forEach(function (device) {
                        if (device.clients.length > 0) {
                            $scope.devices.push(device);
                        }
                    })
                }
                if ($scope.notConnected == true) {
                    devices.forEach(function (device) {
                        if (device.clients.length == 0) {
                            $scope.devices.push(device);
                        }
                    })
                }
            }
        }

    }

    $scope.page = function (num) {
        $scope.itemsByPage = num;
    };
    $scope.isCurPage = function (num) {
        return num === $scope.itemsByPage;
    };

    $scope.$watch('userTypes', function () {
        $scope.refresh();
    }, true);
    $scope.$watch('userGroups', function () {
        $scope.refresh();
    }, true);
    $scope.$watch("userGroups", function () {
        $scope.userGroupsLoaded = function () {
            return userGroupsService.isLoaded();
        };
    });
    $scope.$watch("connected", function () {
        filterConnectionState();
    });
    $scope.$watch("notConnected", function () {
        filterConnectionState();
    });
    $scope.$watch("devices", function () {
        $scope.monitorLoaded = function () {
            return monitorService.isLoaded()
        };
    });
    $scope.refresh = function () {
        if (initialized) {
            $scope.requestForMonitor.abort();
            $scope.requestForMonitor = monitorService.getDevices();
            $scope.requestForMonitor.then(function (promise) {
                if (promise && promise.error) $scope.$broadcast("apiError", promise.error);
                else {
                    devices = promise;
                    filterConnectionState();
                }
            });
        }
    };
    $scope.userString = function (user) {
        if (user.clients.length == 0) return user.userName + " is currently not connected.";
        else return user.userName + " is currently connected.";
    };
    $scope.userColor = function (user) {
        if (user.clients.length == 0) return "color: #aca5a3";
        else return "color: #75D064";
    };
    $scope.clientString = function (client) {
        return '<div style="text-align: left">' + client.hostName + " is currently connected <br>" +
            "Health: " + client.clientHealth + '<br>' +
            'Application Health: <span class="' + $scope.clientStringColorClass(client.applicationHealth) + '">' + client.applicationHealth + '</span><br>' +
            'Network Health: <span class="' + $scope.clientStringColorClass(client.networkHealth) + '">' + client.networkHealth + '</span><br>' +
            'Radio Health: <span class="' + $scope.clientStringColorClass(client.radioHealth) + '">' + client.radioHealth + '</span>' +
            '</div>';
    };
    $scope.clientStringColorClass = function (score) {
        if (score == 100) return "green";
        else if (score >= 50) return "yellow";
        else return "red";
    };
    $scope.clientColor = function (healthScore) {
        if (healthScore == 100) return "color: #75D064";
        else if (healthScore >= 50) return "color: #FFCF5C";
        else return "color: #d04d49";
    };
    $scope.showClients = function (user) {
        if (user.showClients == true) user.showClients = false;
        else if (user.clients.length > 0)user.showClients = true;
    };
    $scope.clientsLink = function (user) {
        if (user.clients.length > 0) return "color: #0093D1;text-decoration: underline;";
        else return "";
    }
});


identity.controller('ModalCtrl', function ($scope, $uibModal) {
    $scope.animationsEnabled = true;
    $scope.$on('apiError', function (event, apiError) {
        console.log("test");
        $scope.apiErrorStatus = apiError.status;
        $scope.apiErrorMessage = apiError.message;
        $scope.apiErrorCode = apiError.code;
        var modalTemplateUrl = 'views/modalErrorContent.html';
        displayModel(modalTemplateUrl);

    });
    $scope.$on('apiWarning', function (event, apiWarning) {
        $scope.apiErrorStatus = apiWarning.status;
        $scope.apiErrorMessage = apiWarning.message;
        $scope.apiErrorCode = apiWarning.code;
        var modalTemplateUrl = 'views/modalWarningContent.html';
        displayModel(modalTemplateUrl);

    });
    $scope.$on('newSingle', function (event, account) {
        $scope.loginName = account.loginName;
        $scope.password = account.password;
        $scope.ssid = account.ssid;
        $scope.startTime = account.startTime;
        $scope.endTime = account.endTime;
        $scope.authType = account.authType;
        var modalTemplateUrl = 'views/modalSingleContent.html';
        displayModel(modalTemplateUrl);

    });

    $scope.open = function (template, size) {
        var modalTemplateUrl = "";
        switch (template) {
            case 'about':
                modalTemplateUrl = 'modalAboutContent.html';
                break;
            case 'export':
                modalTemplateUrl = 'views/modalExportContent.html';
                break;
            case 'exportBulk':
                modalTemplateUrl = 'views/modalBulkContent.html';
                break;
        }
        displayModel(modalTemplateUrl, size);

    };
    function displayModel(modalTemplateUrl, size) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: modalTemplateUrl,
            controller: 'ModalInstanceCtrl',
            scope: $scope,
            size: size
        });
    }

});

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

identity.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance) {

    $scope.close = function () {
        $uibModalInstance.close('close');

    };
});

