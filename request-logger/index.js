const express = require('express');
const bodyParser = require('body-parser');

let latency = process.env['LATENCY'];
if (!latency) {
    console.log("LATENCY env var is not defined or it is 0, going to response the requests immediately");
    latency = 0;
}

const app = express();

app.use(bodyParser.raw({
    inflate: true, limit: '1000kb', type: function (req) {
        return true
    }
}));

app.all('*', function (req, res) {
    console.log("=======================");
    console.log("Request headers:");
    console.log(req.headers)
    console.log("\nRequest body - raw:");
    console.log(req.body)
    console.log("\nRequest body - to string:");
    console.log(String(req.body))
    console.log("=======================\n");

    console.log("SLEEP " + latency + " ms");

    setTimeout(function () {
        res.status(202).send('');
    }, latency);
});


app.listen(8080, () => {
    console.log('https://github.com/aliok/request-logger');
    console.log('App listening on :8080');
});


registerGracefulExit();

function registerGracefulExit() {
    let logExit = function () {
        console.log("Exiting");
        process.exit();
    };

    // handle graceful exit
    //do something when app is closing
    process.on('exit', logExit);
    //catches ctrl+c event
    process.on('SIGINT', logExit);
    process.on('SIGTERM', logExit);
    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', logExit);
    process.on('SIGUSR2', logExit);
}
