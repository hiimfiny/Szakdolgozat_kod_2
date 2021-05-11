//Változó a WebSocket használatához
const  webSocket = new WebSocket("wss://webrtc-szakdolgozat.herokuapp.com")

//Változók felsorolása és inicializálása
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

let isVideo = true
let isAudio = true

//A metódus alternatívái
navigator.getUserMedia = ( 
    navigator.getUserMedia || 
    navigator.mediaDevices.getUserMedia
);

roomid=roomidGen()
function sendRoomId(){
    sendData({
        type: "store_room"
    })
}

//Az üzenetek kezelését végző függvény
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


//A hívás indítását végző függvény
function startCall(){
    sendData({
        type: "store_room"
    })

    navigator.mediaDevices.getUserMedia(defaultConstraints).then (stream =>{
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
    }, (error) =>  {
        console.log(error)
    })

}
//A híváshoz való csatlakozásért felelős függvény
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


//A szoba azonosítóját generálja le
function roomidGen(){
    let r = Math.random().toString(36).substring(6);
    console.log("random", r);
    document.getElementById("roomid-field").value=r
    return r
}

//Az üzenetküldést végző segédfüggvény
function sendData(data){
    data.roomid = roomid
    webSocket.send(JSON.stringify(data))
}

//Az üzenetek kezelésénél használt függvény
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

//A hívás indításakor használt függvény
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

//A hang és videó némításáért felelős függvény
function muteAudio(){
    isAudio= !isAudio
    localStream.getAudioTracks()[0].enabled = isAudio
}
function muteVideo(){
    isVideo= !isVideo
    localStream.getVideoTracks()[0].enabled = isVideo
}