const socket = io()

// elements
const $roomList = document.getElementById('roomsList')

// template
const roomsTemplate = document.getElementById('rooms-template').innerHTML


socket.emit('roomsList')

socket.on('allRoomsList', ({ rooms }) => {
    // alert(rooms)
    const html = Mustache.render(roomsTemplate, { rooms })
    $roomList.insertAdjacentHTML('beforeend', html)
})