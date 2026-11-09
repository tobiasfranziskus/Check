/* One existing session shell and one Rule195 engine, no parallel simulation. */
(function(scope){
 const engine=scope.W5acOriginal.createPrivateWageResearch({carrierCash:2000,buyerCash:4000});
 scope.W5wSession=Object.freeze({create:seed=>scope.W5acSession.create(seed,'private195')});
 for(const key of ['W5wOriginal','W5yOriginal','W5aaOriginal','W5abOriginal'])scope[key]=engine;
})(globalThis);
