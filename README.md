# request-progress-ex

 some context parameters and support ts

Tracks the download progress of a request made with [request](https://github.com/mikeal/request), giving insight of various metrics including progress percentage, download speed and time remaining.


## Installation

`$ npm install request-progress-ex`


## Usage

```js
var fs = require('fs');
var request = require('request');
var progress = require('request-progress');

// The options argument is optional so you can omit it
progress(request('https://az412801.vo.msecnd.net/vhd/VMBuild_20141027/VirtualBox/IE11/Windows/IE11.Win8.1.For.Windows.VirtualBox.zip'), {
    // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
    // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
    // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length,
    // bRetainData : true                 // Whether retain Data on the progress event of previous revice data, defaults is false
})
.on('response', function()
{
    
})
.on('progress', function (state) {
    // The state is an object that looks like this:
    // {
    //     percent: 0.5,               // Overall percent (between 0 to 1)
    //     speed: 554732,              // The download speed in bytes/sec
    //     size: {
    //         total: 90044871,        // The total payload size in bytes
    //         transferred: 27610959   // The transferred payload size in bytes
    //         previousTransfer: 654732// The previousTransfer record receive data size  while previous 'progress' event in bytes
    //     },
    //     time: {
    //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
    //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
    //     },
    //     data: []                    // the data retain Data while previous 'progress' event  if bRetainData is true
    // }
    console.log('progress', state);
})
.on('error', function (err) {
    // Do something with err
})
.on('end', function () {
    // Do something after request finishes
})
.on('complete', function ()
{
    //
})
.pipe(fs.createWriteStream('IE11.Win8.1.For.Windows.VirtualBox.zip'));
```

If the request's response does not include the `content-length` header, the values of some metrics will be `null`.
Also `speed` and `time.remaining` will be `null` until it can be calculated.

The `state` object emitted in the `progress` event is reused to avoid creating a new object for each event.   
If you wish to peek the `state` object at any time, it is available in `request.progressState`.


## Tests

`$ npm test`   
`$ npm test-cov` to get coverage report


## License

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
