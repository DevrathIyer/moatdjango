$(function() {
    // When we're using HTTPS, use WSS too.
    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    console.log(ws_scheme + '://' + window.location.host + "/admin/getWorkerData" + window.location.pathname.split("/admin/experiment").pop());
    var datasock = new ReconnectingWebSocket(ws_scheme + '://' + window.location.host + "/admin/getWorkerData" + window.location.pathname.split("/admin/experiment").pop());
    datasock.onmessage = function(message) {
        var data = JSON.parse(message.data);
        console.log(data)
        var chat = $("#chat")
        var ele = $('<tr></tr>')

        ele.append(
            $("<td></td>").text(data.timestamp)
        )
        ele.append(
            $("<td></td>").text(data.handle)
        )
        ele.append(
            $("<td></td>").text(data.message)
        )
        
        chat.append(ele)
    };
});