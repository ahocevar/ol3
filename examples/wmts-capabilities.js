import WMTSCapabilities from 'ol/format/WMTSCapabilities';

const parser = new WMTSCapabilities();

fetch('data/WMTSCapabilities.xml').then(function(response) {
  return response.text();
}).then(function(text) {
  const result = parser.read(text);
  document.getElementById('log').innerText = JSON.stringify(result, null, 2);
});
