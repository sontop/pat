'use strict'
//let firstPerson = false;
let localVideo;
let remoteVideo;
let localStream;
let connection = [];
var socketID;

let Config = {
    'iceServers': [
       {   url: 'turn:turn.sjlink.net:3478',
           credential: 'raz_password',
           username: 'raz_username'}
    ]
};

const socket = io('https://211.232.179.91:3478');
Ready();

socket.on('recMsg', function(msg){
    console.log(msg.comment);
    $('#chat').append(msg.comment, ' \n');
});

function btnOnClick(){
    socket.emit('chatMessage', {comment : $('#user').val()});
    $('#user').val();

    let txt_chat = document.getElementById('user');
    txt_chat.value='';
}

$(document).ready(function() {
    $("#user").keydown(function(key) {
        if (key.keyCode == 13) {
            btnOnClick();
        }
    });
});

function Ready() {
    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');

    let constraints ={
        video: {
            width : {max: 320},
            height : {max: 240},
            frameRate : {max:30}
        }
    }; //video 1:n mesh -> if user so many => rate down plz.
    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(getUserMediaSuccess) // getusermedia
            .then(function(){
                socket.on('connect', function () {

                    socket.on('signal',messageAnsOrOff);
                    socketID = socket.id;
                    socket.on('out',function (id) {
                        var video = document.querySelector('[data="'+ id +'"]');
                        var parentDiv = video.parentElement;
                        video.parentElement.parentElement.removeChild(parentDiv);
                    });

                    //===============================================================================
                    console.log('Connect ID: '+ socketID);

                    socket.on('join', function (id, count, clients) {
                        clients.forEach(function (ID) {
                            if (!connection[ID]) {
                                connection[ID] = new RTCPeerConnection(Config);
                                connection[ID].onicecandidate = function(event){
                                    if(event.candidate != null) {
                                        socket.emit('signal', ID, JSON.stringify({'ice': event.candidate}));
                                    }
                                }
                                connection[ID].onaddstream = function(){
                                    gotRemoteStream(event,ID)
                                }
                                connection[ID].addStream(localStream);
                            }
                        });

                        if (count >= 2) {
                            console.log('counts: ' + count);
                            connection[id].createOffer().then(function (description) {
                                connection[id].setLocalDescription(description).then(function () { // answer
                                    socket.emit('signal', id, JSON.stringify({'sdp': connection[id].localDescription}));
                                }).catch(e => alert(e + 'here'));
                            });
                        }
                    });
                })
            })
    }else{
        alert('Your Browser dose not support getUserMedia');
    }
}

function getUserMediaSuccess(stream) {
    localStream = stream;
    document.getElementById('localVideo').srcObject = stream;
}

function gotRemoteStream(event, id) {
    var videos = document.querySelectorAll('video'),
        video  = document.createElement('video'),
        div    = document.createElement('div')

    video.setAttribute('data', id);
    video.srcObject   = document.getElementById('remoteVideo');
    video.srcObject   = event.stream;
    video.autoplay    = true;
    video.playsinline = true;

    div.appendChild(video);
    document.querySelector('.videos').appendChild(div);
}

function messageAnsOrOff(id,message) {
    var signal = JSON.parse(message);

    if(id != socketID){
        if(signal.sdp){
            connection[id].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
                if(signal.sdp.type == 'offer') {
                    connection[id].createAnswer().then(function(description){
                        connection[id].setLocalDescription(description).then(function() {
                            socket.emit('signal', id, JSON.stringify({'sdp': connection[id].localDescription}));
                        }).catch(e => console.log('here is setLocalDescription: ' + e));
                    }).catch(e => console.log('Here is CreateAnswer' + e));
                }
            }).catch(e => console.log(e));
        }
        else if(signal.ice) {
            console.log('Message : ' + signal.ice);
            connection[id].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
        }
    }
}