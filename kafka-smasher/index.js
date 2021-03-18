const kafka = require('kafka-node');

registerGracefulExit();

const kafkaHost = process.env['KAFKA_HOST'];
if (!kafkaHost) {
    console.log("KAFKA_HOST env var is not defined");
    process.exit();
}

const kafkaTopic = process.env['KAFKA_TOPIC'];
if (!kafkaTopic) {
    console.log("KAFKA_TOPIC env var is not defined");
    process.exit();
}

const messageCount = process.env['MESSAGE_COUNT'];
if (!messageCount) {
    console.log("MESSAGE_COUNT env var is not defined");
    process.exit();
}

let messageFrequency = process.env['MESSAGE_FREQUENCY'];
if (!messageFrequency) {
    console.log("MESSAGE_FREQUENCY env var is not defined or it is 0, going to send all messages at once");
    messageFrequency = 0;
}

console.log("Creating Kafka client");
const client = new kafka.KafkaClient({
    kafkaHost: kafkaHost
});

console.log("Creating producer");
const producer = new kafka.HighLevelProducer(client, {
    requireAcks: 0,     // disabled to send many messages at once
});

producer.on('error', function (err) {
    console.log("Producer error");
    console.log(err);
    process.exit();
});

producer.on('ready', function (err) {
    if (err) {
        console.error('Error waiting for producer to be ready', err);
    } else {
        console.log('Producer ready');
        startSendingMessages();
    }
});

function startSendingMessages() {
    console.log("Gonna send " + messageCount + " messages with an interval of " + messageFrequency + " ms")

    let i = 0;
    let interval = setInterval(function () {
        sendMessage(++i);
        if (i >= messageCount) {
            clearInterval(interval);
        }
    }, messageFrequency);
}

function sendMessage(i) {
    console.log("Sending message " + i + "/" + messageCount);

    producer.send([{
        topic: kafkaTopic,
        messages: 'Smasher ' + i
    }], function (err) {
        if (err) {
            console.log('Error sending message ' + i);
            console.log(err);
        }
    });
}

function registerGracefulExit() {
    process.on('uncaughtException', function (err) {
        console.log(err);
    });

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
