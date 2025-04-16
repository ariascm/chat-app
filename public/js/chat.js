const socket = io()

// ELEMENTS FROM THE DOM. Convencionalmente se utiliza el signo $ antes del nobre de la variable.
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// TEMPLATES:
const messageTemplate = document.querySelector('#message-template').innerHTML   //innerHtml accedemos al HTML del objeto
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// OPTIONS -> vienen del submit del form del HTML en la URL, se acceden a traves de la variable location.search
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    //  Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)  // obtiene las propiedades del nuevo mensaje (harcoded en el CSS)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)    // Extraemos solo el marginBottom 16px a INT = 16
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin   // Sumamos la altura del mensaje + el margen

    //Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of message container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight    //Sumamos el recorrido del scroll + el tamaño de lo visible del contenedor

    // ACA VA LA MAGIA: Si el tamaño del contenedor - el nuevo mensaje es MENOR O IGUAL a todo lo scrolleado significa que estamos al final
    if (containerHeight - newMessageHeight <= scrollOffset + 1) {
        $messages.scrollTop = $messages.scrollHeight    // Enviamos el scroll hasta el final (tamaño completo del container)
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {     //Renderiza el template HTML con las variables que se pasan por argumento
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')   //momentJS, libreria agregada por CDN en el index.html
    })
    $messages.insertAdjacentHTML('beforeend', html) //Inserta el contenido renderizado en el contenedor <div> en el HTML
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault()  //prevenir que al apretar el boton (submit por defecto) dentro del form, la pagina se refresque

    $messageFormButton.setAttribute('disabled', 'disabled') //Disable send button

    // const message = document.querySelector('input')      //Se puede acceder al input así (aunque si hubieran mas input, habria problema)
    const message = event.target.elements.message.value           //ó se puede acceder atraves del evento, target (message-form), elementos y el "name" del elemento

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')  //Eliminamos el atributo que lo deshabilita
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your Browser')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {        //comando incluido en los navegadores para obtener geolocation

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {       //Seteo el acknowledgment (espera por una confirmacion del servidor (enviada por callback))
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })

})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})