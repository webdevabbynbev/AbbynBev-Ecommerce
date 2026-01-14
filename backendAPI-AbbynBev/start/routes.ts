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
import { Role } from '#enums/role'

// =========================
// CMS / ADMIN CONTROLLERS (DECLARE ONCE ONLY)
// =========================

// events
const CmsRamadanParticipantsController = () =>
  import('#controllers/cms/events/ramadan/ramadan_participants_controller')
const CmsRamadanRecommendationsController = () =>
  import('#controllers/cms/events/ramadan/ramadan_recommendations_controller')
const CmsRamadanSpinPrizesController = () =>
  import('#controllers/cms/events/ramadan/ramadan_spin_prizes_controller')
// users
const UsersController = () => import('#controllers/cms/users/admin_users_controller')
const CustomersController = () => import('#controllers/cms/users/customers_controller')

// catalog
const CategoryTypesController = () => import('#controllers/cms/catalog/category_types_controller')
const AttributesController = () => import('#controllers/cms/catalog/attributes_controller')
const CmsTagController = () => import('#controllers/cms/catalog/tags_controller')
const CmsBrandController = () => import('#controllers/cms/catalog/brands_controller')
const CmsPersonaController = () => import('#controllers/cms/catalog/personas_controller')
const CmsConcernController = () => import('#controllers/cms/catalog/concerns_controller')
const CmsConcernOptionController = () =>
  import('#controllers/cms/catalog/concern_options_controller')
const CmsProfileCategoriesController = () =>
  import('#controllers/cms/catalog/profile_categories_controller')
const CmsProfileCategoryOptionsController = () =>
  import('#controllers/cms/catalog/profile_category_options_controller')

// catalog/products
const ProductController = () => import('#controllers/cms/catalog/products/products_controller')
const ProductCsvImportController = () =>
  import('#controllers/cms/catalog/products/product_csv_import_controller')
const ProductFlashsaleController = () =>
  import('#controllers/cms/catalog/products/product_flashsale_controller')
const ProductPositionsController = () =>
  import('#controllers/cms/catalog/products/product_positions_controller')
const ProductPublicationsController = () =>
  import('#controllers/cms/catalog/products/product_publications_controller')

// promotions
const VouchersController = () => import('#controllers/cms/promotions/vouchers_controller')
const CmsFlashSaleController = () => import('#controllers/cms/promotions/flashsales_controller')
const CmsSaleController = () => import('#controllers/cms/promotions/sales_controller')

// inventory
const CmsStockMovementsController = () =>
  import('#controllers/cms/inventory/stock_movements_controller')
const CmsProductOnlinesController = () =>
  import('#controllers/cms/inventory/product_onlines_controller')

// content
const SettingCmsController = () => import('#controllers/cms/content/setting_cms_controller')
const SettingsPoliciesController = () =>
  import('#controllers/cms/content/settings/policies_controller')
const SettingsPagesController = () => import('#controllers/cms/content/settings/pages_controller')
const FaqsController = () => import('#controllers/cms/content/faqs_controller')
const BannerController = () => import('#controllers/cms/content/banners/banners_controller')
const BannerOrdersController = () =>
  import('#controllers/cms/content/banners/banner_orders_controller')

// orders
const CmsSupportTicketController = () =>
  import('#controllers/cms/orders/support_tickets_controller')
const CmsReviewsController = () => import('#controllers/cms/orders/reviews_controller')
const CmsTransactionsController = () => import('#controllers/cms/orders/transactions_controller')

// analytics/dashboard
const CmsDashboardUsersController = () =>
  import('#controllers/cms/analytics/dashboard/users_controller')
const CmsDashboardTransactionsController = () =>
  import('#controllers/cms/analytics/dashboard/transactions_controller')
const CmsDashboardProductsController = () =>
  import('#controllers/cms/analytics/dashboard/products_controller')
const CmsDashboardCartsController = () =>
  import('#controllers/cms/analytics/dashboard/carts_controller')

// system
const CmsActivityLogsController = () => import('#controllers/cms/system/activity_logs_controller')

// =========================
// FRONTEND CONTROLLERS
// =========================

const FeCategoryTypesController = () =>
  import('#controllers/frontend/category/category_types_controller')
const FeVoucherController = () => import('#controllers/frontend/vouchers/vouchers_controller')
const FeProductController = () => import('#controllers/frontend/products/products_controller')
const FeReviewController = () => import('#controllers/frontend/reviews/reviews_controller')
const FeWishlist = () => import('#controllers/frontend/wishlist/wishlists_controller')
const FeSupportTicketController = () =>
  import('#controllers/frontend/support/support_tickets_controller')
const UserAddressesController = () => import('#controllers/frontend/user/user_addresses_controller')
const FeHomeController = () => import('#controllers/frontend/home/home_controller')
const FeBrandController = () => import('#controllers/frontend/brands/brands_controller')
const FePersonaController = () => import('#controllers/frontend/personas/personas_controller')
const FeConcernController = () => import('#controllers/frontend/concerns/concerns_controller')
const FeTransactionCartController = () =>
  import('#controllers/frontend/transaction/transaction_carts_controller')
const FeTagsController = () => import('#controllers/frontend/tags/tags_controller')
const FeUserBeautyProfilesController = () =>
  import('#controllers/frontend/user/user_beauty_profiles_controller')
const FeProductRecommendationsController = () =>
  import('#controllers/frontend/products/products_recommendations_controller')
const FeTransactionEcommerceController = () =>
  import('#controllers/frontend/transaction/transaction_commerces_controller')
const FeRamadanCheckinsController = () =>
  import('#controllers/frontend/ramadan/ramadan_checkins_controller')
const FeRamadanSpinController = () =>
  import('#controllers/frontend/ramadan/ramadan_spin_controller')
const OrdersController = () => import('#controllers/frontend/orders/orders_controller')
const FeChatkitController = () => import('#controllers/frontend/chatkit/chatkit_controller')
const FeDiscountsController = () => import('#controllers/frontend/discounts/discounts_controller')

// CMS discounts
const CmsDiscountsController = () => import('#controllers/cms/promotions/discounts_controller')
const CmsDiscountOptionsController = () =>
  import('#controllers/cms/promotions/discount_options_controller')

// =========================
// POS CONTROLLERS
// =========================
const PosProductsController = () => import('#controllers/pos/products_controller')
const PosTransactionPosController = () => import('#controllers/pos/transaction_pos_controller')

// =========================
// AUTH & UPLOAD CONTROLLERS
// =========================
const UploadsController = () => import('#controllers/frontend/upload/upload_controller')
const AuthSessionsController = () => import('#controllers/auth/auth_sessions_controller')
const AuthRegistrationController = () => import('#controllers/auth/auth_registration_controller')
const AuthPasswordResetController = () => import('#controllers/auth/auth_password_reset_controller')
const AuthAccountController = () => import('#controllers/auth/auth_account_controller')

// =====================================================================
// API V1
// =====================================================================
router
  .group(() => {
    // =========================
    // AUTH & UPLOAD
    // =========================

    // Google Auth
    router.post('/auth/login-google', [AuthSessionsController, 'loginGoogle'])
    router.post('/auth/register-google', [AuthSessionsController, 'registerGoogle'])
    router.post('/auth/register/google', [AuthSessionsController, 'registerGoogle'])
    router.post('/auth/register', [AuthRegistrationController, 'register'])
    router.post('/auth/verify-register', [AuthRegistrationController, 'verifyRegisterOtp'])
    router.post('/auth/login', [AuthSessionsController, 'login'])
    router.post('/auth/verify-login', [AuthSessionsController, 'verifyLoginOtp'])
    router.post('/auth/login-admin', [AuthSessionsController, 'loginAdmin'])
    router.post('/auth/login-cashier', [AuthSessionsController, 'loginCashier'])
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
            router.post('/:id/medias', [ProductController, 'uploadMedia'])
            router.post('/:id/medias/bulk', [ProductController, 'uploadMediaBulk'])
            router.get('/is-flashsale/list', [ProductFlashsaleController, 'getIsFlashsale'])
            router.post('/update-order', [ProductPositionsController, 'updateProductIndex'])
            router.post('/:id/publish', [ProductPublicationsController, 'publish'])
            router.post('/:id/unpublish', [ProductPublicationsController, 'unpublish'])
            router.post('/import-csv', [ProductCsvImportController, 'import'])
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

        // ✅ DISCOUNTS (CMS) — dipindah ke dalam /api/v1/admin
        router
          .group(() => {
            router.get('', [CmsDiscountsController, 'get'])
            router.post('', [CmsDiscountsController, 'create'])

            // penting: status dulu, biar gak ketabrak :id
            router.put('/status', [CmsDiscountsController, 'updateStatus'])

            router.get('/:id', [CmsDiscountsController, 'show'])
            router.put('/:id', [CmsDiscountsController, 'update'])
            router.delete('/:id', [CmsDiscountsController, 'delete'])
          })
          .use(middleware.roleAdmin())
          .prefix('/discounts')

        // ✅ DISCOUNT OPTIONS (CMS) — dipindah ke dalam /api/v1/admin
        router
          .group(() => {
            router.get('/brands', [CmsDiscountOptionsController, 'brands'])
            router.get('/products', [CmsDiscountOptionsController, 'products'])
            router.get('/variants', [CmsDiscountOptionsController, 'variants'])
          })
          .use(middleware.roleAdmin())
          .prefix('/discount-options')

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
            router.get('', [CmsSaleController, 'get'])
            router.get('/:id', [CmsSaleController, 'show'])
            router.post('', [CmsSaleController, 'create'])
            router.put('/:id', [CmsSaleController, 'update'])
            router.delete('/:id', [CmsSaleController, 'delete'])
          })
          .use(middleware.roleAdmin())
          .prefix('/sales')

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
          .use(middleware.roleAdmin())
          .prefix('/stock-movements')

        router
          .group(() => {
            router.get('', [CmsTransactionsController, 'get'])
            router.put('/confirm', [CmsTransactionsController, 'confirmPaidOrder'])
            router.put('/update-receipt', [CmsTransactionsController, 'updateReceipt'])
            router.put('/refresh-tracking', [CmsTransactionsController, 'refreshTracking'])
            router.put('/complete', [CmsTransactionsController, 'completeOrder'])
            router.put('/cancel', [CmsTransactionsController, 'cancelTransactions'])
            router.get('/:id', [CmsTransactionsController, 'show'])
          })
          .use(middleware.roleAdmin())
          .prefix('/transactions')

        router.get('/activity-logs', [CmsActivityLogsController, 'get']).use(middleware.roleAdmin())

        router
          .group(() => {
            router.get('/', [CmsRamadanRecommendationsController, 'index'])
            router.post('/', [CmsRamadanRecommendationsController, 'store'])
            router.delete('/:id', [CmsRamadanRecommendationsController, 'destroy'])
          })
          .prefix('/ramadan-recommendations')

        router
          .group(() => {
            router.get('/', [CmsRamadanSpinPrizesController, 'index'])
            router.post('/', [CmsRamadanSpinPrizesController, 'store'])
            router.put('/:id', [CmsRamadanSpinPrizesController, 'update'])
            router.delete('/:id', [CmsRamadanSpinPrizesController, 'destroy'])
          })
          .prefix('/ramadan-spin-prizes')

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
      })
      .prefix('/admin')

    // =========================
    // FRONTEND PUBLIC ROUTES
    // =========================
    router.get('/category-types', [FeCategoryTypesController, 'list'])
    router.get('/category-types/:slug', [FeCategoryTypesController, 'show'])
    router.get('/products', [FeProductController, 'get'])
    router.get('/products/*', [FeProductController, 'show'])
    router.get('/banners', [FeHomeController, 'getBanner'])
    router.get('/tnc', [FeHomeController, 'getTermAndCondition'])
    router.get('/return-policy', [FeHomeController, 'getReturnPolicy'])
    router.get('/privacy-policy', [FeHomeController, 'getPrivacyPolicy'])
    router.get('/contact-us', [FeHomeController, 'getContactSupport'])
    router.get('/faq', [FeHomeController, 'getFaq'])
    router.get('/about-us', [FeHomeController, 'getAboutUs'])
    router.get('/flashsale', [FeHomeController, 'getFlashSale'])
    router.get('/sale', [FeHomeController, 'getSale'])
    router.get('/sales', [FeHomeController, 'getSales'])
    router.get('/brands', [FeBrandController, 'list'])
    router.get('/brands/:slug', [FeBrandController, 'show'])
    router.get('/personas', [FePersonaController, 'list'])
    router.get('/personas/:slug', [FePersonaController, 'show'])
    router.get('/concern', [FeConcernController, 'list'])
    router.get('/concern/:slug', [FeConcernController, 'show'])
    router.get('/tags', [FeTagsController, 'list'])
    router.get('/tags/:slug', [FeTagsController, 'show'])
    router.post('/support-tickets', [FeSupportTicketController, 'create'])
    router.post('/chatkit', [FeChatkitController, 'run'])

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
        router.get('/beauty', [FeUserBeautyProfilesController, 'getUserSelections'])
        router.post('/beauty/concerns', [FeUserBeautyProfilesController, 'saveConcerns'])
        router.post('/vouchers/validate', [FeVoucherController, 'validate'])
        router.post('/discounts/validate', [FeDiscountsController, 'validate'])

        router.get('/vouchers/available', [FeVoucherController, 'available'])
        router.get('/vouchers/my', [FeVoucherController, 'my'])
        router.post('/vouchers/:id/claim', [FeVoucherController, 'claim'])

        router.post('/beauty/profiles', [FeUserBeautyProfilesController, 'saveProfiles'])
        router.get('/recommendations', [
          FeProductRecommendationsController,
          'getProductRecommendations',
        ])
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
        router.put('/cart/:id', [FeTransactionCartController, 'update'])
        router.patch('/cart/:id', [FeTransactionCartController, 'update'])
        router.delete('/cart/:id', [FeTransactionCartController, 'delete'])
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
        router.get('/ramadan/spin/status', [FeRamadanSpinController, 'status'])
        router.post('/ramadan/spin', [FeRamadanSpinController, 'spin'])
        router.post('/ramadan/spin/claim', [FeRamadanSpinController, 'claimTicket'])
      })
      .use(middleware.auth({ guards: ['api'] }))

    router.put('/transaction/status', [FeTransactionEcommerceController, 'updateWaybillStatus'])
    router.post('/transaction/pickup', [FeTransactionEcommerceController, 'requestPickup'])
    router.post('/transaction/retrieve', [FeTransactionEcommerceController, 'getByTransactionNumber'])
    router.post('/midtrans/callback', [FeTransactionEcommerceController, 'webhookMidtrans'])

    // =========================
    // ORDERS (AUTH REQUIRED)
    // =========================
    router
      .group(() => {
        router.get('/orders', [OrdersController, 'index'])
        router.get('/orders/:transactionNumber', [OrdersController, 'show'])
        router.put('/orders/:transactionNumber/confirm', [OrdersController, 'confirm'])
        router.put('/orders/:transactionNumber/refresh-tracking', [
          OrdersController,
          'refreshTracking',
        ])
      })
      .use(middleware.auth())

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
