import { Sale } from '../types';

export function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatReceiptDate(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

interface ReceiptSettings {
  appName?: string;
  abn?: string;
}

export function printReceipt(
  saleData: Omit<Sale, 'id'> & { id?: string },
  settings: ReceiptSettings = {}
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const bakeryName = (settings.appName || 'The Friendly Bakers').toUpperCase();
  const abn = settings.abn?.trim();
  const isCash = saleData.paymentMethod === 'cash' || (!saleData.paymentMethod && saleData.cashTendered !== undefined);
  const isCard = saleData.paymentMethod === 'card';
  const cashValue = saleData.cashTendered ?? '';
  const totalValue = saleData.total.toFixed(2);

  const paymentHtml = isCash
    ? `
        <div class="payment">
          <div class="pay-row">
            <span class="pay-label">CASH</span>
            <label>: $
              <input id="cash" class="cash-input" type="number" min="0" step="0.01" value="${cashValue}" />
            </label>
          </div>
          <div class="pay-row">
            <span>change :</span>
            <span id="change">${formatMoney(saleData.changeDue ?? 0)}</span>
          </div>
        </div>
        <script>
          const total = ${totalValue};
          const cashInput = document.getElementById('cash');
          const changeEl = document.getElementById('change');
          function updateChange() {
            const cash = parseFloat(cashInput.value);
            const change = (Number.isFinite(cash) ? cash : 0) - total;
            changeEl.textContent = '$' + change.toFixed(2);
          }
          cashInput.addEventListener('input', updateChange);
          cashInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') window.print();
          });
          updateChange();
          cashInput.focus();
          cashInput.select();
        </script>`
    : isCard
    ? `
        <div class="payment">
          <div class="pay-row">
            <span class="pay-label">CARD</span>
            <span>: ${formatMoney(saleData.total)}</span>
          </div>
        </div>`
    : '';

  const html = `
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; color: #000; }
          h1 { text-align: center; font-size: 1.05em; margin: 0 0 4px; letter-spacing: 0.04em; }
          h2 { text-align: center; font-size: 1.15em; margin: 0 0 6px; }
          .abn { text-align: center; font-size: 0.85em; margin-bottom: 4px; }
          .item { display: flex; justify-content: space-between; margin-bottom: 5px; gap: 8px; }
          .total { font-weight: bold; font-size: 1.2em; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; text-align: right; }
          .date { text-align: center; color: #666; font-size: 0.8em; margin-bottom: 20px; }
          .payment { margin-top: 16px; }
          .pay-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 1em; }
          .pay-label { display: inline-block; border: 2px solid #000; padding: 2px 10px; font-weight: bold; letter-spacing: 0.06em; }
          .cash-input { font-family: monospace; font-size: 1em; border: none; border-bottom: 1px solid #000; width: 90px; padding: 2px 0; outline: none; }
          .thanks { text-align: center; margin-top: 24px; font-size: 0.8em; }
          .print-btn { display: block; width: 100%; margin-top: 20px; padding: 8px; font-family: monospace; cursor: pointer; }
          @media print {
            .print-btn { display: none; }
            .cash-input { border: none; }
          }
        </style>
      </head>
      <body>
        <h1>${bakeryName}</h1>
        <h2>BAKERY RECEIPT</h2>
        ${abn ? `<div class="abn">ABN: ${abn}</div>` : ''}
        <div class="date">${formatReceiptDate(saleData.timestamp)}</div>
        <div class="items">
          ${saleData.items.map((item) => `
            <div class="item">
              <span>${item.quantity}x ${item.name}</span>
              <span>${formatMoney(item.subtotal)}</span>
            </div>
          `).join('')}
        </div>
        <div class="total">
          TOTAL: ${formatMoney(saleData.total)}
        </div>
        ${paymentHtml}
        <div class="thanks">Thank you for your visit!</div>
        <button class="print-btn" onclick="window.print()">Print</button>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}
