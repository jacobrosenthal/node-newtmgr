#! /usr/bin/env node
var argv = require('yargs').argv;
var utility = require('./').utility;

var exit = function(err, obj){
  if(err){
    console.log(err.toString());
  }

  if (obj){
    utility.prettyList(obj);
    utility.prettyError(obj);
    console.log(JSON.stringify(obj, null, '\t'));
  }

  process.exit(1);
};

var go = function(err, emitter, transport){

  if(argv.hasOwnProperty("stat")){
    console.log("sending stat command");
    if(typeof argv.stat === 'boolean'){
      transport.stat(emitter, 5000, exit);
    }else{
      transport.stat(emitter, argv.stat, 5000, exit);
    }
  }else if(argv.hasOwnProperty("taskstats")){
    console.log("sending taskstats command");
    transport.taskstats(emitter, 5000, exit);
  }
  else if(argv.hasOwnProperty("mpstats")){
    console.log("sending mpstats command");
    transport.mpstats(emitter, 5000, exit);
  }else if(argv.hasOwnProperty("log_list")){
    console.log("sending log_list command");
    transport.log.list(emitter, 5000, exit);
  }else if(argv.hasOwnProperty("log_module_list")){
    console.log("sending log_module_list command");
    transport.log.moduleList(emitter, 5000, exit);
  }else if(argv.hasOwnProperty("log_level_list")){
    console.log("sending log_level_list command");    
    transport.log.levelList(emitter, 5000, exit);
  }else if(argv.hasOwnProperty("log_clear")){
    console.log("sending log_clear command");    
    transport.log.clear(emitter, 5000, exit);
  }else if(argv.hasOwnProperty("log_show")){
    console.log("sending log_show command");    
    if(typeof argv.stat === 'boolean'){
      transport.log.show(emitter, 5000, exit);
    }else{
      transport.log.show(emitter, argv.log_show, 5000, exit);
    }

  }else if(argv.hasOwnProperty("echo")){
    console.log("sending echo command");    
    transport.echo(emitter, argv.echo, 5000, exit);
  }else if(argv.hasOwnProperty("reset")){
    console.log("sending reset command");    
    transport.reset(emitter, 5000, exit);
  }else if(argv.hasOwnProperty("image_erase")){
    console.log("sending erase command");
    transport.image.erase(emitter, 5000, exit);
  }else if(argv.hasOwnProperty("image_confirm")){
    console.log("sending image_confirm command");    
    var confirmHashBuffer = Buffer.from(argv.image_confirm, "hex");
    transport.image.confirm(emitter, confirmHashBuffer, 5000, exit);
  }else if(argv.hasOwnProperty("image_list")){
    console.log("sending image_list command");    
    transport.image.list(emitter, 5000, exit);
  }else if(argv.hasOwnProperty("image_corelist")){
    console.log("sending image_corelist command");    
    transport.image.corelist(emitter, 5000, exit);
  }else if(argv.hasOwnProperty("image_test")){
    console.log("sending image_test command");    
    var testHashBuffer = Buffer.from(argv.image_test, "hex");
    console.log(testHashBuffer);
    transport.image.test(emitter, testHashBuffer, 5000, exit);
  }else if(argv.hasOwnProperty("image_upload")){
    var fs = require('fs');
    var fileBuffer = fs.readFileSync(argv.image_upload);
    console.log("sending image_upload command", fileBuffer.length, "bytes");    

    var status = transport.image.upload(emitter, fileBuffer, 30000, exit);
    //todo, note were not removing this listener, but were likely exiting so probably fine
    status.on('status', function(obj){
      console.log(utility.prettyError(obj));
    });
  }else{
    exit(new Error("command not found"));
  }
};

if(argv.hasOwnProperty("serial")){
  var SerialPort = require("serialport").SerialPort;
  var serial = require('./').transport.serial;

  console.log("opening serial port");
  var port = new SerialPort(argv.serial, { baudRate: 115200 }, function(){
    console.log("found port");
    go(null, port, serial);
  });

  port.once('error', exit);
  port.once('close', exit);

}else if(argv.hasOwnProperty("ble")){
  var noble = require('noble');
  var ble = require('./').transport.ble;

  var options = {
    services: ['8d53dc1d1db74cd3868b8a527460aa84'],
    characteristics: ['da2e7828fbce4e01ae9e261174997c48'],
    name: argv.ble
  };

  var onStateChange = function (state) {
    if (state === 'poweredOn') {
      console.log("scanning for ble device", argv.ble);
      ble.scanAndConnect(noble, options, function(err, peripheral, characteristic){
        console.log("found characteristic");
        peripheral.once('disconnect', exit);
        go(null, characteristic, ble);
      });
    }
  };
  noble.once('stateChange', onStateChange);
}else{
  exit(new Error("no transport selected, try --ble=name or --serial=/dev/tty/usbxxxx"));
}
