'use strict';

$(document).ready(function(){
    $("#btn_notice").click(function(){
        $("#notice_modal").modal();
    });

    $("#btn_info").click(function(){
        $("#info_modal").modal();
    });

    $('#btn_send').click(function(){
        const data = $('#user').val();
        $('#chat').append(`${data}`);
        const top = $("#chat").prop('scrollHeight');
        $("#chat").scrollTop(top);
        document.getElementById("user").value="";
    });

});