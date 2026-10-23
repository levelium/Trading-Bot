# FvgGold AI upgrade notes

## Version 2.10 AI Conservative

- Added local HTTP integration to a Gemini decision service.
- Added mandatory AI approval for new FVG pending orders by default.
- Added status polling and fail-closed handling; pending orders for this EA are cancelled when the service is paused/unreachable if configured.
- Added closed M15/H1 candle context to each AI candidate request.
- Added spread gate and a conservative 0.25% equity-risk default using risk-based sizing.
- Prevented risk sizing from silently forcing broker minimum volume when that would exceed the risk budget.
- Added local service token header; Gemini keys remain outside the EA.
- Existing FVG, order-block, HTF bias, killzone, pending-order entry and position-management architecture retained.

This source was not compiled in MetaEditor in the packaging environment. Compile it in your MT5 MetaEditor and test only on a demo account before any live use.
