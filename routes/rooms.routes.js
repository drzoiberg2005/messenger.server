const { Router } = require('express')
const auth = require('../middleware/auth.middleware')
const router = Router()
const Room = require('../models/Room')
const User = require('../models/User')

router.post('/generate', auth, async (req, res) => {
    try {
        const users = req.body
        console.log(users)
        const room = await new Room({ users }).save()
        await User.findByIdAndUpdate(users[0], { $push: { rooms: room } })
        await User.findByIdAndUpdate(users[1], { $push: { rooms: room } })
        res.json(room._id)
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: 'Что-то пошло не так, попробуйте еще раз' })
    }
})

router.get('/', auth, async (req, res) => {
    try {
        const room = await Room.findByID(req.body)
        res.json(room)
    } catch (e) {
        res.status(500).json({ message: 'Что-то пошло не так, попробуйте еще раз' })
    }
})

router.post('/messages', auth, async (req, res) => {
    try {
        const { id } = req.body
        const room = await Room.findByID(req.body)
        res.json(room)
    } catch (e) {
        res.status(500).json({ message: 'Что-то пошло не так, попробуйте еще раз' })
    }
})


module.exports = router