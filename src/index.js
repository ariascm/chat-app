const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessages, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const { getRooms, addRoom, removeRoom } = require('./utils/rooms')

const app = express()
//esta configuración igual siempre la hace express detrás de escena, pero ahora la hacemos explicita para poder configurar el websocket 
const server = http.createServer(app)
// entonces ahora el servidor soporta websockets
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


// server (emit) -> client (on - receive)
// client (emit) -> server (on - receive)
// socket.emit (solo a la conexión) / io.emit (a todas las conexiones) / socket.broadcast.emit (a todas las conexiones menos la que emite)
// io.to.emit (a todas las conexiones del room) / socket.broadcast.to.emit (a todas las conexiones del room menos a la que emite)


io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    // socket.on('join', ({ username, room }, callback) => {
    socket.on('join', (options, callback) => {

        const { error, user } = addUser({
            id: socket.id,
            ...options          // {username, room}
        })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        addRoom(user.room)

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        socket.emit('message', generateMessages('Admin', 'Welcome!'))  // Emite solo al cliente que inicio el socket
        socket.broadcast.to(user.room).emit('message', generateMessages('Admin', `${user.username} has joined!`))
    })

    socket.on('roomsList', () => {
        const rooms = getRooms()
        socket.emit('allRoomsList', { rooms })
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')   //Si hay malas palabras, devuelve el error y frena la funcion
        }



        io.to(user.room).emit('message', generateMessages(user.username, message))     // Emite a todos los clientes del ROOM (incluyendo el socket actual).
        callback()      //Si no hay malas palabras devuelve el callback vacio
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {       //Cuando ocurre el evento de desconexión sobre el cliente actual
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessages('Admin', `${user.username} has left!`))      //Se emite a todos. Broadcast no necesario ya que al cliente actual no le llegara por estar desconectado    
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
            removeRoom(user.room)
        }

    })

})

//app.listen(port, () => {
server.listen(port, () => {
    console.log('Server is on port:' + port)
})
