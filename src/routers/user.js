const express = require('express')
const multer = require('multer')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendGoodByeEmail} = require('../emails/account')
const sharp = require('sharp')

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        
        //this code is going to run only if promise is fulfilled
        res.status(201).send({user, token })
    } catch(e) {
        res.status(400).send(e)
    }
    /* user.save().then(()=>{
        res.send(user)
    }).catch((e)=>{
        res.status(400).send(e)
    }) */
})

router.post('/users/login', async(req, res)=>{
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token})
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async(req, res) => {
    //vogliamo effettuare il logout solo da un dispositivo, non da tutti i dispositivi delll'utente
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async(req, res)=> {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})


const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg)|(jpeg)|(png)$/)) {
            return cb(new Error('File must be an image!'))
        }

        cb(undefined, true)
    }
})

//prima viene eseguita la middleware function (auth)
router.get('/users/me', auth, async(req, res) => {
    res.send(req.user)
})

router.get('/users/:id', async(req,res)=> {
    const _id = req.params.id
    
    try {
        const user = await User.findById(_id) //puo essere che non ci sia un user con quell id, mongodb non da errore
        if(!user) {
            res.status(404).send()
        }
        return res.status(200).send(user)

    } catch(e) {
        res.status(500).send()
    }
})

router.patch('/users/me', auth, async(req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        //const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        res.send(req.user)
    } catch(e) {
        res.status(400).send()
    }
})

router.delete('/users/me', auth, async(req,res)=> {
    try {
        // const user = await User.findByIdAndDelete(req.user._id)
        sendGoodByeEmail(req.user.email, req.user.name)
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer

    //req.user.avatar = req.file.buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send( {error: 'Please upload an image!'})
})

router.delete('/users/me/avatar', auth, async(req,res)=> {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar) {
            throw new Error() //stop the execution of the try block and go to the catch
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)


    } catch (e) {
        res.status(404).send()
    }
})
module.exports = router