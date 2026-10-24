# FvgGold AI Trader — DirectAdmin Shared Hosting Deployment Guide

Yes, **FvgGold AI Trader v2.20 can be hosted on DirectAdmin**. 

DirectAdmin hosts Python applications through one of three common web server stacks:
1. **Method 1: DirectAdmin with CloudLinux Python Selector (Passenger)** — Most common on modern shared hosts.
2. **Method 2: DirectAdmin with Nginx Reverse Proxy & Gunicorn** — Supported on DirectAdmin with Nginx / Apache.
3. **Method 3: DirectAdmin with OpenLiteSpeed / LiteSpeed WSGI** — Supported on LiteSpeed-powered servers.

The package's universal WSGI application (`passenger_wsgi.py`, `app.py`, `wsgi.py`) natively supports all three methods.

---

## Method 1: DirectAdmin with CloudLinux "Setup Python App" (Recommended)

If your DirectAdmin host uses CloudLinux (the most common shared hosting OS):

### Step 1: Create the Python App in DirectAdmin
1. Log into your **DirectAdmin** control panel.
2. Under **Extra Features** or **Software**, click **Setup Python App** (or **Python Selector**).
3. Click **Create Application**.
4. Configure the settings:
   * **Python version**: Select **3.10**, **3.11**, or **3.12**.
   * **Application root**: Enter `fvggold-ai` (or your chosen folder).
   * **Application URL**: Select your domain or subdomain (e.g. `api.yourdomain.com`).
   * **Application startup file**: Enter `passenger_wsgi.py`.
   * **Application Entry point**: Leave as `application`.
5. Click **Save** / **Create**.

### Step 2: Upload Files via File Manager
1. In DirectAdmin, go to **System Info & Files** → **File Manager**.
2. Navigate to your application root directory (e.g. `/home/username/fvggold-ai`).
3. Upload the files from `FvgGold-AI-Service/`:
   * `app.py`
   * `passenger_wsgi.py`
   * `config.py`
   * `database.py`
   * `schema.sql`
   * `.htaccess`
   * `.env.example`
   * `requirements.txt`
4. Copy `.env.example` to `.env`.
5. Set permissions on `.env` to `600` (read/write only by owner).

### Step 3: Configure Your Secret Token & Keys
1. In File Manager, edit `.env`:
   ```ini
   AI_SERVICE_TOKEN=your_generated_random_token_at_least_32_chars
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_API_KEYS=your_gemini_api_key_1,your_gemini_api_key_2
   MIN_AI_CONFIDENCE=0.70
   MAX_RISK_PERCENT=0.25
   MAX_SPREAD_POINTS=80
   DB_TYPE=sqlite
   ```
2. Save the file.
3. Return to **Setup Python App** in DirectAdmin and click **Restart**.

---

## Method 2: DirectAdmin with Nginx Reverse Proxy & Gunicorn

If your host does not have the CloudLinux Python selector plugin, you can run the service with Gunicorn behind DirectAdmin's Nginx proxy:

### Step 1: Upload Files & Set Up Virtual Environment
1. In DirectAdmin **File Manager** or SSH, upload the service files to `/home/username/fvggold-ai`.
2. Via SSH or DirectAdmin Terminal:
   ```bash
   cd /home/username/fvggold-ai
   python3 -m venv venv
   source venv/bin/activate
   pip install gunicorn
   ```
3. Test running Gunicorn locally on a private high port (e.g. `127.0.0.1:8787`):
   ```bash
   gunicorn --bind 127.0.0.1:8787 --workers 2 wsgi:application
   ```

### Step 2: Configure DirectAdmin Nginx Reverse Proxy
In DirectAdmin under **Account Manager** → **Nginx Reverse Proxy** (or via custom `nginx.conf` in Custom HTTPD):
```nginx
location / {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "close";
}
```

---

## Method 3: Optional MySQL Database Setup in DirectAdmin

If you prefer MySQL instead of SQLite:
1. In DirectAdmin, go to **Account Manager** → **MySQL Management**.
2. Click **Create Database**.
3. Enter database name (e.g. `username_fvgdb`) and create a user with a strong password.
4. In your `.env` file, set:
   ```ini
   DB_TYPE=mysql
   DB_HOST=127.0.0.1
   DB_USER=username_fvguser
   DB_PASSWORD=your_db_password
   DB_NAME=username_fvgdb
   ```
5. Install the MySQL driver inside your virtual environment: `pip install pymysql`.

---

## Enabling Free Let's Encrypt SSL in DirectAdmin

1. In DirectAdmin, go to **Account Manager** → **SSL Certificates**.
2. Select **Free & automatic certificate from Let's Encrypt**.
3. Check your domain / subdomain (e.g. `api.yourdomain.com`).
4. Click **Save**. DirectAdmin will generate and auto-renew the HTTPS certificate.

---

## Testing & Verifying Your DirectAdmin Deployment

From your Windows VPS or local computer in PowerShell:

```powershell
# 1. Test public health check
Invoke-RestMethod https://api.yourdomain.com/health

# 2. Test authenticated status check
$headers = @{ 'X-Service-Token' = 'YOUR_AI_SERVICE_TOKEN' }
Invoke-RestMethod -Headers $headers https://api.yourdomain.com/status
```

Expected output:
```json
{
  "ok": true,
  "service": "FvgGold AI Trader",
  "version": "2.20",
  "active": true,
  "status": "active",
  "model": "gemini-2.5-flash",
  "configured_keys": 2
}
```

---

## Connecting the MetaTrader 5 EA to DirectAdmin

1. On your Windows VPS, open MetaTrader 5.
2. Go to **Tools → Options → Expert Advisors**.
3. Under **Allow WebRequest for listed URL**, add:
   ```
   https://api.yourdomain.com
   ```
4. Open the `FvgGold` EA properties on your `XAUUSD M15` chart:
   * **AIServiceBaseURL**: `https://api.yourdomain.com`
   * **AIServiceToken**: Exact match from `.env`
5. The chart HUD will immediately report:
   ```
   AI Gate: ACTIVE (CONNECTED)
   Status: active
   ```
