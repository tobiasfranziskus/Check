/* W5ab: one original Rule19 session; existing W1-W4 UIs reuse it read-only. */
(function(scope){
 'use strict';
 if(!scope.W5abSession||!scope.W5abOriginal)throw Error('Original-W5-Core fehlt');
 if(scope.W5abOriginal.rules.rulesVersion!==19||scope.W5abOriginal.rules.schema!==8)
  throw Error('Nur gepruefter Original-W5-Regel19-Kern');
 scope.W5wSession=scope.W5abSession;
 scope.W5wOriginal=scope.W5abOriginal;
 scope.W5yOriginal=scope.W5abOriginal;
 scope.W5aaOriginal=scope.W5abOriginal;
})(globalThis);
