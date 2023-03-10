const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController')
const session = require('../middlewares/session')
const multer  = require('multer')
const {storage} = require('../cloudinary')
const upload = multer({storage})

router.get('/',session.verifyLoginAdmin,adminController.getAdminLanding)
router.get('/login',adminController.getAdminLogin)
router.post('/login',adminController.postAdminLogin)
router.get('/logout',adminController.getAdminLogout)
router.get('/userDetails',session.verifyLoginAdmin,adminController.userDetails)
router.get('/blockUser/:id',session.verifyLoginAdmin,adminController.blockUser)
router.get('/unblockUser/:id',session.verifyLoginAdmin,adminController.unblockUser)
router.get('/products',session.verifyLoginAdmin,adminController.productDetails)
router.get('/addProducts',session.verifyLoginAdmin,adminController.getAddProduct)
router.post('/products',session.verifyLoginAdmin,upload.array('image'),adminController.postAddProduct)
router.get('/editProducts/:id',session.verifyLoginAdmin,adminController.getEditProduct)
router.put('/Products/:id',session.verifyLoginAdmin,upload.array('image'),adminController.updateProduct)
router.get('/isActive/:id',session.verifyLoginAdmin,adminController.isActive)
router.get('/isInactive/:id',session.verifyLoginAdmin,adminController.isInactive)
router.get('/categories',session.verifyLoginAdmin,adminController.getCategories)
router.get('/addCategory',session.verifyLoginAdmin,adminController.getAddCategory)
router.post('/categories',session.verifyLoginAdmin,adminController.postAddCategory)
router.get('/editCategory/:id',session.verifyLoginAdmin,adminController.getEditCategory)
router.put('/categories/:id',adminController.updateCategory)
router.get('/isActiveCategory/:id',session.verifyLoginAdmin,adminController.isActiveCategory)
router.get('/isInactiveCategory/:id',session.verifyLoginAdmin,adminController.isInactiveCategory)
router.get('/orders',session.verifyLoginAdmin,adminController.getOrders)
router.get('/admin-view-order-products/:id',session.verifyLoginAdmin,adminController.viewOrderProducts)
router.get('/editOrder/:id',session.verifyLoginAdmin,adminController.getEditOrder)
router.put('/orders/:id',session.verifyLoginAdmin,adminController.updateOrder)
router.get('/coupons',session.verifyLoginAdmin,adminController.getCoupon)
router.get('/addCoupon',session.verifyLoginAdmin,adminController.addCoupon)
router.post('/coupons',session.verifyLoginAdmin,adminController.postAddCoupon)
router.get('/editCoupon/:id',session.verifyLoginAdmin,adminController.getEditCoupon)
router.put('/coupons/:id',session.verifyLoginAdmin,adminController.updateCoupon)
router.get('/isActiveCoupon/:id',session.verifyLoginAdmin,adminController.isActiveCoupon)
router.get('/isInactiveCoupon/:id',session.verifyLoginAdmin,adminController.isInactiveCoupon)
router.get('/adminDashboard',session.verifyLoginAdmin,adminController.getAdminDashboard);
router.get('/salesReport',session.verifyLoginAdmin,adminController.getSalesReport)
router.get('/dailySales',session.verifyLoginAdmin,adminController.getDailySales)
router.get('/monthlySales',session.verifyLoginAdmin,adminController.getMonthlySales)

module.exports = router;