const jwt = require('jsonwebtoken');

// En un caso real, esto vendría de tu base de datos o almacenamiento en memoria
const refreshTokens = []; 

const refreshToken = (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(401).json({ error: 'Token no provisto' });
  if (!refreshTokens.includes(token)) return res.status(403).json({ error: 'Token inválido' });

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token expirado o inválido' });

    // Generar nuevo access token con una duración corta (ej. 15m)
    const accessToken = jwt.sign(
      { username: user.username }, 
      process.env.ACCESS_TOKEN_SECRET, 
      { expiresIn: '15m' }
    );

    res.json({ accessToken });
  });
};

module.exports = { refreshToken };
