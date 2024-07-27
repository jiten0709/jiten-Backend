// ONE WAY TO CONNECT TO MONGO DB
/* 
import mongoose from 'mongoose'
import {DB_NAME} from './constants.js'
import express from 'express'
const app = express()
;(async () => {
    try {
        mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on('erroe', (error) => {
            console.error('ERRR', error)
            throw error
        })
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error(error)
        throw err
    }
})
*/

// ANOTHER BETTER WAY TO CONNECT TO MONGO DB
import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"

dotenv.config({
    path: './.env'
})

connectDB()
    .then(() => {
        const port = process.env.PORT || 8000
        app.listen(port, () => {
            console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
            console.log(`🚀 Server is running at http://localhost:${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("src :: index.js :: MongoDB connection failed !!! ", err);
    })
