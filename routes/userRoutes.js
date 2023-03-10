const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const session = require('../middlewares/session')
const multer  = require('multer')
const {storage} = require('../cloudinary')
const upload = multer({storage})

router.get('/',userController.getLanding)
router.get('/signup',userController.getSignup)
router.post('/signup',userController.postSignup)
router.get('/login',userController.getLogin)
router.post('/login',userController.postLogin)
router.get('/logout',userController.getLogout)
router.get('/detailPage/:id',userController.detailPage)
router.post('/otp',userController.postOtp);
router.post('/add-to-cart/:id',session.verifyLogin,userController.getCart)
router.get('/cart',session.verifyLogin,userController.getCartProducts)
router.post('/change-product-quantity',userController.changeProductQuantity)
router.post('/product-remove',userController.productRemove)
router.get('/shop',userController.shop)
router.get('/category',userController.shopByCategory)
router.get('/checkout',session.verifyLogin,userController.checkout)
router.post('/coupon',session.verifyLogin,userController.coupon)
router.post('/checkout',userController.postCheckout)
router.get('/confirmation',session.verifyLogin,userController.confirmation)
router.get('/orders',session.verifyLogin,userController.orderDetails)
router.get('/view-order-products/:id',userController.viewOrderProducts)
router.post('/sorting',userController.sorting);
router.post('/allSorting',userController.allSorting);
router.post('/add-to-wishlist/:id',session.verifyLogin,userController.getWishlist)
router.get('/wishlist',session.verifyLogin,userController.getWishlistProducts)
router.post('/wishlist-product-remove',userController.wishlistProductRemove)
router.get('/userProfile',session.verifyLogin,userController.userProfile)
router.get('/addAddress',session.verifyLogin,userController.getAddAddress)
router.post('/userProfile',session.verifyLogin,userController.postAddAddress)
router.get('/editAddress/:id',session.verifyLogin,userController.getEditAddress)
router.patch('/userProfile/:id',session.verifyLogin,userController.updateAddress)
router.delete('/userProfile/:id',session.verifyLogin,userController.deleteAddress)
router.get('/addAddressCheckout',session.verifyLogin,userController.getAddAddressCheckout)
router.post('/addAddressCheckout',session.verifyLogin,userController.postAddAddressCheckout)
router.post('/orderCancel',session.verifyLogin,userController.orderCancel)
router.post('/verifyPayment',session.verifyLogin,userController.verifyPayment)
router.get('/payment-failed',session.verifyLogin,userController.paymentFailed)
router.get('/add-image',session.verifyLogin,userController.addImage)
router.put('/add-image/:id',upload.single('image'),userController.updateProfile)
router.get('/forgotPassword',userController.getForgotPassword)
router.post('/forgotPassword',userController.postForgotPassword)
router.post('/forgotPasswordOtp',userController.postForgotPasswordOtp)
router.post('/resetPassword',userController.postResetPassword)
router.get('/changePassword',session.verifyLogin,userController.getChangePassword)
router.post('/changePassword',session.verifyLogin,userController.postChangePassword)

module.exports=router;