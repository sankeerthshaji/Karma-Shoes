const bcrypt = require("bcrypt");
const User = require("../models/user");
const Product = require("../models/product");
const Category = require("../models/category");
const mailer = require("../middlewares/otp");
const Cart = require("../models/cart");
const Wishlist = require("../models/wishlist");
const mongoose = require("mongoose");
const Order = require("../models/order");
const Coupon = require("../models/coupon");
const moment = require("moment");
moment().format();
const Razorpay = require("razorpay");
const { findById } = require("../models/order");
const { findByIdAndUpdate } = require("../models/product");

module.exports = {
  getLanding: async (req, res, next) => {
    let user = req.session.user;
    let userId = req.session.user;
    let categories = await Category.find({});
    let coupon = await Coupon.find({});
    var count = 0;
    if (req.session.user) {
      var count = 0;
      var userr = await User.findOne({ _id: userId });
      const blocked = userr.isBlocked;
      if (blocked === true) {
        req.session.destroy();
        res.redirect("/login");
      } else {
        let cart = await Cart.findOne({ userId });
        if (cart) {
          var count = await Cart.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            { $project: { products: { $size: "$products" } } },
          ]);
          count = count[0].products;
        } else {
          count = 0;
        }
        const allProducts = await Product.find({})
          .limit(8)
          .populate("category");
        res.render("user/index", {
          user,
          allProducts,
          count,
          categories,
          coupon,
        });
      }
    } else {
      const allProducts = await Product.find({}).limit(8).populate("category");
      res.render("user/index", {
        user,
        allProducts,
        count,
        categories,
        coupon,
      });
    }
  },

  getLogin: async (req, res) => {
    let user = req.session.user;
    let categories = await Category.find({});
    if (!user) {
      var count = 0;
      res.render("user/userLogin", { user, count, categories });
    } else {
      res.redirect("/");
    }
  },

  getSignup: async (req, res) => {
    let user;
    let categories = await Category.find({});
    var count = 0;
    res.render("user/userSignup", { user: "", count, categories });
  },

  postSignup: async (req, res) => {
    userDetails = req.body;
    let categories = await Category.find({});
    let mailDetails = {
      from: "karmashoestore@gmail.com",
      to: userDetails.email,
      subject: "KARMA ACCOUNT REGISTRATION",
      html: `<p>YOUR OTP FOR REGISTERING IN KARMA IS ${mailer.OTP}</p>`,
    };
    User.findOne({
      $or: [{ email: userDetails.email }, { mobile: userDetails.mobile }],
    }).then((result) => {
      console.log(result);
      if (result) {
        var count = 0;
        res.render("user/userSignup", {
          user: "",
          count,
          categories,
          err_message: "Email or Mobile already exists",
        });
      } else {
        mailer.mailTransporter.sendMail(mailDetails, function (err, data) {
          if (err) {
            console.log(err);
          } else {
            console.log("Email Sent Successfully");
            res.render("user/otp", { userDetails });
            console.log(data);
          }
        });
      }
    });
  },

  postLogin: async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const blocked = user.isBlocked;
      if (blocked === false) {
        const validPassword = await bcrypt.compare(password, user.password);
        if (validPassword) {
          req.session.user = user._id;
          res.redirect("/");
        } else {
          var count = 0;
          let categories = await Category.find({});
          res.render("user/userLogin", {
            user: "",
            count,
            categories,
            err_message1: "Invalid Credentials",
          });
        }
      } else {
        var count = 0;
        let categories = await Category.find({});
        res.render("user/userLogin", {
          user: "",
          count,
          categories,
          err_message1: "",
          err_message2: "You are Blocked",
        });
      }
    } else {
      var count = 0;
      let categories = await Category.find({});
      res.render("user/userLogin", {
        user: "",
        count,
        categories,
        err_message1: "",
        err_message2: "",
        err_message3: "Email does not exists",
      });
    }
  },

  postOtp: async (req, res) => {
    let categories = await Category.find({});
    let userDetails = req.body;
    let otp = userDetails.otp;
    console.log(otp);
    console.log(mailer.OTP);
    if (mailer.OTP == otp) {
      console.log("matched");
      const hash = await bcrypt.hash(userDetails.password, 10);
      const user = new User({
        username: userDetails.username,
        email: userDetails.email,
        mobile: userDetails.mobile,
        password: hash,
      });
      console.log(user);
      user.save().then(() => {
        req.session.user = user._id;
        res.redirect("/");
      });
    } else {
      res.render("user/otp", {
        userDetails,
        categories,
        err_message:
          "The number that you've entered doesn't match your code. Please try again.",
      });
      console.log("error");
    }
  },

  detailPage: async (req, res) => {
    try {
      let categories = await Category.find({});
      let user = req.session.user;
      const id = req.params.id;
      const product = await Product.findById(id).populate("category");
      let userId = req.session.user;
      var count = 0;
      if (req.session.user) {
        var count = 0;
        let cart = await Cart.findOne({ userId });
        if (cart) {
          var count = await Cart.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            { $project: { products: { $size: "$products" } } },
          ]);
          count = count[0].products;
        } else {
          count = 0;
        }
      }
      res.render("user/detailPage", { user, product, count, categories });
    } catch (err) {
      console.error(err);
      res.status(404).render("user/404Error");
    }
  },

  getCart: async (req, res) => {
    let user;
    const userId = req.session.user;
    console.log(userId);
    const productId = req.params.id;
    console.log(productId);

    let proObj = {
      productId: productId,
      quantity: 1,
    };
    let userCart = await Cart.findOne({ userId });
    if (userCart) {
      let proExists = userCart.products.findIndex(
        (product) => product.productId == productId
      );
      console.log("cart" + proExists);
      if (proExists != -1) {
        res.json({ existingProduct: true });
      } else {
        await Cart.updateOne(
          { userId: userId },
          { $push: { products: proObj } }
        )
          .then(() => {
            res.json({ status: true });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } else {
      const cart = new Cart({
        userId: userId,
        products: [proObj],
      });
      await cart
        .save()
        .then(() => {
          console.log(cart);
          res.json({ status: true });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  },

  getCartProducts: async (req, res) => {
    let user = req.session.user;
    var count = 0;
    let categories = await Category.find({});
    const userId = req.session.user;
    let cart = await Cart.findOne({ userId });
    if (cart) {
      var count = await Cart.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $project: { products: { $size: "$products" } } },
      ]);
      count = count[0].products;
      if (count == 0) {
        res.render("user/cartEmpty", { user, count, categories });
      } else {
        let cartItems = await Cart.aggregate([
          {
            $match: { userId: mongoose.Types.ObjectId(userId) },
          },

          {
            $unwind: "$products",
          },

          {
            $project: {
              userId: "$userId",
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

          // {
          //   $lookup: {
          //     from: "products",
          //     let: { prodList: "$products.productId" },
          //     pipeline: [
          //       {
          //         $match: {
          //           $expr: {
          //             $in: ["$_id", "$$prodList"],
          //           },
          //         },
          //       },
          //     ],
          //     as: "cartItems",
          //   },
          // },
        ]);

        total = await Cart.aggregate([
          {
            $match: { userId: mongoose.Types.ObjectId(userId) },
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

          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
            },
          },
        ]);

        console.log(cartItems);
        const cartProducts = cartItems;
        console.log(total[0].total);
        const totalSum = total[0].total;
        res.render("user/cart", {
          user,
          cartProducts,
          totalSum,
          count,
          categories,
        });
      }
    } else {
      console.log(count);
      res.render("user/cartEmpty", { user, count, categories });
    }
  },

  changeProductQuantity: async (req, res) => {
    const details = req.body;
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    if (details.count == -1 && details.quantity == 1) {
      const cart = await Cart.updateOne(
        { _id: details.cartId },
        {
          $pull: { products: { productId: details.productId } },
        }
      ).then(() => {
        res.json({ removeProduct: true });
      });
    } else {
      await Cart.updateOne(
        { _id: details.cartId, "products.productId": details.productId },
        {
          $inc: { "products.$.quantity": details.count },
        }
      ).then(async () => {
        var total = await Cart.aggregate([
          {
            $match: { userId: mongoose.Types.ObjectId(details.userId) },
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

          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
            },
          },
        ]);
        res.json({ status: true, total });
      });
    }
  },

  getWishlist: async (req, res) => {
    let user;
    const userId = req.session.user;
    const productId = req.params.id;
    if (req.session.user) {
      let proObj = {
        productId: productId,
      };
      let userWishlist = await Wishlist.findOne({ userId });
      if (userWishlist) {
        let proExists = userWishlist.products.findIndex(
          (product) => product.productId == productId
        );
        console.log(proExists);
        if (proExists != -1) {
          res.json({ existingProduct: true });
        } else {
          await Wishlist.updateOne(
            { userId: userId },
            { $push: { products: proObj } }
          )
            .then(() => {
              res.json({ status: true });
            })
            .catch((err) => {
              console.log(err);
            });
        }
      } else {
        const wishlist = new Wishlist({
          userId: userId,
          products: [proObj],
        });
        await wishlist
          .save()
          .then(() => {
            res.json({ status: true });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } else {
      res.redirect("/login");
    }
  },

  getWishlistProducts: async (req, res) => {
    let user = req.session.user;
    var count = 0;
    let categories = await Category.find({});
    const userId = req.session.user;
    let wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      let cart = await Cart.findOne({ userId });
      if (cart) {
        var count = await Cart.aggregate([
          { $match: { userId: mongoose.Types.ObjectId(userId) } },
          { $project: { products: { $size: "$products" } } },
        ]);
        count = count[0].products;
        console.log(count);
      } else {
        count = 0;
      }
      var wishlistCount = await Wishlist.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $project: { products: { $size: "$products" } } },
      ]);
      wishlistCount = wishlistCount[0].products;
      console.log(wishlistCount);
      if (wishlistCount == 0) {
        res.render("user/wishlistEmpty", { user, count, categories });
      } else {
        let wishlistItems = await Wishlist.aggregate([
          {
            $match: { userId: mongoose.Types.ObjectId(userId) },
          },

          {
            $unwind: "$products",
          },

          {
            $project: {
              userId: "$userId",
              productId: "$products.productId",
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
        console.log(wishlistItems);
        const wishlistProducts = wishlistItems;
        res.render("user/wishlist", {
          user,
          wishlistProducts,
          count,
          categories,
        });
      }
    } else {
      console.log(count);
      res.render("user/wishlistEmpty", { user, count, categories });
    }
  },

  wishlistProductRemove: async (req, res) => {
    const details = req.body;
    details.count = parseInt(details.count);
    const wishlist = await Wishlist.updateOne(
      { _id: details.cartId },
      {
        $pull: { products: { productId: details.productId } },
      }
    ).then(() => {
      res.json({ removeProductWishlist: true });
    });
  },

  productRemove: async (req, res) => {
    const details = req.body;
    details.count = parseInt(details.count);
    const cart = await Cart.updateOne(
      { _id: details.cartId },
      {
        $pull: { products: { productId: details.productId } },
      }
    ).then(() => {
      res.json({ removeProduct: true });
    });
  },

  shopByCategory: async (req, res) => {
    try {
      const { category } = req.query;
      if (category) {
        const catId = req.query.category;
        const category = await Category.findById(
          mongoose.Types.ObjectId(catId)
        );
        let user = req.session.user;
        // const products = await Product.find({ category }).populate("category");
        // console.log(products);
        var perPage = 6;
        var pageNum = 1;
        var docCount = await Product.countDocuments({ category });
        console.log(docCount);
        var products = await Product.find({ category }).populate("category");
        console.log(products);
        var pages = Math.ceil(docCount / perPage);
        console.log(pages);
        const categories = await Category.find({ isActive: true });
        let userId = req.session.user;
        var count = 0;
        if (req.session.user) {
          var count = 0;
          let cart = await Cart.findOne({ userId });
          if (cart) {
            var count = await Cart.aggregate([
              { $match: { userId: mongoose.Types.ObjectId(userId) } },
              { $project: { products: { $size: "$products" } } },
            ]);
            count = count[0].products;
            console.log(count);
          } else {
            console.log(count);
          }
        }
        res.render("user/shopByCategory", {
          user,
          products,
          categories,
          category,
          count,
          pages,
        });
      }
    } catch (err) {
      console.error(err);
      res.status(404).render("user/404Error");
    }
  },

  shop: async (req, res) => {
    let user = req.session.user;
    const categories = await Category.find({ isActive: true });
    let userId = req.session.user;
    var count = 0;
    if (req.session.user) {
      var count = 0;
      let cart = await Cart.findOne({ userId });
      if (cart) {
        var count = await Cart.aggregate([
          { $match: { userId: mongoose.Types.ObjectId(userId) } },
          { $project: { products: { $size: "$products" } } },
        ]);
        count = count[0].products;
        console.log(count);
      } else {
        console.log(count);
      }
    }

    if (req.query.searchProduct) {
      const { searchProduct } = req.query;
      console.log(searchProduct);
      const searchResults = await Product.find({
        $and: [
          { isActive: "true" },
          {
            name: new RegExp(searchProduct, "i"),
          },
        ],
      }).populate("category");
      console.log(searchResults);
      res.render("user/shopBySearch", {
        user,
        categories,
        count,
        searchResults,
      });
    } else {
      var perPage = 6;
      var pageNum = 1;
      if (req.query.page) {
        pageNum = req.query.page;
      }
      var docCount = await Product.countDocuments();
      console.log(docCount);
      var products = await Product.find({})
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .populate("category");
      console.log(products);
      var pages = Math.ceil(docCount / perPage);
      console.log(pages);
      res.render("user/shop", {
        user,
        categories,
        count,
        products,
        pages,
        pageNum,
      });
    }
  },

  sorting: async (req, res) => {
    console.log(req.body);
    const data = req.body;
    if (data.selectId == "1") {
      const category = await Category.findById(data.catId);
      const sortedProducts = await Product.find({
        $and: [{ isActive: "true" }, { category }],
      })
        .sort({ price: 1 })
        .populate("category");
      console.log(sortedProducts);
      res.json({ status: true, sortedProducts });
    } else if (data.selectId == "-1") {
      const category = await Category.findById(data.catId);
      const sortedProducts = await Product.find({
        $and: [{ isActive: "true" }, { category }],
      })
        .sort({ price: -1 })
        .populate("category");
      console.log(sortedProducts);
      res.json({ status: true, sortedProducts });
    } else if (data.selectId == "default") {
      const category = await Category.findById(data.catId);
      const sortedProducts = await Product.find({
        $and: [{ isActive: "true" }, { category }],
      }).populate("category");
      console.log(sortedProducts);
      res.json({ status: true, sortedProducts });
    }
  },

  allSorting: async (req, res) => {
    console.log(req.body);
    const data = req.body;
    if (data.selectId == "1") {
      const sortedProducts = await Product.find({ isActive: "true" })
        .sort({ price: 1 })
        .populate("category");
      console.log(sortedProducts);
      res.json({ status: true, sortedProducts });
    } else if (data.selectId == "-1") {
      const sortedProducts = await Product.find({ isActive: "true" })
        .sort({ price: -1 })
        .populate("category");
      console.log(sortedProducts);
      res.json({ status: true, sortedProducts });
    } else if (data.selectId == "default") {
      const sortedProducts = await Product.find({ isActive: "true" }).populate(
        "category"
      );
      console.log(sortedProducts);
      res.json({ status: true, sortedProducts });
    }
  },

  userProfile: async (req, res) => {
    let user = req.session.user;
    var count = 0;
    let categories = await Category.find({});
    let userId = req.session.user;
    let cart = await Cart.findOne({ userId });
    if (cart) {
      var count = await Cart.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $project: { products: { $size: "$products" } } },
      ]);
      count = count[0].products;
      console.log(count);
    } else {
      console.log(count);
    }
    const userDetails = await User.find({ _id: userId });
    console.log(userDetails);
    const addresses = userDetails[0].address;
    res.render("user/userProfile", {
      user,
      userId,
      count,
      categories,
      userDetails,
      addresses,
    });
  },

  getAddAddress: async (req, res) => {
    let user = req.session.user;
    var count = 0;
    let categories = await Category.find({});
    let userId = req.session.user;
    let cart = await Cart.findOne({ userId });
    if (cart) {
      var count = await Cart.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $project: { products: { $size: "$products" } } },
      ]);
      count = count[0].products;
      console.log(count);
    } else {
      count = 0;
    }
    res.render("user/addAddress", { user, count, categories });
  },

  postAddAddress: async (req, res) => {
    const userId = req.session.user;
    console.log(userId);
    console.log(req.body);
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          address: [
            {
              houseName: req.body.houseName,
              area: req.body.area,
              landmark: req.body.landmark,
              city: req.body.city,
              state: req.body.state,
              country: req.body.country,
              pincode: req.body.pincode,
            },
          ],
        },
      }
    );
    res.redirect("/userProfile");
  },

  getEditAddress: async (req, res) => {
    try {
      let user = req.session.user;
      var count = 0;
      let categories = await Category.find({});
      let userId = req.session.user;
      let cart = await Cart.findOne({ userId });
      if (cart) {
        var count = await Cart.aggregate([
          { $match: { userId: mongoose.Types.ObjectId(userId) } },
          { $project: { products: { $size: "$products" } } },
        ]);
        count = count[0].products;
        console.log(count);
      } else {
        count = 0;
      }
      const id = req.params.id;
      User.findOne({
        address: { $elemMatch: { _id: mongoose.Types.ObjectId(id) } },
      })
        .select("address.$")
        .exec(function (err, address) {
          if (err) {
            console.log(err);
          } else {
            console.log(address);
            const addressDetails = address.address[0];
            console.log(addressDetails);
            // Render the template and pass the address as a local variable
            res.render("user/editAddress", {
              addressDetails,
              count,
              user,
              categories,
            });
          }
        });
    } catch (err) {
      console.error(err);
      res.status(404).render("user/404Error");
    }
  },

  updateAddress: async (req, res) => {
    const id = req.params.id;
    User.findOneAndUpdate(
      { address: { $elemMatch: { _id: id } } },
      {
        $set: {
          "address.$.houseName": req.body.houseName,
          "address.$.area": req.body.area,
          "address.$.landmark": req.body.landmark,
          "address.$.city": req.body.city,
          "address.$.state": req.body.state,
          "address.$.country": req.body.country,
          "address.$.pincode": req.body.pincode,
        },
      }
    ).then((data, err) => {
      if (data) {
        console.log(data);
      } else {
        console.log(err);
      }
    });
    res.redirect("/userProfile");
  },

  deleteAddress: async (req, res) => {
    const id = req.params.id;
    const userId = req.session.user;
    await User.update(
      {
        userId: userId,
      },
      {
        $pull: { address: { _id: id } },
      }
    )
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.log(error);
      });
    res.redirect("/userProfile");
  },

  coupon: async (req, res) => {
    const details = req.body;
    const coupon = await Coupon.findOne({ couponCodeName: details.coupon });
    console.log(coupon);
    if (coupon) {
      await Coupon.findOne({
        couponCodeName: details.coupon,
        userId: details.userId,
      }).then((data, err) => {
        if (data) {
          res.json({ existingUser: true });
        } else {
          let todaysDate = new Date();
          let expiryDate = coupon.expiryDate;
          let expiryDateISO = new Date(expiryDate);
          if (coupon.isActive === true) {
            if (todaysDate.getTime() < expiryDateISO.getTime()) {
              if (details.totalSum > coupon.minimumLimit) {
                if (details.totalSum < coupon.maximumLimit) {
                  let discount = coupon.discountPrice;
                  discount = parseInt(discount);
                  const discountPercentage = discount / 100;
                  totalSum = Math.round(
                    details.totalSum - details.totalSum * discountPercentage
                  );
                  // totalSum = details.totalSum - discountPrice;
                  console.log(totalSum);
                  res.json({ status: true, totalSum });
                } else {
                  res.json({ maximumLimit: true });
                }
              } else {
                res.json({ minimumLimit: true });
              }
            } else {
              res.json({ couponExpired: true });
            }
          } else {
            res.json({ status: false });
          }
        }
      });
    } else {
      res.json({ status: false });
    }
  },

  checkout: async (req, res) => {
    let user = req.session.user;
    var count = 0;
    let categories = await Category.find({});
    const userId = req.session.user;
    let cart = await Cart.findOne({ userId: userId });
    if (cart) {
      let products = cart.products;
      console.log(products);
      var totalSum = 0;
      if (products) {
        var count = await Cart.aggregate([
          { $match: { userId: mongoose.Types.ObjectId(userId) } },
          { $project: { products: { $size: "$products" } } },
        ]);
        count = count[0].products;

        let cartItems = await Cart.aggregate([
          {
            $match: { userId: mongoose.Types.ObjectId(userId) },
          },

          {
            $unwind: "$products",
          },

          {
            $project: {
              userId: "$userId",
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

        total = await Cart.aggregate([
          {
            $match: { userId: mongoose.Types.ObjectId(userId) },
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

          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
            },
          },
        ]);

        const userDetails = await User.find({ _id: userId });
        const username = userDetails[0].username;
        const addresses = userDetails[0].address;
        console.log(addresses);
        const cartProducts = cartItems;
        if (count > 0) {
          totalSum = total[0].total;
        }
        res.render("user/checkout", {
          user,
          username,
          addresses,
          cartProducts,
          totalSum,
          count,
          categories,
        });
      }
    } else {
      res.redirect("/cart");
    }
  },

  getAddAddressCheckout: async (req, res) => {
    let user = req.session.user;
    var count = 0;
    let categories = await Category.find({});
    let userId = req.session.user;
    let cart = await Cart.findOne({ userId });
    if (cart) {
      var count = await Cart.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $project: { products: { $size: "$products" } } },
      ]);
      count = count[0].products;
      console.log(count);
    } else {
      console.log(count);
    }
    res.render("user/addAddressCheckout", { user, count, categories });
  },

  postAddAddressCheckout: async (req, res) => {
    const userId = req.session.user;
    console.log(userId);
    console.log(req.body);
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          address: [
            {
              houseName: req.body.houseName,
              area: req.body.area,
              landmark: req.body.landmark,
              city: req.body.city,
              state: req.body.state,
              country: req.body.country,
              pincode: req.body.pincode,
            },
          ],
        },
      }
    );
    res.redirect("/checkout");
  },

  postCheckout: async (req, res) => {
    let userId = req.session.user;
    const orderDetails = req.body;
    console.log(orderDetails);
    let cart = await Cart.findOne({ userId: orderDetails.userId });
    let products = cart.products;
    console.log(products);
    console.log(orderDetails.coupon);
    if (orderDetails.coupon) {
      const coupon = await Coupon.findOne({
        couponCodeName: orderDetails.coupon,
      });
      if (coupon) {
        let expiryDate = coupon.expiryDate;
        let expiryDateISO = new Date(expiryDate);
        console.log("expiry date in iso " + expiryDateISO);
        const couponNotExpired = await Coupon.findOne({
          couponCodeName: orderDetails.coupon,
          expiryDate: { $lt: expiryDateISO },
        });
        if (couponNotExpired) {
          let discount = coupon.discountPrice;
          discount = parseInt(discount);
          const discountPercentage = discount / 100;
          console.log("discountPercentage" + discountPercentage);
          let total = await Cart.aggregate([
            {
              $match: { userId: mongoose.Types.ObjectId(orderDetails.userId) },
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

            {
              $group: {
                _id: null,
                total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
              },
            },
          ]);
          var totalSum = total[0].total;
          totalSum = Math.round(totalSum - totalSum * discountPercentage);
          console.log(totalSum);
          let address = orderDetails.address;
          if (typeof address === "undefined") {
            res.json({ noAddress: true });
          } else {
            // res.json({ status: true, totalSum });
            if (orderDetails.payment_method === "COD") {
              let status = "Pending";
              console.log(status);

              let order = new Order({
                address: orderDetails.address,
                userId: orderDetails.userId,
                username: orderDetails.username,
                products: products,
                total: totalSum,
                payment_method: orderDetails.payment_method,
                payment_status: orderDetails.payment_status,
                order_status: status,
                orderDate: moment().format("MMM Do YY"),
                deliveryDate: moment().add(3, "days").format("MMM Do YY"),
              });

              await order.save().then(() => {
                console.log(order);
              });

              await Coupon.updateOne(
                { couponCodeName: orderDetails.coupon },
                {
                  $push: {
                    userId: orderDetails.userId,
                  },
                }
              ).then((data) => {
                console.log(data);
              });
              res.json({ status: true });
              await Cart.deleteOne({ userId: orderDetails.userId }).then(
                (data) => {
                  console.log(data);
                }
              );
            } else if (orderDetails.payment_method === "Online") {
              let status = "Pending";
              console.log(status);

              let order = new Order({
                address: orderDetails.address,
                userId: orderDetails.userId,
                username: orderDetails.username,
                products: products,
                total: totalSum,
                payment_method: orderDetails.payment_method,
                payment_status: orderDetails.payment_status,
                order_status: status,
                orderDate: moment().format("MMM Do YY"),
                deliveryDate: moment().add(3, "days").format("MMM Do YY"),
              });

              await order.save().then(() => {
                console.log(order);
              });

              await Coupon.updateOne(
                { couponCodeName: orderDetails.coupon },
                {
                  $push: {
                    userId: orderDetails.userId,
                  },
                }
              ).then((data) => {
                console.log(data);
              });

              console.log(order._id);

              var instance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
              });

              var options = {
                amount: totalSum * 100, // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + order._id,
              };

              instance.orders.create(options, function (err, order) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(order);
                  res.json({ status: false, order });
                }
              });
            }
          }
        }
      }
    } else {
      let total = await Cart.aggregate([
        {
          $match: { userId: mongoose.Types.ObjectId(orderDetails.userId) },
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

        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
          },
        },
      ]);
      totalSum = total[0].total;

      // let status = orderDetails.payment_method === "COD" ? "placed" : "pending";
      let address = orderDetails.address;
      if (typeof address === "undefined") {
        res.json({ noAddress: true });
      } else {
        if (orderDetails.payment_method === "COD") {
          let status = "Pending";
          console.log(status);

          let order = new Order({
            address: orderDetails.address,
            userId: orderDetails.userId,
            username: orderDetails.username,
            products: products,
            total: totalSum,
            payment_method: orderDetails.payment_method,
            payment_status: orderDetails.payment_status,
            order_status: status,
            orderDate: moment().format("MMM Do YY"),
            deliveryDate: moment().add(3, "days").format("MMM Do YY"),
          });

          await order.save().then(() => {
            console.log(order);
          });

          res.json({ status: true });
          await Cart.deleteOne({ userId: orderDetails.userId }).then((data) => {
            console.log(data);
          });
        } else if (orderDetails.payment_method === "Online") {
          let status = "Pending";
          console.log(status);

          let order = new Order({
            address: orderDetails.address,
            userId: orderDetails.userId,
            username: orderDetails.username,
            products: products,
            total: totalSum,
            payment_method: orderDetails.payment_method,
            payment_status: orderDetails.payment_status,
            order_status: status,
            orderDate: moment().format("MMM Do YY"),
            deliveryDate: moment().add(3, "days").format("MMM Do YY"),
          });

          await order.save().then(() => {
            console.log(order);
          });

          console.log(order._id);
          var instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });
          var options = {
            amount: totalSum * 100, // amount in the smallest currency unit
            currency: "INR",
            receipt: "" + order._id,
          };
          instance.orders.create(options, function (err, order) {
            if (err) {
              console.log(err);
            } else {
              console.log(order);
              res.json({ status: false, order });
            }
          });
        }
      }
    }
  },

  verifyPayment: async (req, res) => {
    const details = req.body;
    console.log(details);
    // console.log(details.payment.razorpay_payment_id)
    const crypto = require("crypto");
    let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(
      details.payment.razorpay_order_id +
        "|" +
        details.payment.razorpay_payment_id
    );
    hmac = hmac.digest("hex");
    if (hmac == details.payment.razorpay_signature) {
      await Order.findOneAndUpdate(
        { _id: mongoose.Types.ObjectId(details.order.receipt) },
        {
          $set: {
            payment_status: "Paid",
          },
        }
      );
      console.log("Payment successful!!");
      res.json({ status: true });
      let orderDetails = await Order.findOne({
        _id: mongoose.Types.ObjectId(details.order.receipt),
      });

      await Cart.deleteOne({ userId: orderDetails.userId }).then((data) => {
        console.log(data);
      });
    } else {
      console.log("Payment failed");
      res.json({ status: false });
    }
  },

  confirmation: async (req, res) => {
    let user = req.session.user;
    var count = 0;
    let categories = await Category.find({});
    res.render("user/confirmation", { user, count, categories });
  },

  paymentFailed: async (req, res) => {
    let user = req.session.user;
    let userId = req.session.user;
    var count = 0;
    let categories = await Category.find({});
    if (req.session.user) {
      var count = 0;
      let cart = await Cart.findOne({ userId });
      if (cart) {
        var count = await Cart.aggregate([
          { $match: { userId: mongoose.Types.ObjectId(userId) } },
          { $project: { products: { $size: "$products" } } },
        ]);
        count = count[0].products;
        console.log(count);
      } else {
        console.log(count);
      }
    }
    res.render("user/paymentFailed", { user, count, categories });
  },

  orderDetails: async (req, res) => {
    let user = req.session.user;
    let userId = req.session.user;
    var count = 0;
    let categories = await Category.find({});
    let cart = await Cart.findOne({ userId });
    if (cart) {
      var count = await Cart.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $project: { products: { $size: "$products" } } },
      ]);
      count = count[0].products;
      console.log(count);
    } else {
      console.log(count);
    }
    var orders = await Order.find({ userId: userId });
    console.log(orders);
    if (orders == "") {
      res.render("user/noOrders", { user, count, categories });
    } else {
      res.render("user/viewOrders", { user, count, orders, categories });
    }
  },

  viewOrderProducts: async (req, res) => {
    try {
      let user = req.session.user;
      let userId = req.session.user;
      var count = 0;
      let categories = await Category.find({});
      if (req.session.user) {
        var count = 0;
        let cart = await Cart.findOne({ userId });
        if (cart) {
          var count = await Cart.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            { $project: { products: { $size: "$products" } } },
          ]);
          count = count[0].products;
          console.log(count);
        } else {
          console.log(count);
        }
      }
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
      res.render("user/viewOrderProducts", {
        user,
        count,
        orderItems,
        order,
        categories,
      });
    } catch (err) {
      console.error(err);
      res.status(404).render("user/404Error");
    }
  },

  orderCancel: async (req, res) => {
    let orderId = req.body.orderId;
    await Order.findByIdAndUpdate(
      mongoose.Types.ObjectId(orderId),
      {
        order_status: "Cancelled",
      },
      { new: true, runValidators: true }
    );
    res.json({ status: true });
  },

  addImage: async (req, res) => {
    let user = req.session.user;
    let userId = req.session.user;
    var count = 0;
    let categories = await Category.find({});
    if (req.session.user) {
      var count = 0;
      let cart = await Cart.findOne({ userId });
      if (cart) {
        var count = await Cart.aggregate([
          { $match: { userId: mongoose.Types.ObjectId(userId) } },
          { $project: { products: { $size: "$products" } } },
        ]);
        count = count[0].products;
        console.log(count);
      } else {
        count = 0;
      }
      var userDetails = await User.findById(userId);
    }
    res.render("user/add-image", {
      count,
      user,
      userId,
      categories,
      userDetails,
    });
  },

  updateProfile: async (req, res) => {
    const id = req.params.id;
    console.log(req.file);
    await User.findByIdAndUpdate(id, {
      image: {
        url: req.file.path,
        filename: req.body.filename,
      },
    });
    res.redirect("/userProfile");
  },

  getForgotPassword: async (req, res) => {
    let user = req.session.user;
    let userId = req.session.user;
    var count = 0;
    let categories = await Category.find({});
    if (req.session.user) {
      var count = 0;
      let cart = await Cart.findOne({ userId });
      if (cart) {
        var count = await Cart.aggregate([
          { $match: { userId: mongoose.Types.ObjectId(userId) } },
          { $project: { products: { $size: "$products" } } },
        ]);
        count = count[0].products;
        console.log(count);
      } else {
        console.log(count);
      }
    }
    res.render("user/emailVerification", { count, user, categories });
  },

  postForgotPassword: async (req, res) => {
    var count = 0;
    let categories = await Category.find({});
    data = req.body;
    console.log(data);
    let mailDetails = {
      from: "karmashoestore@gmail.com",
      to: data.email,
      subject: "Email Verification",
      html: `<p>YOUR OTP FOR CONFIRMING YOUR EMAIL ADDRESS IS ${mailer.OTP}</p>`,
    };
    await User.findOne({ email: data.email }).then((result) => {
      console.log(result);
      if (result) {
        mailer.mailTransporter.sendMail(mailDetails, function (err, data) {
          if (err) {
            console.log("Error Occurs");
          } else {
            console.log("Otp Sent Successfully");
            res.render("user/forgotPasswordOtp", {
              data: req.body,
              count,
              categories,
              user: "",
            });
            console.log(data);
          }
        });
      } else {
        res.render("user/emailVerification", {
          user: "",
          count,
          categories,
          err_message: "Please check the Email address and try again.",
        });
      }
    });
  },

  postForgotPasswordOtp: async (req, res) => {
    var count = 0;
    let categories = await Category.find({});
    let otp = req.body.otp;
    let email = req.body.email;
    console.log(otp);
    console.log(mailer.OTP);
    if (mailer.OTP == otp) {
      console.log("matched");
      res.render("user/resetPassword", { count, categories, email, user: "" });
    } else {
      res.render("user/forgotPasswordOtp", {
        data: "",
        user: "",
        count,
        categories,
        err_message:
          "The number that you've entered doesn't match your code. Please try again.",
      });
      console.log("error");
    }
  },

  postResetPassword: async (req, res) => {
    let email = req.body.email;
    var count = 0;
    let categories = await Category.find({});
    let USER = await User.findOne({ email: email });
    const validPassword = await bcrypt.compare(
      req.body.newPassword,
      USER.password
    );
    if (!validPassword) {
      if (req.body.newPassword == req.body.confirmPassword) {
        const hash = await bcrypt.hash(req.body.confirmPassword, 10);
        await User.findOneAndUpdate(
          { email: email },
          {
            password: hash,
          }
        ).then(() => {
          res.render("user/userLogin", { user: "", count, categories });
        });
      } else {
        res.render("user/resetPassword", {
          count,
          categories,
          email,
          user: "",
          err_message2: "Passwords do not match.",
        });
      }
    } else {
      res.render("user/resetPassword", {
        count,
        categories,
        email,
        user: "",
        err_message1:
          "You used this password recently. Please choose a different one.",
      });
    }
  },

  getChangePassword: async (req, res) => {
    let user = req.session.user;
    var count = 0;
    let categories = await Category.find({});
    let userId = req.session.user;
    let cart = await Cart.findOne({ userId });
    if (cart) {
      var count = await Cart.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $project: { products: { $size: "$products" } } },
      ]);
      count = count[0].products;
      console.log(count);
    } else {
      console.log(count);
    }
    res.render("user/changePassword", { count, user, categories });
  },

  postChangePassword: async (req, res) => {
    let user = req.session.user;
    var count = 0;
    let categories = await Category.find({});
    let userId = req.session.user;
    let cart = await Cart.findOne({ userId });
    if (cart) {
      var count = await Cart.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $project: { products: { $size: "$products" } } },
      ]);
      count = count[0].products;
      console.log(count);
    } else {
      console.log(count);
    }
    let USER = await User.findOne({ _id: userId });
    const validPassword = await bcrypt.compare(
      req.body.currentPassword,
      USER.password
    );
    if (validPassword) {
      const validPassword = await bcrypt.compare(
        req.body.newPassword,
        USER.password
      );
      if (!validPassword) {
        if (req.body.newPassword == req.body.confirmPassword) {
          const hash = await bcrypt.hash(req.body.newPassword, 10);
          await User.findByIdAndUpdate(userId, {
            password: hash,
          }).then(() => {
            res.redirect("/userProfile");
          });
        } else {
          res.render("user/changePassword", {
            user,
            count,
            categories,
            err_message3: "Passwords do not match.",
          });
        }
      } else {
        res.render("user/changePassword", {
          user,
          count,
          categories,
          err_message2: "Password must differ from old password.",
        });
      }
    } else {
      res.render("user/changePassword", {
        user,
        count,
        categories,
        err_message1: "Enter a valid password and try again.",
      });
    }
  },

  getLogout: (req, res) => {
    // req.session.user = null;
    req.session.destroy();
    res.redirect("/login");
  },
};
