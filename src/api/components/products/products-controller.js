const productsService = require('./products-service');
const { errorResponder, errorTypes } = require('../../../core/errors');

async function getProducts(request, response, next) {
  try {
    const { page_number, page_size, search, sort } = request.query;
    const products = await productsService.getProducts({
      page_number,
      page_size,
      search,
      sort,
    });
    return response.status(200).json(products);
  } catch (error) {
    return next(error);
  }
}

async function getProduct(request, response, next) {
  try {
    const product = await productsService.getProduct(request.params.id);

    if (!product) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Unknown product');
    }

    return response.status(200).json(product);
  } catch (error) {
    return next(error);
  }
}

async function createProduct(request, response, next) {
  try {
    const { name, description, price } = request.body;

    const success = await productsService.createProduct(name, description, price);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to create product'
      );
    }

    return response.status(200).json({ name, description, price });
  } catch (error) {
    return next(error);
  }
}

async function updateProduct(request, response, next) {
  try {
    const { id } = request.params;
    const { name, description, price } = request.body;

    const success = await productsService.updateProduct(id, name, description, price);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to update product'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

async function deleteProduct(request, response, next) {
  try {
    const { id } = request.params;

    const success = await productsService.deleteProduct(id);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete product'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
