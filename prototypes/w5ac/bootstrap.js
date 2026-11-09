/* W5ac: one Rule191 core; older W1-W5 panels are read-only views of this same state. */
(function(scope){
 'use strict';
 if(!scope.W5acSession||!scope.W5acOriginal)throw Error('Regel191-Core fehlt');
 if(scope.W5acOriginal.rules.rulesVersion!==191||scope.W5acOriginal.rules.schema!==8)
  throw Error('Nur isolierter W5ac-Regel191-Core');
 scope.W5wSession=scope.W5acSession;
 scope.W5wOriginal=scope.W5acOriginal;
 scope.W5yOriginal=scope.W5acOriginal;
 scope.W5aaOriginal=scope.W5acOriginal;
 scope.W5abOriginal=scope.W5acOriginal;
})(globalThis);
