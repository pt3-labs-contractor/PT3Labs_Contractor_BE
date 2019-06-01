import React from 'react';

import './App.css';
import logo from './stripe-payment-logo.png';
import StripeButton from './stripeButton';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h2>Stripe Checkout</h2>
        <StripeButton />
      </header>
    </div>
  );
}

export default App;
