import React, { Fragment } from 'react';
import StripeCheckout from 'react-stripe-checkout';
import axios from 'axios';

// Creating a variable to hold our publishableKey(get from Stripe's Dashboard)
const stripeButton = () => {
  const publishableKey = 'pk_test_MBywZi4e3Z02C6sfqPK3iFZu00G8TOajyK'; // this doesnt need to be placed in .env file

  // Basically it sends the card info to Stripe and return a token as object.
  // Func. sends token and the amount to our back end in the body with axios request in this case to finish the transaction
  const onToken = token => {
    const body = {
      amount: 999,
      token: token,
    };
    axios
      .post('http://localhost:8000/payment', body)
      .then(response => {
        console.log(response);
        alert('Payment Success');
      })
      .catch(error => {
        console.log('Payment Error: ', error);
        alert('Payment Error');
      });
  };
  return (
    <StripeCheckout
      label="Click to pay" //Component button text
      name="Contractor" //Modal Header
      description="Thank you for doing business with us"
      panelLabel="Total charge: " //Submit button in modal
      amount={1000} //Amount in cents $10.00
      token={onToken}
      stripeKey={publishableKey}
      image="https://www.magedelight.com/media/catalog/product/p/a/payment-logo_1.png" //Pop-in header image
      billingAddress={false}
    />
  );
};
export default stripeButton;
