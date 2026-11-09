/* W5x: bootstrap only one Rule16 session into the reusable W5w UI shell. */
(function(scope){
 'use strict';
 if(!scope.W5xSession||!scope.W5xOriginal)throw Error('W2 Original-Core oder W2-Sitzung fehlt');
 if(scope.W5xOriginal.rules.rulesVersion!==16||scope.W5xOriginal.rules.schema!==8)throw Error('Nur geprüfter Regel16-Kern');
 scope.W5wSession=scope.W5xSession;
 scope.W5wOriginal=scope.W5xOriginal;
})(globalThis);
