'use strict'
let localVideo;
let remoteVideo;
let localStream;
let pc = [];

let Config = {
    'iceServers': [
       {   url: 'turn:turn.sjlink.net:3478',
           credential: 'raz_password',
           username: 'raz_username'}
    ]
};
const socket = io('https://');
readyToStart();

// Chat //
socket.on('Msg', function(msg){
    console.log(msg.comment);
    $('#chat').append(msg.comment, ' \n');
    const top = $("#chat").prop('scrollHeight');
    $("#chat").scrollTop(top);
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
//Chat//

function readyToStart() {
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
                    socket.on('out',function (id) {
                        var video = document.querySelector('[datas="'+ id +'"]');
                        var parentDiv = video.parentElement;
                        video.parentElement.parentElement.removeChild(parentDiv);
                    });

                    //===============================================================================
                    console.log('ID: '+ socket.id);

                    socket.on('join', function (id, count, clients) {
                        clients.forEach(function (ID) {
                            if (!pc[ID]) {
                                pc[ID] = new RTCPeerConnection(Config);
                                pc[ID].onicecandidate = function(event){
                                    if(event.candidate != null) {
                                        socket.emit('signal', ID, JSON.stringify({'candidate': event.candidate}));
                                    }
                                }
                                pc[ID].onaddstream = function(){
                                    gotRemoteStream(event,ID)
                                }
                                pc[ID].addStream(localStream);
                            }
                        });

                        if (count >= 2) {
                            console.log('cnt: ' + count);
                            pc[id].createOffer().then(function (description) {
                                pc[id].setLocalDescription(description).then(function () { // answer
                                    socket.emit('signal', id, JSON.stringify({'sdp': pc[id].localDescription}));
                                }).catch(e => alert(e + 'here'));
                            });
                        }
                    });
                })
            })
    }else{
        alert('not support getUserMedia');
    }
}
//##################################MSG send###########################
function messageAnsOrOff(id,msg) {
    var signal = JSON.parse(msg);
    if(id != socket.id){
        if(signal.sdp){
            pc[id].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
                if(signal.sdp.type == 'offer') {
                    pc[id].createAnswer().then(function(description){
                        pc[id].setLocalDescription(description).then(function() {
                            socket.emit('signal', id, JSON.stringify({'sdp': pc[id].localDescription}));
                        }).catch(e => alert('here is setLocalDescription: ' + e));
                    }).catch(e => alert('Here is CreateAnswer' + e));
                }
            }).catch(e => alert('SET E: '+ e));
        }
        else if(signal.candidate) {
            console.log('Message : ' + signal.candidate);
            pc[id].addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(e => console.log(e));
        }
    }
}

//####################VideoStream Local AND Remote #####################
function getUserMediaSuccess(stream) {
    localStream = stream;
    document.getElementById('localVideo').srcObject = stream;
}

function gotRemoteStream(event, id) {
    var videos = document.querySelectorAll('video'),
        video  = document.createElement('video'),
        div    = document.createElement('div')

    video.setAttribute('datas', id);
    video.srcObject   = document.getElementById('remoteVideo');
    video.srcObject   = event.stream;
    video.autoplay    = true;
    video.playsinline = true;

    div.appendChild(video);
    document.querySelector('.videos').appendChild(div);
}


