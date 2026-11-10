'use strict';
const pilotPreview = LegacyPilot.mount(document.getElementById('pilot-root'), LegacyPilotExamples[0]);
document.getElementById('pilot-choice').addEventListener('change', event => {
  pilotPreview.update(LegacyPilotExamples[Number(event.target.value)]);
});
