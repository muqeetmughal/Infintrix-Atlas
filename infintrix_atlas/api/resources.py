import frappe
import os


@frappe.whitelist()
def preview_document(file_url):
    """Extract text from various file types for preview."""
    if not file_url:
        frappe.throw("File URL is required")

    ext = file_url.rsplit(".", 1)[-1].lower() if "." in file_url else ""

    try:
        file_doc = frappe.get_doc("File", {"file_url": file_url})
        file_path = file_doc.get_full_path()
    except frappe.DoesNotExistError:
        site_path = frappe.get_site_path("public", file_url.lstrip("/"))
        if not os.path.exists(site_path):
            frappe.throw(f"File not found: {file_url}")
        file_path = site_path

    file_title = file_doc.file_name if file_doc else file_url.rsplit("/", 1)[-1]

    try:
        if ext == "docx":
            from docx import Document
            doc = Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs]
            tables = []
            for table in doc.tables:
                for row in table.rows:
                    cells = [cell.text for cell in row.cells]
                    tables.append(" | ".join(cells))
            content = "\n\n".join(paragraphs)
            if tables:
                content += "\n\n--- Tables ---\n" + "\n".join(tables)
            return {"type": "document", "format": "docx", "content": content, "title": file_title}

        elif ext == "odt":
            import zipfile
            from xml.etree import ElementTree
            with zipfile.ZipFile(file_path) as z:
                xml_content = z.read("content.xml")
            root = ElementTree.fromstring(xml_content)
            paragraphs = []
            for p in root.iter("{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p"):
                text = "".join(p.itertext())
                if text.strip():
                    paragraphs.append(text)
            content = "\n\n".join(paragraphs) if paragraphs else "(empty document)"
            return {"type": "document", "format": "odt", "content": content, "title": file_title}

        elif ext == "rtf":
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                raw = f.read()
            import re
            text = re.sub(r"\\([a-z]+)(-?\d+)?", "", raw)
            text = re.sub(r"[{}]", "", text)
            text = re.sub(r"\\'[0-9a-f]{2}", "", text)
            text = re.sub(r"\n\s*\n", "\n", text)
            text = text.strip()
            return {"type": "document", "format": "rtf", "content": text, "title": file_title}

        elif ext in ("xlsx", "xls"):
            import openpyxl
            wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
            sheets = []
            for sheet_name in wb.sheetnames:
                ws = wb[sheet_name]
                rows_data = []
                for row in ws.iter_rows(values_only=True):
                    cleaned = [str(c) if c is not None else "" for c in row]
                    if any(c.strip() for c in cleaned):
                        rows_data.append(cleaned)
                sheets.append({
                    "name": sheet_name,
                    "rows": rows_data,
                    "total_rows": len(rows_data),
                })
            wb.close()
            # Build plain text preview (first sheet)
            content_parts = []
            for s in sheets[:3]:
                content_parts.append(f"## Sheet: {s['name']} ({s['total_rows']} rows)")
                for row in s["rows"][:50]:
                    content_parts.append(" | ".join(row))
                if s["total_rows"] > 50:
                    content_parts.append(f"... ({s['total_rows'] - 50} more rows)")
            content = "\n".join(content_parts)
            return {
                "type": "spreadsheet",
                "format": ext,
                "content": content,
                "title": file_title,
                "sheets": sheets[:10],
                "total_sheets": len(sheets),
            }

        elif ext in ("pptx", "ppt"):
            from pptx import Presentation
            prs = Presentation(file_path)
            slides_content = []
            for i, slide in enumerate(prs.slides, 1):
                slide_text = []
                for shape in slide.shapes:
                    if shape.has_text_frame:
                        for paragraph in shape.text_frame.paragraphs:
                            text = paragraph.text.strip()
                            if text:
                                slide_text.append(text)
                    if shape.has_table:
                        table = shape.table
                        for row in table.rows:
                            cells = [cell.text.strip() for cell in row.cells]
                            slide_text.append(" | ".join(cells))
                if slide_text:
                    slides_content.append(f"--- Slide {i} ---\n" + "\n".join(slide_text))
            content = "\n\n".join(slides_content) if slides_content else "(empty presentation)"
            return {
                "type": "presentation",
                "format": ext,
                "content": content,
                "title": file_title,
                "total_slides": len(prs.slides),
            }

        elif ext == "csv":
            import csv as csv_module
            import io
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                reader = csv_module.reader(f)
                rows = list(reader)
            headers = rows[0] if rows else []
            data = rows[1:] if len(rows) > 1 else []
            lines = []
            if headers:
                lines.append(" | ".join(headers))
                lines.append("-" * len(" | ".join(headers)))
            for row in data:
                lines.append(" | ".join(row))
            content = "\n".join(lines)
            return {
                "type": "csv",
                "content": content,
                "title": file_title,
                "headers": headers,
                "rows": data,
                "total": len(data),
            }

        elif ext in ("md", "mdx"):
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            return {"type": "markdown", "format": ext, "content": content, "title": file_title}

        elif ext == "txt":
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            return {"type": "text", "content": content, "title": file_title}

        else:
            return {"type": "unsupported", "content": "Preview not available for this file type"}

    except Exception as e:
        frappe.log_error(f"Preview failed for {ext}: {e}", "Preview Error")
        return {"type": "error", "content": f"Could not preview this file: {str(e)}"}
