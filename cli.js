#! /usr/bin/env node
var argv = require('yargs').argv;
var utility = require('./').utility;
var util = require('util');
var noble = require('noble');

var exit = function(err){
  console.log("disconnected", err);
  process.exit(101);
};

var go = function(err, emitter, transport){

  if(argv.hasOwnProperty("stat")){
    console.log("sending stat command");
    if(typeof argv.stat === 'boolean'){
      transport.stat(emitter, function(err, obj){
        console.log(utility.prettyError(obj));
        process.exit(obj.rc);
      });
    }else{
      transport.stat(emitter, argv.stat, function(err, obj){
        console.log(utility.prettyError(obj));
        process.exit(obj.rc);
      });
    }
  }else if(argv.hasOwnProperty("taskstats")){
    console.log("sending taskstats command");
    transport.taskstats(emitter, function(err, obj){
      console.log(utility.prettyError(obj));
      process.exit(obj.rc);
    });
  }
  else if(argv.hasOwnProperty("mpstats")){
    console.log("sending mpstats command");
    transport.mpstats(emitter, function(err, obj){
      console.log(utility.prettyError(obj));
      process.exit(obj.rc);
    });
  }else if(argv.hasOwnProperty("log_list")){
    console.log("sending log_list command");
    transport.log.list(emitter, function(err, obj){
      console.log(utility.prettyError(obj));
      process.exit(obj.rc);
    });
  }else if(argv.hasOwnProperty("log_module_list")){
    console.log("sending log_module_list command");
    transport.log.moduleList(emitter, function(err, obj){
      console.log(utility.prettyError(obj));
      process.exit(obj.rc);
    });
  }else if(argv.hasOwnProperty("log_level_list")){
    console.log("sending log_level_list command");    
    transport.log.levelList(emitter, function(err, obj){
      console.log(utility.prettyError(obj));
      process.exit(obj.rc);
    });
  }else if(argv.hasOwnProperty("log_clear")){
    console.log("sending log_clear command");    
    transport.log.clear(emitter, function(err, obj){
      console.log(utility.prettyError(obj));
      process.exit(obj.rc);
    });
  }else if(argv.hasOwnProperty("log_show")){
    console.log("sending log_show command");    
    if(typeof argv.stat === 'boolean'){
      transport.log.show(emitter, function(err, obj){
        console.log(JSON.stringify(utility.prettyError(obj), null, '\t'));
        process.exit(obj.rc);
      });
    }else{
      transport.log.show(emitter, argv.log_show, function(err, obj){
        console.log(JSON.stringify(utility.prettyError(obj), null, '\t'));
        process.exit(obj.rc);
      });
    }

  }else if(argv.hasOwnProperty("echo")){
    console.log("sending echo command");    
    transport.echo(emitter, argv.echo, function(err, obj){
      console.log(utility.prettyError(obj));
      process.exit(obj.rc);
    });
  }else if(argv.hasOwnProperty("reset")){
    console.log("sending reset command");    
    transport.reset(emitter, function(err, obj){
      console.log(utility.prettyError(obj));
      process.exit(obj.rc);
    });
  }else if(argv.hasOwnProperty("image_confirm")){
    console.log("sending image_confirm command");    
    var confirmHashBuffer = Buffer.from(argv.image_confirm, "hex");
    transport.image.confirm(emitter, confirmHashBuffer, function(err, obj){
      console.log(utility.prettyError(obj));
      process.exit(obj.rc);
    });
  }else if(argv.hasOwnProperty("image_list")){
    console.log("sending image_list command");    
    transport.image.list(emitter, function(err, obj){
      console.log(utility.prettyList(obj)); //turn hash buffers into string
      process.exit(0); //image_list doesnt have an rc??
    });
  }else if(argv.hasOwnProperty("image_corelist")){
    console.log("sending image_corelist command");    
    transport.image.corelist(emitter, function(err, obj){
      console.log(utility.prettyError(obj));
      process.exit(obj.rc);
    });
  }else if(argv.hasOwnProperty("image_test")){
    console.log("sending image_test command");    
    var testHashBuffer = Buffer.from(argv.image_test, "hex");
    console.log(testHashBuffer);
    transport.image.test(emitter, testHashBuffer, function(err, obj){
      if(err){
        console.log(utility.prettyError(obj));
        return process.exit(obj.rc);
      }

      //successful image_list doesnt have an rc??
      console.log(utility.prettyList(obj));
      process.exit(0);
    });
  }else if(argv.hasOwnProperty("image_upload")){
    var fs = require('fs');
    var fileBuffer = fs.readFileSync(argv.image_upload);
    console.log("sending image_upload command", fileBuffer.length, "bytes");    

    var status = transport.image.upload(emitter, fileBuffer, function(err, obj){
      console.log(utility.prettyError(obj));
      process.exit(obj.rc);
    });
    status.on('status', function(obj){
      console.log(utility.prettyError(obj));
    });
  }else{
    console.log("command not found");
    process.exit(100);
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
  console.log("no transport selected, try --ble=name or --serial=/dev/tty/usbxxxx")
  process.exit(1);
}
