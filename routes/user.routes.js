const { Router } = require('express')
const { check, validationResult } = require('express-validator')
const User = require('../models/User')
const auth = require('../middleware/auth.middleware')
const router = Router()
const https = require('https')
const config = require('config')
const smsKey = config.get('smsKey')

router.post('/generate',
    [
        check('telephone', 'Укажите номер телефона').isLength({ min: 10 })
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(500).json({
                    message: 'Некорректно, проверьте номер телефона',
                    status: false
                })
            }
            const { telephone } = req.body
            const code = (Math.floor(Math.random() * (99999 - 10000)) + 10000).toString()
            const url = `https://sms.ru/sms/send?api_id=${smsKey}&to=7${telephone}&msg=Код+подтверждения:+${code}&json=1`
            https.get(url, async (response) => {
                if (response.statusCode === 200) {
                    let id
                    const createUser = async () => {
                        const user = new User({ telephone, code: code })
                        await user.save()
                    }
                    const date = Date.now()
                    const updateCode = async () => {
                        await User.findByIdAndUpdate(
                            id,
                            { $set: { code: code, updated: date } }
                        )
                    }
                    try {
                        const result = await User.findOne({ telephone: telephone })
                        id = result._id
                    } catch (e) { }
                    if (id) {
                        updateCode()
                    } else {
                        createUser()
                    }
                    return res.status(201).json({ message: 'Код отправлен', status: true })
                } else {
                    return res.status(500).json({ message: 'При отправке кода возникла ошибка', status: false })
                }
            })
        } catch (e) {
            return res.status(500).json({ message: 'Что-то пошло не так, попробуйте позже' })
        }
    })

router.post('/rooms', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
        res.json(user.rooms)
    } catch (e) {
        res.status(500).json({ message: 'Что-то пошло не так, попробуйте позже' })
    }
})

router.post('/name', async (req, res) => {
    try {
        console.log(req.body)
        const user = await User.findById(req.body.id)
        res.json(user.telephone)
    } catch (e) {
        res.status(500).json({ message: 'Что-то пошло не так, попробуйте позже' })
    }
})

router.post('/contacts', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
        res.json(user.contacts)
    } catch (e) {
        res.status(500).json({ message: 'Что-то пошло не так, попробуйте позже' })
    }
})

router.post('/delete', auth, async (req, res) => {
    try {
        await User.findByIdAndRemove(req.body)
        res.status(201).json({ message: 'Пользователь удален' })
    } catch (e) {
        res.status(500).json({ message: 'Что-то пошло не так, попробуйте еще раз' })
    }
})

module.exports = router