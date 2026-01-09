import { StyleSheet } from "@react-pdf/renderer";

export const stylesPaySlip = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
    color: "#000",
    padding: 10,
  },
  section: {
    padding: 10,
  },
  viewer: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
  image: {
    width: "100%",
    height: 50,
    objectFit: "contain",
  },
  titleHeader: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 5,
  },
  subTitleHeader: {
    fontSize: 9,
    fontWeight: "normal",
    textAlign: "center",
    marginBottom: 5,
  },
  tableEmployee: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    padding: 10,
  },
  tableRowEmployee: {
    flexDirection: "row",
    marginBottom: 5,
  },
  tableColEmployee: {
    width: "15%",
  },
  tableColEmployeeDivider: {
    width: "3%",
  },
  tableColEmployeeValue: {
    width: "87%",
  },
  tableCellEmployee: {
    fontSize: 10,
  },
  tableSallary: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRowSallary: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColSallary: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCellSallary: {
    margin: "5px auto",
    fontSize: 10,
  },
  tableSetting: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRowSetting: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColSetting: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCellSetting: {
    margin: "5px auto",
    fontSize: 10,
  },
});
