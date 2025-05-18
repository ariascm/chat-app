const socket = io()
const $roomList = document.getElementById('roomsList')
const roomsTemplate = document.getElementById('rooms-template').innerHTML

socket.emit('roomsList')

socket.on('allRoomsList', ({ rooms }) => {
    const html = Mustache.render(roomsTemplate, { rooms })
    $roomList.insertAdjacentHTML('beforeend', html)
})