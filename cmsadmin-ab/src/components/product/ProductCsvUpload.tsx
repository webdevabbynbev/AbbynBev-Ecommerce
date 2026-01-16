"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Upload,
  Table,
  Alert,
  Progress,
  message,
  Typography,
  Tag,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import { importProductCSV } from "../../services/api/product.services";
import {
  type CsvRow,
  isMasterHeaders,
  normalizeHeaders,
  validateHeaders,
  validateRowsMaster,
  validateRowsTemplate,
} from "../../utils/productCsvValidator";

const { Dragger } = Upload;
const { Text } = Typography;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type BackendError = { row?: number; message?: string; name?: string } | any;

export default function ProductCsvUpload({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [backendErrors, setBackendErrors] = useState<BackendError[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [csvMode, setCsvMode] = useState<"template" | "master" | null>(null);

  useEffect(() => {
    if (!open) resetState();
  }, [open]);

  function resetState() {
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setRowErrors([]);
    setHeaderError(null);
    setBackendErrors([]);
    setProgress(0);
    setLoading(false);
    setCsvMode(null);
  }

  const handleFile = (f: File) => {
    setFile(f);
    setBackendErrors([]);
    setProgress(0);

    Papa.parse<CsvRow>(f, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) =>
        String(h || "")
          .replace(/^\uFEFF/, "")
          .trim(),
      complete: (result) => {
        const fields = result.meta.fields || [];
        const headerErr = validateHeaders(fields);

        const cleanedHeaders = normalizeHeaders(fields);
        setHeaders(cleanedHeaders);

        if (headerErr) {
          setHeaderError(headerErr);
          setPreview([]);
          setRowErrors([]);
          setCsvMode(null);
          return;
        }

        const mode: "master" | "template" = isMasterHeaders(fields)
          ? "master"
          : "template";
        setCsvMode(mode);
        setHeaderError(null);

        const cleanedData = (result.data || []).map((row) => {
          const out: CsvRow = {};
          cleanedHeaders.forEach((h) => {
            out[h] = String((row as any)?.[h] ?? "").trim();
          });
          return out;
        });

        setPreview(cleanedData);

        const errs =
          mode === "master"
            ? validateRowsMaster(cleanedData)
            : validateRowsTemplate(cleanedData);
        setRowErrors(errs);
      },
      error: (err) => {
        console.error("CSV PARSE ERROR:", err);
        message.error("Gagal membaca file CSV");
      },
    });
    return false; // Prevent auto upload
  };

  async function handleUpload() {
    if (!file || headerError || rowErrors.length > 0) {
      message.error("Masih ada error pada data CSV");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);
      setBackendErrors([]);

      const result = await importProductCSV(file, setProgress);

      const errs = result?.errors;
      if (Array.isArray(errs) && errs.length) {
        setBackendErrors(errs);
        message.warning("Import selesai, namun ada data yang gagal.");
        return;
      }

      message.success("Upload CSV berhasil");
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("CSV UPLOAD ERROR:", err);
      const msg =
        err?.response?.data?.message || err?.message || "Upload CSV gagal";
      setBackendErrors(err?.errors || err?.response?.data?.errors || []);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const canUpload =
    !!file && !loading && !headerError && rowErrors.length === 0;

  const columns = headers.map((h) => ({
    title: h,
    dataIndex: h,
    key: h,
    ellipsis: true,
    width: 150,
  }));

  return (
    <Modal
      title="Upload Product CSV"
      open={open}
      onCancel={() => !loading && onOpenChange(false)}
      onOk={handleUpload}
      confirmLoading={loading}
      okText={loading ? "Uploading..." : "Upload"}
      okButtonProps={{ disabled: !canUpload }}
      width={1000}
      maskClosable={!loading}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Bisa upload 2 format:
          <br />
          <b>Template</b>: <code>name</code>, <code>category_type_id</code>{" "}
          (base_price optional)
          <br />
          <b>Master</b>: <code>Nama Produk</code>, <code>SKU Master</code>,{" "}
          <code>SKU Varian 1</code>
        </Text>
        {csvMode && (
          <div style={{ marginTop: 8 }}>
            Detected mode: <Tag color="blue">{csvMode.toUpperCase()}</Tag>
          </div>
        )}
      </div>

      <Dragger
        accept=".csv"
        beforeUpload={handleFile}
        showUploadList={false}
        disabled={loading}
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Klik atau drag file CSV ke area ini</p>
        {file && (
          <p className="ant-upload-hint" style={{ color: "#1890ff" }}>
            File terpilih: {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        )}
      </Dragger>

      {loading && (
        <Progress
          percent={progress}
          status="active"
          style={{ marginBottom: 16 }}
        />
      )}

      {headerError && (
        <Alert
          message="Header Error"
          description={
            <pre style={{ whiteSpace: "pre-wrap" }}>{headerError}</pre>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {rowErrors.length > 0 && (
        <Alert
          message={`Terdapat ${rowErrors.length} error pada baris data`}
          description={
            <ul
              style={{
                maxHeight: 100,
                overflowY: "auto",
                paddingLeft: 20,
                margin: 0,
              }}
            >
              {rowErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {backendErrors.length > 0 && (
        <Alert
          message="Error dari Server"
          description={
            <ul
              style={{
                maxHeight: 100,
                overflowY: "auto",
                paddingLeft: 20,
                margin: 0,
              }}
            >
              {backendErrors.map((e: any, i) => (
                <li key={i}>
                  {e?.row ? `Baris ${e.row}: ` : ""}
                  {e?.message || JSON.stringify(e)}
                </li>
              ))}
            </ul>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {preview.length > 0 && (
        <Table
          dataSource={preview}
          columns={columns}
          scroll={{ x: "max-content", y: 300 }}
          pagination={{ pageSize: 5 }}
          size="small"
          rowKey={(r, i) => i as number}
        />
      )}
    </Modal>
  );
}
