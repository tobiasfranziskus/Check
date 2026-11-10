/* W5y: exactly one Rule17 session into W5w reusable UI; no W2 or W1 world active. */
(function(scope){
 'use strict';
 if(!scope.W5ySession||!scope.W5yOriginal)throw Error('Original-W3-Core fehlt');
 if(scope.W5yOriginal.rules.rulesVersion!==17||scope.W5yOriginal.rules.schema!==8)
  throw Error('Nur geprüfter W3-Regel17-Kern');
 scope.W5wSession=scope.W5ySession;
 scope.W5wOriginal=scope.W5yOriginal;
})(globalThis);
