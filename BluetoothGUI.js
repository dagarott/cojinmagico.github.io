/*  
 * Bluetooth Test - Processing Side (In Chrome)
 * Arduino to HM10 module to Google Chrome
 * https://www.amazon.com/gp/product/B06WGZB2N4/ref=ppx_yo_dt_b_asin_title_o01_s00?ie=UTF8&psc=1
 * 
 * p5.ble.js
 https://yining1023.github.io/p5ble-website/
 
 * kevin darrah
 * 
 * Twitter: https://twitter.com/KDcircuits
 * For inquiries or design services:
 * https://www.kdcircuits.com
 * 
 * License?  Do whatever you want with this code - it's just a sample
 */

//globals
const serviceUuid = "0000ffe0-0000-1000-8000-00805f9b34fb";
let blueToothCharacteristic; //this is a blu
let receivedValue = "";

let blueTooth;
let isConnected = false;


var millisecondTimerStart;
var oldColorPickerValue;

let DataRx = "";
let isDataReceived = false;
let BtDataToJSON = "";

var w = window.innerWidth;
var h = window.innerHeight;

function connectToBle() {
    // Connect to a device by passing the service UUID
    blueTooth.connect(serviceUuid, gotCharacteristics);
}

function DisconnectToBle() {
    // Connect to a device by passing the service UUID
    blueTooth.disconnect();
    // Check if myBLE is connected
    isConnected = blueTooth.isConnected();
    console.log('Device got disconnected?:');
    if (isConnected == false)
        console.log("Yes");
}


// A function that will be called once got characteristics
function gotCharacteristics(error, characteristics) {
    if (error) {
        console.log('error: ', error);
    }
    console.log('characteristics: ', characteristics);
    blueToothCharacteristic = characteristics[0];

    blueTooth.startNotifications(blueToothCharacteristic, gotValue, 'string');

    isConnected = blueTooth.isConnected();
    // Add a event handler when the device is disconnected
    //blueTooth.onDisconnected(onDisconnected);
}


// A function that will be called once got values
function gotValue(value) {
    //console.log(value);
    DataRx += value;
    if (DataRx.indexOf('&') > -1) {
        isDataReceived = true;
        console.log("Data Received");
    } else
        isDataReceived = false;
}


function onDisconnected() {

    isConnected = false;
}


function sendData(command) {
    const inputValue = command;
    if (!("TextEncoder" in window)) {
        console.log("Sorry, this browser does not support TextEncoder...");
    }
    var enc = new TextEncoder(); // always utf-8
    blueToothCharacteristic.writeValue(enc.encode(inputValue));
}

function drawScreen() {
    textSize(18);
    //background(10, 10, 10);
    // if (oldColorPickerValue != ledColorPicker.value() && millis() - millisecondTimerStart > 50 && isConnected) {
    //     oldColorPickerValue = ledColorPicker.value();
    //     sendData("LED Color" + ledColorPicker.value() + "\n");
    //     millisecondTimerStart = millis();
    // }

}

function setup() {

    canvas = createCanvas(w, h);
    textSize(20);
    textAlign(CENTER, CENTER);


    // Create a p5ble class
    console.log("setting up");
    blueTooth = new p5ble();

    const connectButton = createButton('Connect');
    connectButton.mousePressed(connectToBle);
    connectButton.style("font-family", "Comic Sans MS");
    connectButton.style("background-color", "#0f0");
    connectButton.style("color", "#000");
    connectButton.size(150, 30);
    connectButton.position(15, 15);

    const DisconnectButton = createButton('Disconnect');
    DisconnectButton.mousePressed(DisconnectToBle);
    DisconnectButton.style("font-family", "Comic Sans MS");
    DisconnectButton.style("background-color", "#f00");
    DisconnectButton.style("color", "#000");
    DisconnectButton.size(150, 30);
    DisconnectButton.position(connectButton.x + connectButton.width + 80, 15);

    // const ExitButton = createButton('Exit');
    // //ExitButton.mousePressed(DisconnectToBle);
    // ExitButton.size(100);
    // ExitButton.position(300, 15);

    const Sensor1Button = createButton('SENSOR 1');
    //Sensor1Button.mousePressed(DisconnectToBle);
    Sensor1Button.position(15, 100);
    Sensor1Button.size(150, 150);
    Sensor1Button.style("font-family", "Comic Sans MS");
    Sensor1Button.style("background-color", "#ff0");
    Sensor1Button.style("color", "#000");
    // const Sensor2Button = createButton('SENSOR 2');
    // //Sensor2Button.mousePressed(DisconnectToBle);
    // Sensor2Button.position(15, 150);
    // Sensor2Button.size(150);
    const Sensor3Button = createButton('SENSOR 3');
    //Sensor3Button.mousePressed(DisconnectToBle);
    Sensor3Button.position(15, Sensor1Button.height + 150);
    Sensor3Button.size(150, 150);
    Sensor3Button.style("font-family", "Comic Sans MS");
    Sensor3Button.style("background-color", "#269");
    Sensor3Button.style("color", "#000");

    // const Sensor4Button = createButton('SENSOR 1');
    // //Sensor1Button.mousePressed(DisconnectToBle);
    // Sensor4Button.position(245, 100);
    // Sensor4Button.size(150);
    const Sensor5Button = createButton('SENSOR 5');
    //Sensor2Button.mousePressed(DisconnectToBle);
    Sensor5Button.position(15, Sensor3Button.height + 350);
    Sensor5Button.size(150, 150);
    Sensor5Button.style("font-family", "Comic Sans MS");
    Sensor5Button.style("background-color", "#269");
    Sensor5Button.style("color", "#000");
    // const Sensor6Button = createButton('SENSOR 3');
    // //Sensor3Button.mousePressed(DisconnectToBle);
    // Sensor6Button.position(245, 200);
    // Sensor6Button.size(150);

    //text('Track Name', 70, Sensor5Button.height + 500);
    let inp = createInput('');
    inp.input(TrackNameInputEvent());
    inp.position(15, Sensor5Button.height + 360);
    //const LEDonButton = createButton('LED ON');
    //LEDonButton.mousePressed(LEDon);
    //LEDonButton.position(15, 60);

    //const LEDoffButton = createButton('LED OFF');
    //LEDoffButton.mousePressed(LEDoff);
    //LEDoffButton.position(LEDonButton.x+LEDonButton.width+10, 60);

    //ledColorPicker = createColorPicker('#ff0000');
    //ledColorPicker.position(LEDoffButton.x+LEDoffButton.width+10, 60);
    //millisecondTimerStart = millis();
}

function TrackNameInputEvent() {
    console.log('you are typing: ', this.value());
}

function SensorMenu() {

}

function ParserBtData() {

    if (isDataReceived == true) {
        isDataReceived = false;
        var DataRxLenght = DataRx.length;
        //Remove END_FRAME caracter
        var TrimmedDataRx = DataRx.substr(0, (DataRxLenght - 1));
        //console.log(DataRx);
        console.log(TrimmedDataRx);
        // Converted into JSON:
        //BtDataToJSON = JSON.stringify(TrimmedDataRx);
        BtDataToJSON = JSON.parse(TrimmedDataRx);
        //console.log("Lenght Data Rx: ");
        //console.log(BtDataToJSON.Nodos[0].TrackName);
        fill(10, 102, 153);
        text(BtDataToJSON.Nodos[0].TrackName, 40, 360);
        DataRx = '';
    }
}

function draw() {
    drawScreen();
    ParserBtData();

}

window.onresize = function() {
    // assigns new values for width and height variables
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.size(w, h);
}