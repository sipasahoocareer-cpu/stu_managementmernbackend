/**
 * Generate pagination metadata and calculate skip value.
 * @param {Model} Model - Mongoose model to count documents
 * @param {object} filter - Query filter object
 * @param {number} page - Current page (1-based)
 * @param {number} limit - Items per page
 * @returns {{ skip, limitNum, pagination }}
 */
const getPagination = async (Model, filter = {}, page = 1, limit = 10) => {
  const limitNum = Math.min(Math.max(Number(limit), 1), 100); // Cap between 1 and 100
  const pageNum = Math.max(Number(page), 1);
  const skip = (pageNum - 1) * limitNum;

  const totalDocs = await Model.countDocuments(filter);
  const totalPages = Math.ceil(totalDocs / limitNum);

  const pagination = {
    currentPage: pageNum,
    totalPages,
    totalDocs,
    limit: limitNum,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  };

  return { skip, limitNum, pagination };
};

module.exports = { getPagination };
