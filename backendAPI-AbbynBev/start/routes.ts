/*
          |--------------------------------------------------------------------------
          | Routes file
          |--------------------------------------------------------------------------
          |
          | The routes file is used for defining the HTTP routes.
          |
          */

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { Role } from '../app/enums/role.js' // ... import lainnya
const CmsRamadanParticipantsController = () =>
  import('#controllers/cms/ramadan/ramadan_participants_controller')

const UsersController = () => import('#controllers/cms/users/admin_users_controller')
const CustomersController = () => import('#controllers/cms/users/customers_controller')

const CategoryTypesController = () => import('#controllers/cms/category_types_controller')
const SettingCmsController = () => import('#controllers/cms/setting_cms_controller')
const SettingsPoliciesController = () => import('#controllers/cms/settings/policies_controller')
const SettingsPagesController = () => import('#controllers/cms/settings/pages_controller')

const AttributesController = () => import('#controllers/cms/attributes_controller')
const ProductController = () => import('#controllers/cms/products/products_controller')
const ProductFlashsaleController = () =>
  import('#controllers/cms/products/product_flashsale_controller')
const ProductPositionsController = () =>
  import('#controllers/cms/products/product_positions_controller')
const ProductPublicationsController = () =>
  import('#controllers/cms/products/product_publications_controller')

const VouchersController = () => import('#controllers/cms/vouchers_controller')
const FaqsController = () => import('#controllers/cms/faqs_controller')
const BannerController = () => import('#controllers/cms/banners/banners_controller')
const BannerOrdersController = () => import('#controllers/cms/banners/banner_orders_controller')

const CmsDashboardUsersController = () => import('#controllers/cms/dashboard/users_controller')
const CmsDashboardTransactionsController = () =>
  import('#controllers/cms/dashboard/transactions_controller')
const CmsDashboardProductsController = () =>
  import('#controllers/cms/dashboard/products_controller')
const CmsDashboardCartsController = () => import('#controllers/cms/dashboard/carts_controller')

const CmsSupportTicketController = () => import('#controllers/cms/support_tickets_controller')
const CmsReviewsController = () => import('#controllers/cms/reviews_controller')
const CmsTagController = () => import('#controllers/cms/tags_controller')
const CmsBrandController = () => import('#controllers/cms/brands_controller')
const CmsPersonaController = () => import('#controllers/cms/personas_controller')
const CmsConcernController = () => import('#controllers/cms/concerns_controller')
const CmsFlashSaleController = () => import('#controllers/cms/flashsales_controller')
const CmsTransactionsController = () => import('#controllers/cms/transactions_controller')
const CmsProfileCategoriesController = () =>
  import('#controllers/cms/profile_categories_controller')
const CmsProfileCategoryOptionsController = () =>
  import('#controllers/cms/profile_category_options_controller')
const CmsConcernOptionController = () => import('#controllers/cms/concern_options_controller')
const CmsStockMovementsController = () => import('#controllers/cms/stock_movements_controller')
const CmsProductOnlinesController = () => import('#controllers/cms/product_onlines_controller')
const CmsActivityLogsController = () => import('#controllers/cms/activity_logs_controller')
const UploadsController = () => import('#controllers/upload_controller')

const FeCategoryTypesController = () => import('#controllers/frontend/category_types_controller')
const FeVoucherController = () => import('#controllers/frontend/vouchers_controller')
const FeProductController = () => import('#controllers/frontend/products_controller')
const FeReviewController = () => import('#controllers/frontend/reviews_controller')
const FeWishlist = () => import('#controllers/frontend/wishlists_controller')
const FeSupportTicketController = () => import('#controllers/frontend/support_tickets_controller')
const UserAddressesController = () => import('#controllers/frontend/user_addresses_controller')
const FeHomeController = () => import('#controllers/frontend/home_controller')
const FeBrandController = () => import('#controllers/frontend/brands_controller')
const FePersonaController = () => import('#controllers/frontend/personas_controller')
const FeConcernController = () => import('#controllers/frontend/concerns_controller')
const FeTransactionCartController = () =>
  import('#controllers/frontend/transaction_carts_controller')
const FeTagsController = () => import('#controllers/frontend/tags_controller')
const FeUserBeautyProfilesController = () =>
  import('#controllers/frontend/user_beauty_profiles_controller')
const FeProductRecommendationsController = () =>
  import('#controllers/frontend/product_recommendations_controller')
const FeTransactionEcommerceController = () =>
  import('#controllers/frontend/transaction_commerces_controller')
const FeRamadanCheckinsController = () =>
  import('#controllers/frontend/ramadan_checkins_controller')

const PosProductsController = () => import('#controllers/pos/products_controller')
const PosTransactionPosController = () => import('#controllers/pos/transaction_pos_controller')

const OrdersController = () => import('#controllers/frontend/orders_controller')

const AuthSessionsController = () => import('#controllers/auth/auth_sessions_controller')
const AuthRegistrationController = () => import('#controllers/auth/auth_registration_controller')
const AuthPasswordResetController = () => import('#controllers/auth/auth_password_reset_controller')
const AuthAccountController = () => import('#controllers/auth/auth_account_controller')

router
  .group(() => {
    // =========================
    // AUTH & UPLOAD
    // =========================
    router.post('/auth/login-google', [AuthSessionsController, 'loginGoogle'])
    router.post('/auth/register', [AuthRegistrationController, 'register'])
    router.post('/auth/verify-register', [AuthRegistrationController, 'verifyRegisterOtp'])
    router.post('/auth/login', [AuthSessionsController, 'login'])
    router.post('/auth/verify-login', [AuthSessionsController, 'verifyLoginOtp'])
    router.post('/auth/login-admin', [AuthSessionsController, 'loginAdmin'])
    router.post('/auth/login-cashier', [AuthSessionsController, 'loginCashier'])
    // Di dalam router.group (Admin)

    router.post('/auth/forgot', [AuthPasswordResetController, 'requestForgotPassword'])
    router
      .get('/auth/forgot-password/:email/verify', [
        AuthPasswordResetController,
        'verifyForgotPassword',
      ])
      .as('verifyForgotPassword')
    router.post('/auth/reset-password', [AuthPasswordResetController, 'resetPassword'])

    router.post('/upload', [UploadsController, 'upload'])

    // =========================
    // ADMIN CMS ROUTES
    // =========================
    router
      .group(() => {
        router.get('/ramadan-participants', [CmsRamadanParticipantsController, 'index'])
        router
          .group(() => {
            router.get('', [UsersController, 'getAdmin'])
            router.get('list', [UsersController, 'list'])
            router.post('', [UsersController, 'createAdmin'])
            router.put('/:id', [UsersController, 'updateAdmin'])
            router.get('/:id', [UsersController, 'showAdmin'])
            router.delete('/:id', [UsersController, 'deleteAdmin'])
          })
          .use(middleware.roleAdmin())
          .prefix('/users')

        router.get('/customers', [CustomersController, 'getCustomers'])

        router
          .group(() => {
            router.get('', [CategoryTypesController, 'get'])
            router.get('/list', [CategoryTypesController, 'list'])
            router.post('', [CategoryTypesController, 'create'])
            router.put('/:slug', [CategoryTypesController, 'update'])
            router.get('/:slug', [CategoryTypesController, 'show'])
            router.delete('/:slug', [CategoryTypesController, 'delete'])
          })
          .use(middleware.roleAdmin())
          .prefix('/category-types')

        router
          .group(() => {
            router.get('', [SettingCmsController, 'get'])
            router.post('', [SettingCmsController, 'create'])
            router.put('/:id', [SettingCmsController, 'update'])
            router.delete('/:id', [SettingCmsController, 'delete'])
          })
          .use(middleware.roleAdmin())
          .prefix('/settings')

        router
          .group(() => {
            router.get('/term-and-conditions', [SettingsPoliciesController, 'getTermAndCondition'])
            router.post('/term-and-conditions', [
              SettingsPoliciesController,
              'createTermAndCondition',
            ])
            router.get('/privacy-policy', [SettingsPoliciesController, 'getPrivacyPolicy'])
            router.post('/privacy-policy', [SettingsPoliciesController, 'createPrivacyPolicy'])
            router.get('/return-policy', [SettingsPoliciesController, 'getReturnPolicy'])
            router.post('/return-policy', [SettingsPoliciesController, 'createReturnPolicy'])

            router.get('/about-us', [SettingsPagesController, 'getAboutUs'])
            router.post('/about-us', [SettingsPagesController, 'createAboutUs'])
            router.get('/contact-us', [SettingsPagesController, 'getContactUs'])
            router.post('/contact-us', [SettingsPagesController, 'createContactUs'])
          })
          .use(middleware.roleAdmin())

        router
          .group(() => {
            router.get('', [AttributesController, 'get'])
            router.get('/list', [AttributesController, 'list'])
            router.post('', [AttributesController, 'create'])
            router.put('', [AttributesController, 'update'])
            router.delete('', [AttributesController, 'delete'])
            router.post('/list-value/:attribute_id', [AttributesController, 'addValue'])
          })
          .use(middleware.roleAdmin())
          .prefix('/attribute')

        router
          .group(() => {
            router.get('', [ProductController, 'get'])
            router.get('/:id', [ProductController, 'show'])
            router.post('', [ProductController, 'create'])
            router.put('/:id', [ProductController, 'update'])
            router.delete('/:id', [ProductController, 'delete'])
            // ✅ NEW: upload media (single)
            router.post('/:id/medias', [ProductController, 'uploadMedia'])

            // ✅ OPTIONAL: upload media (bulk)
            router.post('/:id/medias/bulk', [ProductController, 'uploadMediaBulk'])
            router.get('/is-flashsale/list', [ProductFlashsaleController, 'getIsFlashsale'])
            router.post('/update-order', [ProductPositionsController, 'updateProductIndex'])
            router.post('/:id/publish', [ProductPublicationsController, 'publish'])
            router.post('/:id/unpublish', [ProductPublicationsController, 'unpublish'])
          })
          .use(middleware.roleAdmin())
          .prefix('/product')

        router
          .group(() => {
            router.get('', [CmsProductOnlinesController, 'get'])
            router.get('/:id', [CmsProductOnlinesController, 'show'])
          })
          .use(middleware.roleAdmin())
          .prefix('/product-online')

        router
          .group(() => {
            router.get('', [VouchersController, 'get'])
            router.post('', [VouchersController, 'create'])
            router.put('', [VouchersController, 'update'])
            router.delete('', [VouchersController, 'delete'])
            router.put('/status', [VouchersController, 'updateStatus'])
          })
          .use(middleware.roleAdmin())
          .prefix('/voucher')

        router
          .group(() => {
            router.get('', [FaqsController, 'get'])
            router.post('', [FaqsController, 'create'])
            router.put('/:id', [FaqsController, 'update'])
            router.get('/:id', [FaqsController, 'show'])
            router.delete('/:id', [FaqsController, 'delete'])
          })
          .use(middleware.roleAdmin())
          .prefix('/faq')

        router
          .group(() => {
            router.get('', [BannerController, 'get'])
            router.post('', [BannerController, 'create'])
            router.put('/:id', [BannerController, 'update'])
            router.get('/:id', [BannerController, 'show'])
            router.delete('/:id', [BannerController, 'delete'])
            router.post('/update-order', [BannerOrdersController, 'updateProductIndex'])
          })
          .use(middleware.roleAdmin())
          .prefix('/banners')

        router
          .group(() => {
            router.get('', [CmsReviewsController, 'get'])
            router.get('/:id', [CmsReviewsController, 'show'])
            router.delete('/:id', [CmsReviewsController, 'delete'])
          })
          .use(middleware.roleAdmin())
          .prefix('/reviews')

        router
          .group(() => {
            router.get('', [CmsSupportTicketController, 'get'])
            router.get('/:id', [CmsSupportTicketController, 'show'])
            router.put('/:id', [CmsSupportTicketController, 'update'])
          })
          .use(middleware.roleAdmin())
          .prefix('/support-tickets')

        // ✅ FIX: .middleware -> .use
        router
          .group(() => {
            router.get('', [CmsTagController, 'get'])
            router.post('', [CmsTagController, 'create'])
            router.get('/:slug', [CmsTagController, 'show'])
            router.put('/:slug', [CmsTagController, 'update'])
            router.delete('/:slug', [CmsTagController, 'delete'])
          })
          .use([middleware.auth(), middleware.rolePermission([Role.GUDANG])])
          .prefix('/tags')

        router
          .group(() => {
            router.get('', [CmsBrandController, 'get'])
            router.get('/list-by-letter', [CmsBrandController, 'listByLetter'])
            router.post('', [CmsBrandController, 'create'])
            router.get('/:slug', [CmsBrandController, 'show'])
            router.put('/:slug', [CmsBrandController, 'update'])
            router.delete('/:slug', [CmsBrandController, 'delete'])
          })
          .use(middleware.roleAdmin())
          .prefix('/brands')

        // ✅ FIX: .middleware -> .use
        router
          .group(() => {
            router.get('', [CmsPersonaController, 'get'])
            router.post('', [CmsPersonaController, 'create'])
            router.get('/:slug', [CmsPersonaController, 'show'])
            router.put('/:slug', [CmsPersonaController, 'update'])
            router.delete('/:slug', [CmsPersonaController, 'delete'])
          })
          .use([middleware.auth(), middleware.rolePermission([Role.GUDANG])])
          .prefix('/personas')

        router
          .group(() => {
            router.get('', [CmsConcernController, 'get'])
            router.post('', [CmsConcernController, 'create'])
            router.get('/:slug', [CmsConcernController, 'show'])
            router.put('/:slug', [CmsConcernController, 'update'])
            router.delete('/:slug', [CmsConcernController, 'delete'])
          })
          .use(middleware.roleAdmin())
          .prefix('/concern')

        router
          .group(() => {
            router.get('', [CmsConcernOptionController, 'get'])
            router.post('', [CmsConcernOptionController, 'store'])
            router.get('/:slug', [CmsConcernOptionController, 'show'])
            router.put('/:slug', [CmsConcernOptionController, 'update'])
            router.delete('/:slug', [CmsConcernOptionController, 'delete'])
          })
          .use(middleware.roleAdmin())
          .prefix('/concern-options')

        router
          .group(() => {
            router.get('', [CmsFlashSaleController, 'get'])
            router.get('/:id', [CmsFlashSaleController, 'show'])
            router.post('', [CmsFlashSaleController, 'create'])
            router.put('/:id', [CmsFlashSaleController, 'update'])
            router.delete('/:id', [CmsFlashSaleController, 'delete'])
          })
          .use(middleware.roleAdmin())
          .prefix('/flashsales')

        router
          .group(() => {
            router.get('', [CmsProfileCategoriesController, 'get'])
            router.post('', [CmsProfileCategoriesController, 'create'])
            router.get('/:id', [CmsProfileCategoriesController, 'show'])
            router.put('/:id', [CmsProfileCategoriesController, 'update'])
            router.delete('/:id', [CmsProfileCategoriesController, 'delete'])
          })
          .use(middleware.roleAdmin())
          .prefix('/profile-categories')

        router
          .group(() => {
            router.get('', [CmsProfileCategoryOptionsController, 'get'])
            router.post('', [CmsProfileCategoryOptionsController, 'create'])
            router.get('/:id', [CmsProfileCategoryOptionsController, 'show'])
            router.put('/:id', [CmsProfileCategoryOptionsController, 'update'])
            router.delete('/:id', [CmsProfileCategoryOptionsController, 'delete'])
          })
          .use(middleware.roleAdmin())
          .prefix('/profile-category-options')

        router
          .group(() => {
            router.get('', [CmsStockMovementsController, 'get'])
            router.post('/adjust', [CmsStockMovementsController, 'adjust'])
            router.get('/export', [CmsStockMovementsController, 'export'])
          })
          .prefix('/stock-movements')
          .use(middleware.roleAdmin())

        router
        router
          .group(() => {
            router.get('', [CmsTransactionsController, 'get'])
            router.put('/confirm', [CmsTransactionsController, 'confirmPaidOrder'])
            router.put('/update-receipt', [CmsTransactionsController, 'updateReceipt'])

            // ✅ NEW
            router.put('/refresh-tracking', [CmsTransactionsController, 'refreshTracking'])
            router.put('/complete', [CmsTransactionsController, 'completeOrder'])

            router.put('/cancel', [CmsTransactionsController, 'cancelTransactions'])
            router.get('/:id', [CmsTransactionsController, 'show'])
          })
          .use(middleware.roleAdmin())
          .prefix('/transactions')

        router.get('/total-user', [CmsDashboardUsersController, 'getTotalRegisterUser'])
        router.get('/total-register-user-period', [
          CmsDashboardUsersController,
          'getTotalRegisterUserByPeriod',
        ])

        router.get('/total-transaction', [
          CmsDashboardTransactionsController,
          'getTotalTransaction',
        ])
        router.get('/total-transaction-month', [
          CmsDashboardTransactionsController,
          'getTotalTransactionByMonth',
        ])
        router.get('/total-transaction-period', [
          CmsDashboardTransactionsController,
          'getTotalTransactionByPeriod',
        ])
        router.get('/total-transaction-status', [
          CmsDashboardTransactionsController,
          'getTotalTransactionByStatus',
        ])
        router.get('/transaction-status', [
          CmsDashboardTransactionsController,
          'getStatusTransactionByMonth',
        ])

        router.get('/top-product-sell', [CmsDashboardProductsController, 'getTopProductSell'])
        router.get('/less-product-sell', [CmsDashboardProductsController, 'getLessProductSell'])

        router.get('/user-carts', [CmsDashboardCartsController, 'getUserCart'])

        router.get('/activity-logs', [CmsActivityLogsController, 'get']).use(middleware.roleAdmin())
      })
      .prefix('/admin')

    // =========================
    // FRONTEND PUBLIC ROUTES
    // =========================
    router.get('/category-types', [FeCategoryTypesController, 'list'])
    router.get('/category-types/:slug', [FeCategoryTypesController, 'show'])
    router.get('/products', [FeProductController, 'get'])
    router.get('/products/*', [FeProductController, 'show'])

    // =========================
    // FRONTEND AUTH ROUTES
    // =========================
    router
      .group(() => {
        router.post('/auth/logout', [AuthSessionsController, 'logout'])
        router.get('/profile', [AuthAccountController, 'profile'])
        router.put('/profile', [AuthAccountController, 'updateProfile'])
        router.put('/profile/picture', [AuthAccountController, 'updateProfilePicture'])
        router.put('/profile/password', [AuthAccountController, 'updatePassword'])
        router.post('/profile/deactivate', [AuthAccountController, 'deactivateAccount'])

        router.post('/vouchers/validate', [FeVoucherController, 'validate'])
        router.get('/wishlists', [FeWishlist, 'get'])
        router.get('/wishlists/list', [FeWishlist, 'list'])
        router.post('/wishlists', [FeWishlist, 'create'])
        router.delete('/wishlists', [FeWishlist, 'delete'])
        router.get('/addresses', [UserAddressesController, 'list'])
        router.post('/addresses', [UserAddressesController, 'create'])
        router.put('/addresses', [UserAddressesController, 'update'])
        router.delete('/addresses', [UserAddressesController, 'delete'])
        router.get('/areas', [UserAddressesController, 'searchAreas'])
        router.post('/get-cost', [UserAddressesController, 'getCost'])
      })
      .use(middleware.auth({ guards: ['api'] }))

    router
      .group(() => {
        router.get('', [FeReviewController, 'get'])
        router.post('', [FeReviewController, 'create']).use(middleware.auth({ guards: ['api'] }))
        router
          .post('/:id/toggle-like', [FeReviewController, 'toggleLike'])
          .use(middleware.auth({ guards: ['api'] }))
      })
      .prefix('/reviews')

    router.post('/support-tickets', [FeSupportTicketController, 'create'])
    router.get('/brands', [FeBrandController, 'list'])
    router.get('/brands/:slug', [FeBrandController, 'show'])

    router.get('/personas', [FePersonaController, 'list'])
    router.get('/personas/:slug', [FePersonaController, 'show'])

    router.get('/concern', [FeConcernController, 'list'])
    router.get('/concern/:slug', [FeConcernController, 'show'])

    router.get('/tags', [FeTagsController, 'list'])
    router.get('/tags/:slug', [FeTagsController, 'show'])

    router
      .group(() => {
        router.get('/beauty', [FeUserBeautyProfilesController, 'getUserSelections'])
        router.post('/beauty/concerns', [FeUserBeautyProfilesController, 'saveConcerns'])
        router.post('/beauty/profiles', [FeUserBeautyProfilesController, 'saveProfiles'])

        router.get('/recommendations', [
          FeProductRecommendationsController,
          'getProductRecommendations',
        ])
      })
      .use(middleware.auth({ guards: ['api'] }))

    router.get('/banners', [FeHomeController, 'getBanner'])
    router.get('/tnc', [FeHomeController, 'getTermAndCondition'])
    router.get('/return-policy', [FeHomeController, 'getReturnPolicy'])
    router.get('/privacy-policy', [FeHomeController, 'getPrivacyPolicy'])
    router.get('/contact-us', [FeHomeController, 'getContactSupport'])
    router.get('/faq', [FeHomeController, 'getFaq'])
    router.get('/about-us', [FeHomeController, 'getAboutUs'])
    router.get('/flashsale', [FeHomeController, 'getFlashSale'])

    // =========================
    // CART ROUTES (AUTH REQUIRED)
    // =========================
    router
      .group(() => {
        router.get('/cart', [FeTransactionCartController, 'get'])
        router.post('/cart', [FeTransactionCartController, 'create'])
        router.post('/cart/update-selection', [FeTransactionCartController, 'updateSelection'])
        router.get('/cart/get-total', [FeTransactionCartController, 'getTotal'])
        router.get('/cart/mini', [FeTransactionCartController, 'miniCart'])

        // ✅ NEW: support /cart/:id (FE sekarang pakai ini)
        router.put('/cart/:id', [FeTransactionCartController, 'update'])
        router.patch('/cart/:id', [FeTransactionCartController, 'update'])
        router.delete('/cart/:id', [FeTransactionCartController, 'delete'])

        // ✅ backward compatible (FE lama kirim body {id})
        router.put('/cart', [FeTransactionCartController, 'update'])
        router.patch('/cart', [FeTransactionCartController, 'update'])
        router.delete('/cart', [FeTransactionCartController, 'delete'])
      })
      .use(middleware.auth({ guards: ['api'] }))

    // =========================
    // TRANSACTION ROUTES (AUTH REQUIRED)
    // =========================
    router
      .group(() => {
        router.get('/transaction', [FeTransactionEcommerceController, 'get'])
        router.post('/transaction', [FeTransactionEcommerceController, 'create'])
        router.post('/transaction/confirm', [FeTransactionEcommerceController, 'confirmOrder'])
      })
      .use(middleware.auth({ guards: ['api'] }))
    // =========================
    // RAMADAN CHECK-IN (AUTH REQUIRED)
    // =========================
    router
      .group(() => {
        router.get('/ramadan/checkin/status', [FeRamadanCheckinsController, 'status'])
        router.post('/ramadan/checkin', [FeRamadanCheckinsController, 'checkin'])
        router.post('/ramadan/checkin/exempt', [FeRamadanCheckinsController, 'exempt'])
      })
      .use(middleware.auth({ guards: ['api'] }))

    router.put('/transaction/status', [FeTransactionEcommerceController, 'updateWaybillStatus'])
    router.post('/transaction/pickup', [FeTransactionEcommerceController, 'requestPickup'])
    router.post('/transaction/retrieve', [
      FeTransactionEcommerceController,
      'getByTransactionNumber',
    ])
    router.post('/midtrans/callback', [FeTransactionEcommerceController, 'webhookMidtrans'])

    // =========================
    // POS CASHIER ROUTES
    // =========================
    router
      .group(() => {
        router.post('/scan-barcode', [PosProductsController, 'scanByBarcode'])
        router.post('/transactions', [PosTransactionPosController, 'store'])
      })
      .prefix('/pos')
      .use(middleware.roleCashier())
  })
  .prefix('/api/v1')

router
  .group(() => {
    router.get('/orders', [OrdersController, 'index'])
    router.get('/orders/:transactionNumber', [OrdersController, 'show'])
    router.put('/orders/:transactionNumber/confirm', [OrdersController, 'confirm'])
    router.put('/orders/:transactionNumber/refresh-tracking', [OrdersController, 'refreshTracking'])
  })
  .use(middleware.auth())

router.get('/total-user', [CmsDashboardUsersController, 'getTotalRegisterUser'])
router.get('/total-register-user-period', [
  CmsDashboardUsersController,
  'getTotalRegisterUserByPeriod',
])

router.get('/total-transaction', [CmsDashboardTransactionsController, 'getTotalTransaction'])
router.get('/total-transaction-month', [
  CmsDashboardTransactionsController,
  'getTotalTransactionByMonth',
])
router.get('/total-transaction-period', [
  CmsDashboardTransactionsController,
  'getTotalTransactionByPeriod',
])
router.get('/total-transaction-status', [
  CmsDashboardTransactionsController,
  'getTotalTransactionByStatus',
])
router.get('/transaction-status', [
  CmsDashboardTransactionsController,
  'getStatusTransactionByMonth',
])

router.get('/top-product-sell', [CmsDashboardProductsController, 'getTopProductSell'])
router.get('/less-product-sell', [CmsDashboardProductsController, 'getLessProductSell'])

router.get('/user-carts', [CmsDashboardCartsController, 'getUserCart'])
