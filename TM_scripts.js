
// ===================================================================================================
// Video 
// ===================================================================================================
// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your v_model provided by Teachable Machine export panel
const v_URL = "./bread_model/";

let v_model, v_webcam, v_labelContainer, v_maxPredictions;

// Load the image v_model and setup the v_webcam
async function v_init() {
    $('#v_startBtn').remove();
    const v_modelURL = v_URL + "model.json";
    const v_metadataURL = v_URL + "metadata.json";

    // load the v_model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds "tmImage" object to your window (window.tmImage)
    v_model = await tmImage.load(v_modelURL, v_metadataURL);
    v_maxPredictions = v_model.getTotalClasses();

    // Convenience function to setup a v_webcam
    const flip = false; // whether to flip the v_webcam
    v_webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
    await v_webcam.setup(); // request access to the v_webcam
    await v_webcam.play();
    window.requestAnimationFrame(v_loop);

    // append elements to the DOM
    document.getElementById("v_webcam-container").appendChild(v_webcam.canvas);
    document.getElementsByTagName('Canvas')[0].style.transform='rotate(90deg)';
    document.getElementsByTagName('Canvas')[0].style.width='100%';
    v_labelContainer = document.getElementById("v_label-container");
    for (let i = 0; i < v_maxPredictions; i++) { // and class labels
        v_labelContainer.appendChild(document.createElement("div"));
    }
}

// "일정시간 이상 한 가지 물건을 인식했을 때" 함수에 사용할 객체
let prdVal = {};
let predict_switch = true;
let result_predict;

async function v_loop() {
    v_webcam.update(); // update the v_webcam frame
    window.requestAnimationFrame(v_loop);
    const prd = await predict();
    // console.log(prdVal);
    if(prd !== undefined) {
        if(prdVal[prd] !== undefined) {
            prdVal[prd] += (1.0/50); // 지연 결정
        } else prdVal[prd] = 0;
        
        if(predict_switch)
            if(prdVal[prd] > 1) {
                result_predcit = prd;
                prdVal = {};
                predict_switch = false;
                // target = pos.currentOrder.addItem(pos.findProduct(prd));
                // pos.showCurrentOrder();
                pos.addOrderItem(prd);
            }
    } else {
        prdVal = {};
        predict_switch = true;
    }

}

// run the v_webcam image through the image v_model
async function predict() {
    // predict can take in an image, video or canvas html element
    const prediction = await v_model.predict(v_webcam.canvas);
    // 큰 값 찾기
    let v_max = 0;
    let v_index = 0;
    for(let i = 0; i < v_maxPredictions; i++) {
        if (v_max < prediction[i].probability) {
            v_max = prediction[i].probability;
            v_index = i;
        }
    }
    v_labelContainer.innerHTML = prediction[v_index].className + " : " + prediction[v_index].probability;
    $('#v_progressBar')[0].style.width = `${prediction[v_index].probability*100}%`;
    $('#v_progressBar')[0].innerHTML = `${prediction[v_index].className}`;
    if(prediction[v_index].className !== 'none') {
        // v_labelContainer.innerHTML = "Stop";
        return prediction[v_index].className;
    }
}

function getPredcitResult() {
    return result_predict;
}

function addTable(val) {
    if(val !== undefined) document.getElementById('tb').innerHTML += `<tr><td>${val}</td></tr>`;
}
// =================================================================================================== 
// Audio  
// =================================================================================================== 
// more documentation available at
// https://github.com/tensorflow/tfjs-models/tree/master/speech-commands

// the link to your model provided by Teachable Machine export panel
const URL = "http://localhost/tensor/my_audio_model/";

async function createModel() {
    const checkpointURL = URL + "model.json"; // model topology
    const metadataURL = URL + "metadata.json"; // model metadata

    const recognizer = speechCommands.create(
        "BROWSER_FFT", // fourier transform type, not useful to change
        undefined, // speech commands vocabulary feature, not useful for your models
        checkpointURL,
        metadataURL);

    // check that model and metadata are loaded via HTTPS requests.
    await recognizer.ensureModelLoaded();

    return recognizer;
}

let recognizer = null;
let classLabels = null;
let labelContainer = null;
async function init() {
    $('#a_startBtn').remove();
    recognizer = await createModel();
    classLabels = recognizer.wordLabels(); // get class labels
    labelContainer = document.getElementById("label-container");
    // for (let i = 0; i < classLabels.length; i++) {
    //     labelContainer.appendChild(document.createElement("div"));
    // }

    // listen() takes two arguments:
    // 1. A callback function that is invoked anytime a word is recognized.
    // 2. A configuration object with adjustable fields
    recognizer.listen(result => {
        const scores = result.scores; // probability of prediction for each class
        // render the probability scores per class
        a_max = 0;
        a_index = 0;
        for (let i = 0; i < classLabels.length; i++) {
            if(a_max < result.scores[i]) {
                a_max = result.scores[i];
                a_index = i;
            }
        }
        labelContainer.innerHTML = classLabels[a_index];
        mic.micInput(classLabels[a_index]);
        // if(classLabels[a_index] == 'play') {
        //     v_labelContainer.innerHTML = "";
        // }
        // for (let i = 0; i < classLabels.length; i++) {
        //     const classPrediction = classLabels[i] + ": " + result.scores[i].toFixed(2);
        //     labelContainer.childNodes[i].innerHTML = classPrediction;
        // }
    }, {
        includeSpectrogram: true, // in case listen should return result.spectrogram
        probabilityThreshold: 0.75,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.50 // probably want between 0.5 and 0.75. More info in README
    });

    // Stop the recognition in 5 seconds.
    // setTimeout(() => recognizer.stopListening(), 5000);
}