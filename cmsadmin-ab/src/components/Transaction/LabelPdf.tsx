import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 14, fontSize: 10 },
  title: { fontSize: 12, fontWeight: 700 },
  box: { border: "1px solid #000", padding: 10, marginTop: 8 },
  h: { fontSize: 10, fontWeight: 700, marginBottom: 4 },
  line: { marginTop: 2 },
  mono: { fontFamily: "Courier" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 8 },
});

export default function LabelPdf({
  tx,
  barcodeSrc,
  qrSrc,
}: {
  tx: any;
  barcodeSrc: string;
  qrSrc?: string; // ✅ OPTIONAL
}) {
  const sh = tx?.shipments?.[0];
  const user = tx?.ecommerce?.user || tx?.user;
  const addr = tx?.ecommerce?.userAddress;

  const resi = sh?.resiNumber || sh?.resi_number || "-";
  const courier = `${(sh?.service || "-").toUpperCase()} ${(sh?.serviceType || "").toUpperCase()}`.trim();

  const receiverName = sh?.pic || user?.fullName || user?.name || "-";
  const receiverPhone = sh?.pic_phone || user?.phone || "-";

  const receiverAddress = [
    addr?.address,
    addr?.subDistrictData?.name,
    addr?.districtData?.name,
    addr?.cityData?.name,
    addr?.provinceData?.name,
  ]
    .filter(Boolean)
    .join(", ");

  const items =
    (tx?.details || []).map((d: any) => `${d.product?.name || "Item"} x${d.qty}`).join("\n") || "-";

  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <Text style={styles.title}>Shipping Label - Abby n Bev</Text>

        <View style={styles.box}>
          <Text style={styles.h}>RESI / WAYBILL</Text>
          <Text style={[styles.mono, { fontSize: 12 }]}>{resi}</Text>
          <Text style={styles.line}>Courier: {courier}</Text>
          <Text style={styles.line}>No. Transaksi: {tx?.transactionNumber || "-"}</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Image src={barcodeSrc} style={{ width: "100%", height: 46 }} />
            </View>

            {/* ✅ QR optional */}
            {qrSrc ? (
              <View style={{ width: 70 }}>
                <Image src={qrSrc} style={{ width: 70, height: 70 }} />
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.box}>
          <Text style={styles.h}>PENERIMA</Text>
          <Text style={styles.line}>{receiverName}</Text>
          <Text style={styles.line}>{receiverPhone}</Text>
          <Text style={styles.line}>{receiverAddress || "-"}</Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.h}>ISI PAKET</Text>
          <Text>{items}</Text>
        </View>
      </Page>
    </Document>
  );
}
