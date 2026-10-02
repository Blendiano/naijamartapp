import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { formatNaira } from "@/lib/utils/money";

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#174A45",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E0D8",
    paddingBottom: 15,
  },
  brand: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#174A45",
  },
  subtitle: {
    fontSize: 9,
    color: "#6F8F88",
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
  },
  orderRef: {
    fontSize: 10,
    color: "#6F8F88",
    marginTop: 3,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
    textTransform: "uppercase",
    color: "#6F8F88",
  },
  text: {
    marginBottom: 3,
  },
  table: {
    marginTop: 10,
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E0D8",
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: "#F8F6F1",
    fontWeight: "bold",
  },
  colName: { width: "50%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "17.5%", textAlign: "right" },
  colTotal: { width: "17.5%", textAlign: "right" },
  totalsContainer: {
    alignSelf: "flex-end",
    width: "40%",
    marginTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: "#174A45",
    paddingTop: 5,
    marginTop: 4,
    fontWeight: "bold",
    fontSize: 12,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 35,
    right: 35,
    textAlign: "center",
    fontSize: 8,
    color: "#6F8F88",
    borderTopWidth: 1,
    borderTopColor: "#E4E0D8",
    paddingTop: 10,
  },
});

export interface InvoiceData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryOption: string;
  subtotal: number; // kobo
  deliveryFee: number; // kobo
  total: number; // kobo
  createdAt: Date;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number; // kobo
    subtotal: number; // kobo
    variantInfo?: { size?: string | null; color?: string | null } | null;
  }[];
}

export function OrderInvoicePdfDocument({ order }: { order: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>NaijaMart</Text>
            <Text style={styles.subtitle}>Modern Nigerian Fashion</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>ORDER INVOICE</Text>
            <Text style={styles.orderRef}>#{order.orderNumber}</Text>
            <Text style={styles.orderRef}>
              Date: {new Date(order.createdAt).toLocaleDateString("en-NG")}
            </Text>
          </View>
        </View>

        {/* Customer & Delivery Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer & Shipping Details</Text>
          <Text style={styles.text}>{order.customerName}</Text>
          <Text style={styles.text}>{order.customerEmail} | {order.customerPhone}</Text>
          <Text style={styles.text}>Address: {order.deliveryAddress}</Text>
          <Text style={styles.text}>Method: {order.deliveryOption}</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colName}>Item Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Subtotal</Text>
          </View>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colName}>
                {item.productName}{" "}
                {item.variantInfo?.size ? `(${item.variantInfo.size})` : ""}
              </Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatNaira(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{formatNaira(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatNaira(order.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Delivery Fee:</Text>
            <Text>{formatNaira(order.deliveryFee)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Total Paid:</Text>
            <Text>{formatNaira(order.total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for shopping with NaijaMart! For support contact help@naijamart.ng</Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generate PDF buffer for transactional attachments or downloads
 */
export async function generateInvoicePdfBuffer(order: InvoiceData): Promise<Buffer> {
  const instance = pdf(<OrderInvoicePdfDocument order={order} />);
  const blob = await instance.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
