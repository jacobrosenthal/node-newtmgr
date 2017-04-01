# nnewtmgr - the unofficial apache mynewt newtmgr

Work in progress. Current transports include serial and ble. Current commands include list, test, confirm, reset.


## Install
Install globally with:
```
npm i -g nnewtmgr
```

# Use
list
```
nnewtmgr --list --serial=/dev/tty.usbmodem1411

```

reset
```
nnewtmgr --reset --serial=/dev/tty.usbmodem1411

```

test
```
nnewtmgr --test --ble=nimble-bleprph --hash=13c1383f1f020d496b29e2660319c6ca0fd97b5a6e24342fb69b5fb5917ab61a
```

confirm
```
nnewtmgr --confirm --ble=nimble-bleprph
```

# Troubleshooting
Turn on some debug:
```
DEBUG=serialport*,newtmgr* nnewtmgr --list --serial=/dev/tty.usbmodem1411

```
