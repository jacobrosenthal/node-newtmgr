# nnewtmgr - the unofficial apache mynewt newtmgr

Work in progress. Current transports include serial and ble. Current commands include:
* echo
* reset
* stat
* log_list
* log_module_list
* log_level_list
* log_clear
* log_show
* image_confirm
* image_list
* image_corelist
* image_test
* image_upload

## Install
Install globally with:
```
npm i -g nnewtmgr
```

# Use

echo (1 enable or 0 disable)
```
nnewtmgr --echo=1 --serial=/dev/tty.usbmodem1411
```

reset
```
nnewtmgr --reset --serial=/dev/tty.usbmodem1411
```

stat list (no argument for list, or specify one to read)
```
nnewtmgr --stat=ble_phy --serial=/dev/tty.usbmodem1411
```

log_list
```
nnewtmgr --log_list --serial=/dev/tty.usbmodem1411
```

log_module_list
```
nnewtmgr --log_module_list --serial=/dev/tty.usbmodem1411
```

log_level_list
```
nnewtmgr --log_level_list --serial=/dev/tty.usbmodem1411
```

log_clear
```
nnewtmgr --log_clear --serial=/dev/tty.usbmodem1411
```

log_show (specify the log to read)
```
nnewtmgr --log_show=reboot_log --serial=/dev/tty.usbmodem1411
```

image_confirm (optionally pass the hash to confirm)
```
nnewtmgr --image_confirm --ble=nimble-bleprph
```

image_list
```
nnewtmgr --image_list --serial=/dev/tty.usbmodem1411
```

image_corelist
```
nnewtmgr --image_corelist --serial=/dev/tty.usbmodem1411
```

image_test (pass the hash to confirm)
```
nnewtmgr --image_test=13c1383f1f020d496b29e2660319c6ca0fd97b5a6e24342fb69b5fb5917ab61a --ble=nimble-bleprph
```

image_upload (pass the file to upload)
```
nnewtmgr --image_upload=blesplit.img --serial=/dev/tty.usbmodem1411
```

# Troubleshooting
Turn on some debug:
```
DEBUG=serialport*,newtmgr* nnewtmgr --list --serial=/dev/tty.usbmodem1411

```
