// var transports = {
//  serial: require('serial')
// };
// var Transport = transports[process.argv.SomehowGet('--transport')];

var nmgr = require('./nmgr');
var Transport = require('./serial');

var transport = new Transport();

if (process.argv.indexOf('--reset') !== -1) {
  nmgr.reset(transport, function(err, data){
    console.log("nmgr.reset", err, data);
    transport.close();
    process.exit(0);
  });
}

