import argon2 from 'argon2'
import jwt from 'jsonwebtoken'

import { User } from '../users/user.model.js'

const generateToken = (user) =>
  jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    subject: user.id,
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  })

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    const existingUser = await User.findOne({ where: { email } })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El correo ya está registrado',
      })
    }

    const passwordHash = await argon2.hash(password)

    const user = await User.create({
      name,
      email,
      password: passwordHash,
    })

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      data: {
        user: user.toPublicJSON(),
      },
    })
  } catch (error) {
    // Carrera entre findOne y create: la restricción unique del email es la garantía final.
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'El correo ya está registrado',
      })
    }

    return next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await User.scope('withPassword').findOne({ where: { email } })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
      })
    }

    const passwordMatches = await argon2.verify(user.password, password)

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
      })
    }

    const token = generateToken(user)

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        user: user.toPublicJSON(),
      },
    })
  } catch (error) {
    return next(error)
  }
}
