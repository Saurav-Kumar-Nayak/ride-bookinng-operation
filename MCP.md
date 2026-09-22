# 🚀 RideX — Model Context Protocol (MCP) Setup

This project is configured with **Model Context Protocol (MCP)** support for streamlined project development, code exploration, and debugging.

---

## 📁 MCP Configuration Details

- **Configuration File Location**: `.mcp.json` (Project Root)
- **Scope**: Restricted strictly to `c:\Users\nayak\Downloads\project\youtube` (Project Root Directory)

---

## 🛠️ Configured MCP Servers

| Server Name | Command / Package | Description & Scope |
| :--- | :--- | :--- |
| `ridex-filesystem` | `npx -y @modelcontextprotocol/server-filesystem` | Provides secure, project-scoped read/write access to RideX source code, backend controllers, models, and frontend components. |

---

## 🔐 Environment Variables & Security Rules

- **Zero Secrets Rule**: No API keys, database connection strings, or private credentials are included in `.mcp.json`.
- All secrets remain in `frontend/.env` or root `.env` files.
- Referenced Environment Variable placeholders:
  - `VITE_GOOGLE_MAPS_API_KEY`: Used by Google Maps Platform JS SDK.
  - `ADMIN_PASSCODE`: Admin Security Access Code.
  - `MONGODB_URI`: Backend Database connection string.

---

## 🚀 How to Enable and Use

1. Ensure Node.js and `npx` are available in your path.
2. The MCP client will automatically launch the `ridex-filesystem` server on startup.
3. To safely disable or remove an MCP server, edit `.mcp.json` or delete `.mcp.json`.
