import pkg from 'jsonwebtoken';
const { verify } = pkg;
import { UNAUTHORIZED, FORBIDDEN } from '../constants/httpStatus.js';

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || !token.startsWith('Bearer ')) 
    return res.status(UNAUTHORIZED).send('Access token is required');

  try {
    const decodedToken = verify(token.split(' ')[1], process.env.JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(UNAUTHORIZED).send('Invalid token');
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user.isAdmin) {
    next();
  } else {
    res.status(FORBIDDEN).send('Admin access required');
  }
};

export const isOwner = (req, res, next) => {
  if (req.user.isOwner) {
    next();
  } else {
    res.status(FORBIDDEN).send('Owner access required');
  }
};

export const isAdminOrOwner = (req, res, next) => {
  if (req.user.isAdmin || req.user.isOwner) {
    next();
  } else {
    res.status(FORBIDDEN).send('Admin or Owner access required');
  }
};