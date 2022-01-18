const getContacts = async (contacts) => {
    try {
        const array = []
        for (const contact of contacts) {
            if (contact.phoneNumbers !== undefined) {
                for (const number of contact.phoneNumbers) {
                    const trim = number.digits.trim()
                    let format = trim
                    if (trim[0] == '8') {
                        format = number.digits.substr(1)
                    }
                    if (trim[0] == '+') {
                        format = number.digits.substr(2)
                    }
                    if (format.length === 10 && format[0] === '9') {
                        const user = await User.findOne({ $and: [{ _id: { $nin: [socket.decoded_token.userId] } }, { telephone: format }] })
                        if (user) {
                            array.push(contact)
                        }
                    }
                }
            }
        }
        res.status(201).json(array)
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: 'Что-то пошло не так, попробуйте еще раз' })
    }
}

module.exports = getContacts