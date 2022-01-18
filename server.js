const express = require('express')
const config = require('config')
const mongoose = require('mongoose')
const { createServer } = require('http')
const socketioJwt = require('socketio-jwt')
const User = require('./models/User')
const Room = require('./models/Room')
const Message = require('./models/Message')
const { Expo } = require('expo-server-sdk')
const sendPushNotification = require('./utilites/pushNotifications')

const app = express()
const server = createServer(app)
const io = require('socket.io')(server, {
  cors: {
    origin: '*'
  }
})

app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ limit: '20mb', extended: true }))

app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/user', require('./routes/user.routes'))
app.use('/api/rooms', require('./routes/rooms.routes'))

const PORT = config.get('port') || 5000

function start() {
  try {
    mongoose.connect(config.get('mongoUri'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    server.listen(PORT, () => console.log('Server has been started on port', PORT, '...'))
  } catch (e) {
    console.log('Server error', e.message)
    process.exit(1)
  }
}


const onConnection = async (socket) => {
  const user = await User.findById(socket.decoded_token.userId)
  await User.findByIdAndUpdate(socket.decoded_token.userId, { $set: { status: true, socket: socket.id } })
  const rooms = await Room.find({ users: socket.decoded_token.userId })
  let messages = []
  for (const room of rooms) {
    const message = await Message.find({ room: room._id.toString() })
    messages = [...messages, ...message]
  }
  rooms.forEach(room => {
    socket.join('room:' + room._id.toString())
  })
  socket.emit('user', { user, messages, rooms })

  socket.on('message:send', async (arg) => {
    const room = await Room.findById({ _id: arg.room })
    const message = await new Message({ user: socket.decoded_token.userId, content: arg.content, room: room }).save()
    await Room.findByIdAndUpdate(arg.room, { $push: { messages: message } })
    socket.to('room:' + arg.room).emit('message:recive', arg)
    const usr = await User.findById(room.users.find(user => user !== socket.decoded_token.userId))
    usr.expoPushToken.forEach(token => {
      sendPushNotification(token, arg.content)
    })
  })

  socket.on('room:create', async (arg) => {
    console.log(arg.users)
    const room = await new Room({ users: arg.users }).save()
    socket.join('room:' + room._id.toString())
    const usr = await User.findById(arg.users.find(user => user !== socket.decoded_token.userId).id)
    socket.to(usr.socket).join('room:' + room._id.toString())
    socket.to(usr.socket).emit('room:create', room)
    socket.emit('room:create', room)
  })

  socket.on('room:get', async () => {
    const rooms = await User.find({ users: socket.decoded_token.userId })
    socket.emit('room:get', rooms)
  })

  socket.on('pushToken', async (expoPushToken) => {
    await User.findByIdAndUpdate(socket.decoded_token.userId, { $push: { expoPushToken: expoPushToken } })
  })

  socket.on('contacts', async (contacts) => {
    const find = []
    for (const data of contacts) {
      if (data.telephone !== user.telephone) {
        const contact = await User.findOne({ telephone: data.telephone })
        if (contact) {
          find.push({
            id: contact._id.toString(),
            telId: data.telId,
            lastName: data.lastName,
            firstName: data.firstName,
            middleName: data.middleName,
            name: data.name,
            telephone: contact.telephone
          })
        }
      }
    }
    await User.findByIdAndUpdate(socket.decoded_token.userId, { $push: { contacts: find } })
    socket.emit('contacts', find)
  })

  socket.on('disconnect', () => {
    if (user) {
      User.findByIdAndUpdate(user._id, { $set: { status: false, socket: '', updated: Date.now() } })
    }
  })
}

io.use(socketioJwt.authorize({
  secret: config.get('secretKey'),
  handshake: true
}))
  .on('connection', onConnection)


const f = async () => {
  const ids = await io.allSockets()
  console.log(ids)
}

start()