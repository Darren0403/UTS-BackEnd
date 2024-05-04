const usersRepository = require('./users-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');

const { User } = require('../../../models');
/**
 * Get list of users
 * @returns {Array}
 */
async function getUsers() {
  const users = await usersRepository.getUsers();

  const results = [];
  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    results.push({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }

  return results;
}

async function getUsers({ page_number = 1, page_size = 10, search = '', sort = {} }) {
  let query = {};

  // Search filter
  if (search) {
    query.email = { $regex: search, $options: 'i' };
  }

  // Sorting
  let sortQuery = {};
  if (sort && Object.keys(sort).length > 0) {
    const sortBy = Object.keys(sort)[0];
    const sortOrder = sort[sortBy] === 'asc' ? 1 : -1;
    sortQuery[sortBy] = sortOrder;
  } else {
    // Default sorting by ID in descending order
    sortQuery._id = -1;
  }

  const totalUsers = await User.countDocuments(query);

  const users = await User.find(query)
    .sort(sortQuery)
    .skip((page_number - 1) * page_size)
    .limit(parseInt(page_size));

  const totalPages = Math.ceil(totalUsers / page_size);
  const hasNextPage = page_number < totalPages;
  const hasPreviousPage = page_number > 1;

  return {
    page_number,
    page_size,
    count: users.length,
    total_pages: totalPages,
    has_previous_page: hasPreviousPage,
    has_next_page: hasNextPage,
    data: users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
    })),
  };
}


/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Object}
 */
async function getUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {boolean}
 */
async function createUser(name, email, password) {
  // Hash password
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createUser(name, email, hashedPassword);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {boolean}
 */
async function updateUser(id, name, email) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.updateUser(id, name, email);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {boolean}
 */
async function deleteUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.deleteUser(id);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Check whether the email is registered
 * @param {string} email - Email
 * @returns {boolean}
 */
async function emailIsRegistered(email) {
  const user = await usersRepository.getUserByEmail(email);

  if (user) {
    return true;
  }

  return false;
}

/**
 * Check whether the password is correct
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function checkPassword(userId, password) {
  const user = await usersRepository.getUser(userId);
  return passwordMatched(password, user.password);
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function changePassword(userId, password) {
  const user = await usersRepository.getUser(userId);

  // Check if user not found
  if (!user) {
    return null;
  }

  const hashedPassword = await hashPassword(password);

  const changeSuccess = await usersRepository.changePassword(
    userId,
    hashedPassword
  );

  if (!changeSuccess) {
    return null;
  }

  return true;
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  emailIsRegistered,
  checkPassword,
  changePassword,
};
