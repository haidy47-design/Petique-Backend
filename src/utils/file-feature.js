export class ApiFeature {
  constructor(mongooseQuery, queryData) {
    this.mongooseQuery = mongooseQuery;
    this.queryData = queryData;
  }

  pagination() {
    let { page, size } = this.queryData;
    page = parseInt(page) || 1;
    size = parseInt(size) || 20;
    if (page <= 0) page = 1;
    if (size <= 0) size = 2;
    let skip = (page - 1) * size;
    this.mongooseQuery.limit(size).skip(skip);
    return this;
  }
  sort() {
    this.mongooseQuery.sort(this.queryData.sort?.replaceAll(",", " "));
    return this;
  }

  select() {
    this.mongooseQuery.select(this.queryData.select?.replaceAll(",", " "));
    return this;
  }

  filter() {
    let { page, limit, sort, size, select, ...filter } = this.queryData;
    filter = JSON.parse(
      JSON.stringify(filter).replace(/gt|gte|lt|lte/g, (match) => `$${match}`)
    );
    this.mongooseQuery.find(filter);
    return this;
  }

  search() {
    if (this.queryData.keyword) {
      const keyword = this.queryData.keyword;
      const searchFields = [
        "userName",
        "name",
        "description",
        "title",
        "code",
        "email",
        "mobileNumber",
        "address",
        "coupon",
        "user",
        "product",
        "comment",
        "discount",
        "category",
        "status",
        "benefits",
        "tips",
        "pet",
        "petOwner",
        "service"
      ];
      const searchQuery = {
        $or: searchFields.map((field) => ({
          [field]: { $regex: keyword, $options: "i" },
        })),
      };
      this.mongooseQuery.find(searchQuery);
    }
    return this;
  }
}
