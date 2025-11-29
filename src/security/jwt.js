import jwt from 'jsonwebtoken';

/**
 * JWT helper that does NOT read secrets itself.
 * caller should pass secret and options.
 *
 * Usage:
 *   const token = core.jwt.sign({ payload }, { secret: process.env.JWT_SECRET, expiresIn: '15m' });
 *   const payload = core.jwt.verify(token, { secret: process.env.JWT_SECRET });
 */

function sign(payload, {secret}, opts = {}) { 
    if (!secret) throw new Error('JWT secret required');
    return jwt.sign(payload, secret, opts); 
}
function verify(token, {secret}) { 
    if (!secret) throw new Error('JWT secret required');
    return jwt.verify(token, secret); 
}

const jwtUtils = { sign, verify };

export default jwtUtils;
