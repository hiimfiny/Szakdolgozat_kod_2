//Változó a WebSocket használatához
//var PORT = 3001
var PORT = 3003
const  webSocket = new WebSocket("ws://https://webrtc-szakdolgozat.herokuapp.com/")

let ischrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime)
let localStream
let pc
let roomid
let config = {
    iceServers: [
        {
            "urls": 
            ["stun:stun.l.google.com:19302", 
            "stun:stun1.l.google.com:19302", 
            "stun:stun2.l.google.com:19302"]
        }
    ]
}
let defaultConstraints = {
    audio: true,
    video: true
}
navigator.getUserMedia = ( 
    navigator.getUserMedia || 
    navigator.mediaDevices.getUserMedia //||
    //navigator.webkitGetUserMedia ||
    //navigator.msGetUserMedia);
);

roomid=roomidGen()

function sendRoomId(){
    //roomid = roomidGen()
    
    sendData({
        type: "store_room"
    })
}

function roomidGen(){
    let r = Math.random().toString(36).substring(6);
    console.log("random", r);
    document.getElementById("roomid-field").value=r
    return r
}

webSocket.onmessage  = (event) =>{
    handleSignalingData(JSON.parse(event.data))
}

function handleSignalingData(data){
    switch(data.type){
        case "answer":
            pc.setRemoteDescription(data.answer)
            break
        case "offer":
            pc.setRemoteDescription(data.offer)
            createAndSendAnswer()
            break    
        case "candidate":
            pc.addIceCandidate(data.candidate)
    }
}
function createAndSendAnswer(){
    pc.createAnswer((answer) =>{
        pc.setLocalDescription(answer)
        sendData({
            type: "send_answer",
            answer: answer
        })
    }, error =>{
        console.log(error)
    })
}

function sendData(data){
    data.roomid = roomid
    webSocket.send(JSON.stringify(data))
}

function startvideo(){
    document.getElementById("local-video").srcObject=navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true})
}
function startCallFunction(stream){
    localStream=stream
        document.getElementById("local-video").srcObject = localStream

        pc  = new RTCPeerConnection(config)
        pc.addStream(localStream)

        pc.onaddstream = (e) => {
            document.getElementById("remote-video").srcObject=e.stream
        }
        pc.onicecandidate = ((e) => {
            if (e.candidate == null) return
            sendData({
                type: "store_candidate",
                candidate: e.candidate
            })
        })
        createAndSendOffer()
}

function startCall(){
    sendData({
        type: "store_room"
    })
    if(ischrome){
        navigator.getUserMedia(defaultConstraints).then( stream =>{
            startCallFunction(stream)
        }, (error) =>  {
            console.log(error)
        })
    }
    navigator.mediaDevices.getUserMedia(defaultConstraints).then (stream =>{
        startCallFunction(stream)

    }, (error) =>  {
        console.log(error)
    })

}
function joinCall(){
    roomid=document.getElementById("roomid-input").value
    document.getElementById("video-call-div").style.display="inline"

    navigator.mediaDevices.getUserMedia(defaultConstraints).then(stream =>{
        localStream=stream
        document.getElementById("local-video").srcObject = localStream

        pc  = new RTCPeerConnection(config)
        pc.addStream(localStream)

        pc.onaddstream = (e) => {
            document.getElementById("remote-video").srcObject=e.stream
        }
        pc.onicecandidate = ((e) => {
            if (e.candidate == null) return
            sendData({
                type: "send_candidate",
                candidate: e.candidate
            })
        })
        
        sendData({
            type: "join_call"
        })

    }, (error) =>  {
        console.log(error)
    })

}

function createAndSendOffer() {
    pc.createOffer((offer) => {
        sendData({
            type: "store_offer",
            offer: offer
        })
        pc.setLocalDescription(offer)
    }, (error) => {console.log(error)
    })
}

let isAudio = true
function muteAudio(){
    isAudio= !isAudio
    localStream.getAudioTracks()[0].enabled = isAudio

    
}

let isVideo = true
function muteVideo(){
    isVideo= !isVideo
    localStream.getVideoTracks()[0].enabled = isVideo
}

let screen = false
function screenShare(){
    
    let shareStream = navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true
    })
    localStream.getVideoTracks[0]=shareStream


    screen=!screen
}
