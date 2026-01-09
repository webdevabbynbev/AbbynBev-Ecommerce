import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layout/MainLayout";

import TableAdmin from "../components/Tables/Admin/TableAdmin";
import TableCustomer from "../components/Tables/Customer/TableCustomer";
import TableTag from "../components/Tables/Tag/TableTag";
import TablePersona from "../components/Tables/Persona/TablePersona";
import TableBanner from "../components/Tables/Banner/TableBanner";
import TableActivityLog from "../components/Tables/ActivityLog/TableActivityLog";
import TableFaq from "../components/Tables/Faq/TableFaq";
import TableVoucher from "../components/Tables/Voucher/TableVoucher";

import FormPrivacyPolicy from "../components/Forms/PrivacyPolicy/FormPrivacyPolicy";
import FormTermNConditions from "../components/Forms/TermAndConditions/FormTermAndConditions";
import FormReturnPolicy from "../components/Forms/ReturnPolicy/ReturnPolicy";
import FormAboutUs from "../components/Forms/AboutUs/FormAboutUs";
import FormContactUs from "../components/Forms/ContactUs/FormContactUs";

import TableSetting from "../components/Tables/Settings/TableSetting";
import TableBrand from "../components/Tables/Brand/TableBrand";
import TableCategoryType from "../components/Tables/CategoryTypes/TableCategoryTypes";
import TableConcern from "../components/Tables/Concern/TableConcern";
import TableConcernOption from "../components/Tables/Concern/TableConcernOption";
import TableProfileCategory from "../components/Tables/ProfileCategory/TableProfileCategory";
import TableProfileCategoryOption from "../components/Tables/ProfileCategory/TableProfileCategoryOption";

import TableFlashSale from "../components/Tables/FlashSale/TableFlashSale";
import TableSale from "../components/Tables/Sale/TableSale";

import TableProduct from "../components/Tables/Product/TableProduct";

import TableTransaction from "../components/Transaction/TableTransaction";

import TableRamadanEvent from "../components/Tables/Ramadan/TableRamadanEvent";

import TableRamadanRecommendation from "../components/Tables/Ramadan/TableRamadanRecommendation";

export default function MasterPage(): React.ReactElement {
  return (
    <MainLayout>
      <Routes>
        <Route path="/admin" element={<TableAdmin />} />
        <Route path="/customers" element={<TableCustomer />} />

        <Route path="/tag-product" element={<TableTag />} />
        <Route path="/persona-product" element={<TablePersona />} />
        <Route path="/banners" element={<TableBanner />} />

        <Route path="/master-product" element={<TableProduct />} />

        <Route path="/activity-logs" element={<TableActivityLog />} />
        <Route path="/faqs" element={<TableFaq />} />
        <Route path="/voucher" element={<TableVoucher />} />

        <Route path="/privacy-policy" element={<FormPrivacyPolicy />} />
        <Route path="/tnc" element={<FormTermNConditions />} />
        <Route path="/return-policy" element={<FormReturnPolicy />} />
        <Route path="/about-us" element={<FormAboutUs />} />
        <Route path="/contact-us" element={<FormContactUs />} />

        <Route path="/settings" element={<TableSetting />} />
        <Route path="/brand-product" element={<TableBrand />} />
        <Route path="/category-types" element={<TableCategoryType />} />
        <Route path="/concern" element={<TableConcern />} />
        <Route path="/concern-option" element={<TableConcernOption />} />
        <Route path="/profile-category-filter" element={<TableProfileCategory />} />
        <Route path="/profile-category-option" element={<TableProfileCategoryOption />} />

        <Route path="/flash-sale" element={<TableFlashSale />} />
        <Route path="/sale-products" element={<TableSale />} />

        <Route path="/transactions" element={<TableTransaction />} />

        <Route path="/ramadan-event" element={<TableRamadanEvent />} />
        <Route path="/ramadan-recommendation" element={<TableRamadanRecommendation />} />

        {/* Redirect default */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
  );
}
