/* W5aa: one Rule18 original core, exposed through the established W5w/W5y UI; no Rule17 world coexists. */
(function(scope){
 'use strict';
 if(!scope.W5aaSession||!scope.W5aaOriginal)throw Error('Original-W4-Core fehlt');
 if(scope.W5aaOriginal.rules.rulesVersion!==18||scope.W5aaOriginal.rules.schema!==8)
  throw Error('Nur gepruefter W4-Regel18-Kern');
 scope.W5wSession=scope.W5aaSession;
 scope.W5wOriginal=scope.W5aaOriginal;
 scope.W5yOriginal=scope.W5aaOriginal; // Reuse W3 freight displays, no second W3 session.
})(globalThis);
