const users = require('./users')

const rooms = []

const getRooms = () => rooms

const addRoom = (newRoom) => {
    newRoom = newRoom.toLowerCase()
    const existingRoom = rooms.find((room) => room === newRoom)

    if (existingRoom) {
        return rooms
    }
    rooms.push(newRoom)
    return rooms
}

const removeRoom = (roomName) => {
    isUserInRoom = users.getUsersInRoom(roomName)

    if (isUserInRoom.length) {  //si hay algun usuario, retornar sin eliminar el room
        return
    }
    const index = getRooms().findIndex((room) => room === roomName)

    if (index !== -1) {
        return rooms.splice(index, 1)[0]
    }

}

module.exports = {
    getRooms,
    addRoom,
    removeRoom
}