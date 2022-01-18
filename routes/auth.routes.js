const { Router } = require('express')
const { check, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const config = require('config')
const User = require('../models/User')
const router = Router()

router.post('/login',
    [
        check('telephone', 'Укажите номер телефона').isLength({ min: 10, max: 10 })
    ],
    async (req, res) => {
        
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Неверно указан номер телефона'
                })
            }

            const { telephone, code } = req.body

            const user = await User.findOne({ telephone: telephone })

            if (!user) {
                return res.status(400).json({ message: 'Пользователь не найден' })
            }

            if (code !== user.code) {
                return res.status(400).json({ message: 'Код подтверждения неверный' })
            }

            const token = jwt.sign(
                { userId: user.id },
                config.get('secretKey'),
                { expiresIn: '90 days' }
            )

            res.json({
                token,
                userId: user.id
            })

        } catch (e) {
            res.status(500).json({ message: 'Что-то пошло не так, попробуйте еще раз' })
        }
    })

module.exports = router