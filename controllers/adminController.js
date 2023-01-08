const Admin = require("../models/admin");
const User = require("../models/user");
const Product = require("../models/product");
const Category = require("../models/category");
const router = require("../routes/userRoutes");
const Order = require("../models/order");
const mongoose = require("mongoose");
const Coupon = require("../models/coupon");
const moment = require("moment");
const { findByIdAndUpdate } = require("../models/cart");

module.exports = {
  getAdminLanding: (req, res) => {
    res.redirect("/admin/adminDashboard");
  },

  getAdminLogin: (req, res) => {
    if (!req.session.admin) {
      const loginErr = req.session.loginErr;
      req.session.loginErr = "";
      res.render("admin/adminLogin", { loginErr });
    } else {
      res.redirect("/admin/adminDashboard");
    }
  },

  postAdminLogin: async (req, res) => {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (admin) {
      if (email == admin.email && password == admin.password) {
        req.session.admin = admin._id;
        res.redirect("/admin/adminDashboard");
      } else {
        req.session.loginErr = "Invalid Credentials";
        res.redirect("/admin/login");
      }
    } else {
      req.session.loginErr = "Invalid Credentials";
      res.redirect("/admin/login");
    }
  },

  userDetails: async (req, res) => {
    const allUsers = await User.find({});
    res.render("admin/userDetails", { allUsers });
  },

  blockUser: async (req, res) => {
    const id = req.params.id;
    await User.findByIdAndUpdate(id, { isBlocked: true });
    res.redirect("/admin/userDetails");
  },

  unblockUser: async (req, res) => {
    const id = req.params.id;
    await User.findByIdAndUpdate(id, { isBlocked: false });
    res.redirect("/admin/userDetails");
  },

  productDetails: async (req, res) => {
    const allProducts = await Product.find({}).populate("category");
    console.log(allProducts);
    res.render("admin/productDetails", { allProducts });
  },

  getAddProduct: async (req, res) => {
    const productError = req.session.productErr;
    req.session.productErr = "";
    const categories = await Category.find({});
    res.render("admin/addProducts", { categories, productError });
  },

  postAddProduct: async (req, res) => {
    const name = req.body.name;
    console.log(req.body.name);
    const existingProduct = await Product.findOne({ name: name });
    console.log(existingProduct);
    if (existingProduct) {
      req.session.productErr = "Product already exists";
      res.redirect("/admin/addProducts");
    } else {
      const category = await Category.findById(req.body.category);
      console.log(req.body.category);
      console.log(category);
      console.log(req.body, req.files);
      // res.send("multer worked");
      const newProduct = new Product({
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        stock: req.body.stock,
        category: category,
      });
      newProduct.images = req.files.map((f) => ({
        url: f.path,
        filename: f.filename,
      }));
      await newProduct.save();
      console.log(newProduct);
      res.redirect("/admin/products");
    }
  },

  getEditProduct: async (req, res) => {
    try {
      const id = req.params.id;
      const product = await Product.findById(
        mongoose.Types.ObjectId(id)
      ).populate("category");
      const categories = await Category.find({});
      res.render("admin/editProducts", { product, categories });
    } catch (err) {
      console.error(err);
      res.status(404).render("admin/404Error");
    }
  },

  updateProduct: async (req, res) => {
    const id = req.params.id;
    const category = await Category.findById(req.body.category);
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        stock: req.body.stock,
        category: category,
      },
      { new: true, runValidators: true }
    );
    const images = req.files.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
    updatedProduct.images.push(...images);
    const deleteFilenames = req.body.deleteImages;
    if (deleteFilenames) {
      updatedProduct.images = updatedProduct.images.filter(
        (image) => !deleteFilenames.includes(image.filename)
      );
    }
    await updatedProduct.save();
    console.log(updatedProduct);
    res.redirect("/admin/products");
  },

  isActive: async (req, res) => {
    const id = req.params.id;
    await Product.findByIdAndUpdate(id, { isActive: false });
    res.redirect("/admin/products");
  },

  isInactive: async (req, res) => {
    const id = req.params.id;
    await Product.findByIdAndUpdate(id, { isActive: true });
    res.redirect("/admin/products");
  },

  getCategories: async (req, res) => {
    const categories = await Category.find({});
    res.render("admin/categories", { categories });
  },

  getAddCategory: (req, res) => {
    const categoryError = req.session.categoryErr;
    req.session.categoryErr = "";
    res.render("admin/addCategory", { categoryError });
  },

  postAddCategory: async (req, res) => {
    const name = req.body;
    const existingCategory = await Category.findOne(name);
    if (existingCategory) {
      req.session.categoryErr = "Category already exists";
      res.redirect("/admin/addCategory");
    } else {
      const newCategory = new Category(req.body);
      await newCategory.save();
      res.redirect("/admin/categories");
    }
  },

  getEditCategory: async (req, res) => {
    try {
      const id = req.params.id;
      const category = await Category.findById(id);
      res.render("admin/editCategory", { category });
    } catch (err) {
      console.error(err);
      res.status(404).render("admin/404Error");
    }
  },

  updateCategory: async (req, res) => {
    const id = req.params.id;
    await Category.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    res.redirect("/admin/categories");
  },

  isActiveCategory: async (req, res) => {
    const id = req.params.id;
    await Category.findByIdAndUpdate(id, { isActive: false });
    res.redirect("/admin/categories");
  },

  isInactiveCategory: async (req, res) => {
    const id = req.params.id;
    await Category.findByIdAndUpdate(id, { isActive: true });
    res.redirect("/admin/categories");
  },

  getOrders: async (req, res) => {
    const orders = await Order.find({});
    res.render("admin/orders", { orders });
  },

  viewOrderProducts: async (req, res) => {
    var orderId = req.params.id;
    console.log(orderId);
    let orderItems = await Order.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(orderId) },
      },

      {
        $unwind: "$products",
      },

      {
        $project: {
          productId: "$products.productId",
          quantity: "$products.quantity",
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },

      {
        $unwind: "$product",
      },
    ]);
    console.log(orderItems);
    var order = await Order.find({ _id: orderId });
    console.log(order[0].total);
    res.render("admin/viewOrderProducts", { orderItems, order });
  },

  getEditOrder: async (req, res) => {
    try {
      var orderId = req.params.id;
      const order = await Order.findOne({
        _id: mongoose.Types.ObjectId(orderId),
      });
      console.log(order);
      res.render("admin/editOrder", { order });
    } catch (err) {
      console.error(err);
      res.status(404).render("admin/404Error");
    }
  },

  updateOrder: async (req, res) => {
    var orderId = req.params.id;
    await Order.findByIdAndUpdate(
      orderId,
      {
        payment_status: req.body.payment_status,
        order_status: req.body.order_status,
      },
      { new: true, runValidators: true }
    );
    res.redirect("/admin/orders");
  },

  getCoupon: async (req, res) => {
    const coupons = await Coupon.find({});
    console.log(coupons);
    res.render("admin/coupon", { coupons });
  },

  addCoupon: async (req, res) => {
    const couponErr = req.session.couponErr;
    req.session.couponErr = "";
    res.render("admin/addCoupon", { couponErr });
  },

  postAddCoupon: async (req, res) => {
    console.log(req.body);
    const couponCodeName = req.body.coupon_code;
    const existingCoupon = await Coupon.findOne({
      couponCodeName: couponCodeName,
    });
    console.log(existingCoupon);
    if (existingCoupon) {
      req.session.couponErr = "Coupon already exists";
      res.redirect("/admin/addCoupon");
    } else {
      const newCoupon = new Coupon({
        couponCodeName: req.body.coupon_code,
        discountPrice: req.body.discount_price,
        minimumLimit: req.body.minimumLimit,
        maximumLimit: req.body.maximumLimit,
        expiryDate: req.body.expiry_date,
      });
      await newCoupon.save();
      res.redirect("/admin/coupons");
    }
  },

  getEditCoupon: async (req, res) => {
    try {
      const couponId = req.params.id;
      const coupon = await Coupon.findById(couponId);
      res.render("admin/editCoupon", { coupon });
    } catch (err) {
      console.error(err);
      res.status(404).render("admin/404Error");
    }
  },

  updateCoupon: async (req, res) => {
    const couponId = req.params.id;
    console.log(couponId);
    await Coupon.findByIdAndUpdate(
      couponId,
      {
        couponCodeName: req.body.couponCodeName,
        discountPrice: req.body.discountPrice,
        minimumLimit: req.body.minimumLimit,
        maximumLimit: req.body.maximumLimit,
        expiryDate: req.body.expiryDate,
      },
      { new: true, runValidators: true }
    );
    res.redirect("/admin/coupons");
  },

  isActiveCoupon: async (req, res) => {
    const couponId = req.params.id;
    await Coupon.findByIdAndUpdate(couponId, { isActive: false });
    res.redirect("/admin/coupons");
  },

  isInactiveCoupon: async (req, res) => {
    const couponId = req.params.id;
    await Coupon.findByIdAndUpdate(couponId, { isActive: true });
    res.redirect("/admin/coupons");
  },

  getAdminDashboard: async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    var totalIncome = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);
    if (totalIncome.length == 0) {
      totalIncome = 0;
    } else {
      totalIncome = totalIncome[0].total;
    }

    const Pending = await Order.find({ order_status: "Pending" }).count();
    const Shipped = await Order.find({ order_status: "Shipped" }).count();
    const Delivered = await Order.find({ order_status: "Delivered" }).count();
    const Cancelled = await Order.find({ order_status: "Cancelled" }).count();
    const COD = await Order.find({ payment_method: "COD" }).count();
    const Online = await Order.find({ payment_method: "Online" }).count();
    res.render("admin/adminDashboard", {
      totalUsers,
      totalProducts,
      totalOrders,
      totalIncome,
      Pending,
      Shipped,
      Delivered,
      Cancelled,
      COD,
      Online,
    });
  },

  getSalesReport: async (req, res) => {
    const totalSales = await Order.find({ order_status: "Delivered" });
    console.log(totalSales);
    res.render("admin/salesReport", { totalSales });
  },

  getDailySales: async (req, res) => {
    const currentDate = moment();
    const startOfDay = moment(currentDate).startOf("day");
    const endOfDay = moment(currentDate).endOf("day");

    const dailySales = await Order.find({
      order_status: "Delivered",
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });
    console.log(dailySales);
    res.render("admin/dailySales", { dailySales });
  },

  getMonthlySales: async (req, res) => {
    const currentDate = moment();
    const startOfMonth = moment(currentDate).startOf("month");
    const endOfMonth = moment(currentDate).endOf("month");

    const monthlySales = await Order.find({
      order_status: "Delivered",
      createdAt: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    });
    console.log(monthlySales);
    res.render("admin/monthlySales", { monthlySales });
  },

  getAdminLogout: (req, res) => {
    req.session.destroy();
    res.redirect("/admin/login");
  },
};
