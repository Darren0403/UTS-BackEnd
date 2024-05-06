const { Product } = require('../../../models');
const productsRepository = require('./products-repository');

async function getProducts({ page_number = 1, page_size = 10, search = '', sort = {} }) {
  let query = {};

  // Search filter
  if (search) {
    query.name = { $regex: search, $options: 'i' };
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

  const totalProducts = await Product.countDocuments(query);

  const products = await Product.find(query)
    .sort(sortQuery)
    .skip((page_number - 1) * page_size)
    .limit(parseInt(page_size));

  const totalPages = Math.ceil(totalProducts / page_size);
  const hasNextPage = page_number < totalPages;
  const hasPreviousPage = page_number > 1;

  return {
    page_number,
    page_size,
    count: products.length,
    total_pages: totalPages,
    has_previous_page: hasPreviousPage,
    has_next_page: hasNextPage,
    data: products,
  };
}

async function getProduct(id) {
  return Product.findById(id);
}

async function createProduct(name, description, price) {
  const product = new Product({ name, description, price });
  return product.save();
}

async function updateProduct(id, name, description, price) {
  return Product.updateOne(
    { _id: id },
    { $set: { name, description, price } }
  );
}

async function deleteProduct(id) {
  return Product.deleteOne({ _id: id });
}

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
