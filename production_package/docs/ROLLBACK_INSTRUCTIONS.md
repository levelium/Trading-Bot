# FvgGold AI Trader — Rollback Instructions

In the event that an unexpected behavior occurs after upgrading to v2.20, follow these step-by-step instructions to safely revert to your prior configuration.

---

## 1. Safety First: Disable Live Trading Before Rollback

1. In the MetaTrader 5 terminal, click the **Algo Trading** button in the main toolbar to turn it **OFF** (red stop sign).
2. Check the **Trade** tab at the bottom of MT5:
   * Review all open positions.
   * If any pending limit orders (`BuyLimit` / `SellLimit`) remain active, right-click and delete them to prevent unintended execution during maintenance.

---

## 2. Reverting the MetaTrader 5 Expert Advisor

1. In MT5, open **File → Open Data Folder**.
2. Navigate to `MQL5\Experts\FvgGold-EA-main\`.
3. If you created a backup copy (e.g. `FvgGold.mq5.bak` or `v2.10`), restore it over `FvgGold.mq5`.
4. Press **F4** to open MetaEditor, open the restored file, and press **F7** to recompile.
5. In MT5, remove the EA from the chart and re-attach it to reload the previous version.

---

## 3. Reverting the Python Service

### On Windows VPS:
1. Open Windows Task Manager (`Ctrl + Shift + Esc`).
2. End any running `python.exe` or `cmd.exe` processes related to the FvgGold service.
3. If using Windows Scheduled Tasks (`install_autostart.ps1`):
   * Open **Task Scheduler**.
   * Locate `FvgGold AI Service` and right-click **Disable** or **Delete**.
4. Restore your previous service folder contents.
5. Verify `.env` contains your original settings.
6. Launch `start_service.bat`.

### On Shared Hosting (cPanel):
1. Log into cPanel → **Setup Python App**.
2. If you need to revert to a previous revision:
   * In File Manager, restore your previous files from your local backup.
   * Return to **Setup Python App** and click **Restart**.
3. If you want to temporarily disable the service:
   * Click **Stop App** in cPanel Setup Python App.
   * The MT5 EA will immediately recognize that the service is unavailable and enter safe **fail-closed** mode.

---

## 4. Verification After Rollback

1. Run the local test script:
   ```powershell
   .\test_local_status.ps1
   ```
2. Verify that the MT5 chart displays expected status text.
3. Test order placement and risk sizing on a **Demo Account** before re-enabling algorithmic trading.
