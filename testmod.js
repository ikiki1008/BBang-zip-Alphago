$(document).ready(function() {
    $('#settings').append(`<div>insert item</div>`);
    for(var i of pos.products) {
        $('#settings').append(`<div onclick="pos.addOrderItem('${i['name']}')">${i['name']}</div>`);
    }
})