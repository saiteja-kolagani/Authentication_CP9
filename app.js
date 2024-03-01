const express = require('express')
const app = express()
const path = require('path')
const dbPath = path.join(__dirname, 'userData.db')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
let db = null
app.use(express.json())

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    response.status(500).send('Internal Server Error')
  }
}
initializeDBAndServer()

//
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  try {
    const getUserQuery = `
      SELECT 
      *
      FROM 
      user
      WHERE 
      username = ?
    `
    const dbUser = await db.get(getUserQuery, [username])
    //Scenario 1
    if (dbUser !== undefined) {
      response.status(400).send('User already exists')
    } else if (password.length < 5) {
      response.status(400).send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      const createUserQuery = `
        INSERT INTO 
        user(username, name, password, gender, location)
        VALUES(?, ?, ?, ?, ?);
      `
      await db.run(createUserQuery, [
        username,
        name,
        hashedPassword,
        gender,
        location,
      ])
      response.status(200).send('User created successfully')
    }
  } catch (e) {}
})

//API 2 FOR Login
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  try {
    const getUserQuery = `
      SELECT 
      *
      FROM
      user
      WHERE 
      username = ?
    `
    const dbResponse = await db.get(getUserQuery, [username])
    const isPasswordMatched = await bcrypt.compare(
      password,
      dbResponse.password,
    )
    if (dbResponse === undefined) {
      response.status(400).send('Invalid user')
    } else if (isPasswordMatched === false) {
      response.status(400).send('Invalid password')
    } else {
      response.status(200).send('Login success!')
    }
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

//API 3
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const getUserQuery = `
    SELECT * FROM user WHERE username = ?
  `
  const dbResponse = await db.get(getUserQuery, [username])
  const isPasswordMatched = await bcrypt.compare(
    oldPassword,
    dbResponse.password,
  )
  try {
    if (isPasswordMatched === false) {
      response.status(400).send('Invalid current password')
    } else if (newPassword.length < 5) {
      response.status(400).send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      const updatePasswordQuery = `
        UPDATE 
        user
        SET 
        password = ?
      `
      await db.run(updatePasswordQuery, [hashedPassword])
      response.status(200).send('Password updated')
    }
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

module.exports = app
