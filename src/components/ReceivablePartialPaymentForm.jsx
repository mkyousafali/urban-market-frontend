import React, { useState } from 'react';

function ReceivablePartialPaymentForm({ payment, onPay }) {
  const [amount, setAmount] = useState('');
  const max = payment.amount_due - (payment.amount_paid || 0);

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (amount && Number(amount) > 0 && Number(amount) <= max) {
          onPay(Number(amount));
          setAmount('');
        }
      }}
      style={{ display: 'flex', gap: 6, alignItems: 'center' }}
    >
      <input
        type="number"
        min="1"
        max={max}
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Add amount"
        style={{ width: 70, padding: 2 }}
      />
      <button type="submit">Add</button>
    </form>
  );
}

export default ReceivablePartialPaymentForm;
