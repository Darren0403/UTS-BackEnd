const { errorResponder, errorTypes } = require('../../../core/errors');
const authenticationServices = require('./authentication-service');

const loginAttempts = {};

/**
 * Handle login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function login(request, response, next) {
  const { email, password } = request.body;

  try {
    if (!loginAttempts[email]) {
      loginAttempts[email] = {
        attempts: 0,
        lastAttempt: null,
      };
    }

    const now = new Date();
    if (
      loginAttempts[email].attempts >= 5 &&
      now - loginAttempts[email].lastAttempt < 30 * 60 * 1000
    ) {
      throw errorResponder(
        errorTypes.FORBIDDEN,
        'Too many failed login attempts',
        'You have reached the limit for login attempts. Please try again later in 30 minutes.',
        { timestamp: now.toISOString(), attemptCount: loginAttempts[email].attempts }
      );
    }

    // Check login credentials
    const loginSuccess = await authenticationServices.checkLoginCredentials(
      email,
      password
    );

    if (!loginSuccess) {
      // Increment login attempts
      loginAttempts[email].attempts += 1;
      loginAttempts[email].lastAttempt = now;

      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Invalid credentials',
        'Wrong email or password.',
        { timestamp: now.toISOString(), attemptCount: loginAttempts[email].attempts }
      );
    }

    // Reset login attempts on successful login
    loginAttempts[email].attempts = 0;

    return response.status(200).json(loginSuccess);
  } catch (error) {
    // Customize error response
    if (error.statusCode === 403 && error.error === 'INVALID_CREDENTIALS') {
      return response.status(403).json({
        statusCode: error.statusCode,
        error: error.error,
        description: error.description,
        message: error.message,
        validation_errors: {
          timestamp: error.validation_errors.timestamp,
          attemptCount: error.validation_errors.attemptCount,
        },
      });
    }

    return next(error);
  }
}

module.exports = {
  login,
};