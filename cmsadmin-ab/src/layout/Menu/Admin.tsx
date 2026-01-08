// cmsadmin-ab/src/layout/Menu/Admin.tsx

import {
  PieChartOutlined,
  TagsOutlined,
  GiftOutlined,
  RadiusSettingOutlined,
  ProductOutlined,
  PicLeftOutlined,
  PicCenterOutlined,
  FileUnknownOutlined,
  UndoOutlined,
  SafetyOutlined,
  UsergroupAddOutlined,
  UserAddOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  StockOutlined,
  ProfileOutlined,
  ApartmentOutlined,
  SortAscendingOutlined,
  LikeOutlined,
  SwitcherOutlined,
  PhoneOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  TagOutlined,
  MoonOutlined, // Pastikan ini ter-import
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import helper from "../../utils/helper";
import type { RoleEnumType } from "../../utils/helper";

const MenuAdmin = (level: RoleEnumType): MenuProps["items"] => {
  return [
    {
      key: "/dashboard",
      icon: <PieChartOutlined />,
      label: "Dashboard",
    },

    helper.hasAnyPermission(level, [helper.RoleEnum.ADMINISTRATOR]) && {
      key: "/admin",
      icon: <UsergroupAddOutlined />,
      label: "Admin",
    },

    helper.hasAnyPermission(level, [helper.RoleEnum.ADMINISTRATOR]) && {
      key: "/customers",
      icon: <UserAddOutlined />,
      label: "Customer",
    },

    helper.hasAnyPermission(level, [
      helper.RoleEnum.GUDANG,
      helper.RoleEnum.MEDIA,
    ]) && {
      key: "#product",
      label: "Product",
      icon: <ProductOutlined />,
      children: [
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/master-product",
          icon: <ProductOutlined />,
          label: "Product",
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/inventory-product",
          icon: <DatabaseOutlined />,
          label: "Inventory",
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/stock-movement",
          icon: <StockOutlined />,
          label: "Stock Movement",
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/flash-sale",
          icon: <ThunderboltOutlined />,
          label: "Flash Sale",
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/sale-products",
          icon: <TagOutlined />,
          label: "Sale Products",
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/brand-product",
          icon: <SortAscendingOutlined />,
          label: "Brand",
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/persona-product",
          icon: <SwitcherOutlined />,
          label: "Persona",
        },
        helper.hasAnyPermission(level, [
          helper.RoleEnum.GUDANG,
          helper.RoleEnum.MEDIA,
        ]) && {
          key: "/tag-product",
          label: "Tag",
          icon: <TagsOutlined />,
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/category-types",
          icon: <ApartmentOutlined />,
          label: "Category Types",
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/concern-category",
          icon: <LikeOutlined />,
          label: "Concern Category",
          children: [
            helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
              key: "/concern",
              icon: <TagOutlined />,
              label: "Concern",
            },
            helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
              key: "/concern-option",
              icon: <TagsOutlined />,
              label: "Concern Option",
            },
          ].filter(Boolean) as MenuProps["items"],
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/profile-category",
          icon: <ProfileOutlined />,
          label: "Profile Category",
          children: [
            helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
              key: "/profile-category-filter",
              icon: <LikeOutlined />,
              label: "Profile Category",
            },
            helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
              key: "/profile-category-option",
              icon: <LikeOutlined />,
              label: "Profile Category Option",
            },
          ].filter(Boolean) as MenuProps["items"],
        },
      ].filter(Boolean) as MenuProps["items"],
    },

    // --- MENU VOUCHER ---
    helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
      key: "/voucher",
      icon: <GiftOutlined />,
      label: "Voucher",
    },

    // --- [BARU] MENU RAMADAN EVENT ---
    // Saya taruh di sini karena masih terkait promo/event, dekat dengan Voucher
    // Saya asumsikan Admin & Gudang boleh akses, sesuaikan permission jika perlu
    helper.hasAnyPermission(level, [
      helper.RoleEnum.ADMINISTRATOR,
      helper.RoleEnum.GUDANG,
    ]) && {
      key: "/ramadan-event", // Pastikan route ini didaftarkan di App.tsx
      icon: <MoonOutlined />,
      label: "Ramadan Event",
    },
    // ---------------------------------

    helper.hasAnyPermission(level, [helper.RoleEnum.ADMINISTRATOR]) && {
      key: "/transactions",
      icon: <ShoppingCartOutlined />,
      label: "Transaction",
    },
    helper.hasAnyPermission(level, [
      helper.RoleEnum.GUDANG,
      helper.RoleEnum.MEDIA,
    ]) && {
      key: "#content-manager",
      label: "Content Manager",
      icon: <PicLeftOutlined />,
      children: [
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/banners",
          icon: <PicCenterOutlined />,
          label: "Banner",
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/faqs",
          icon: <FileUnknownOutlined />,
          label: "FAQ",
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/tnc",
          icon: <WarningOutlined />,
          label: "Terms & Conditions ",
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/privacy-policy",
          icon: <SafetyOutlined />,
          label: "Privacy Policy",
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/return-policy",
          icon: <UndoOutlined />,
          label: "Return Policy",
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/contact-us",
          icon: <PhoneOutlined />,
          label: "Contact Us",
        },
        helper.hasAnyPermission(level, [helper.RoleEnum.GUDANG]) && {
          key: "/about-us",
          icon: <ExclamationCircleOutlined />,
          label: "About Us",
        },
      ].filter(Boolean) as MenuProps["items"],
    },
    helper.hasAnyPermission(level, [helper.RoleEnum.ADMINISTRATOR]) && {
      key: "/activity-logs",
      icon: <RadiusSettingOutlined />,
      label: "Activity Log",
    },
    helper.hasAnyPermission(level, [helper.RoleEnum.ADMINISTRATOR]) && {
      key: "/settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
  ].filter(Boolean) as MenuProps["items"];
};

export default MenuAdmin;
