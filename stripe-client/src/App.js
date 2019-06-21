import React from 'react';

import './App.css';
import logo from './stripe-payment-logo.png';
import StripeButton from './stripeButton';

function App() {
  return (
    <div className="card-container">
      <header>
        <img src={logo} className="logo" alt="logo" />
        <h1>Billing</h1>
        <h4>$10/month - Unlimited scheduling</h4>
        <StripeButton />
      </header>
    </div>
  );
}

export default App;
