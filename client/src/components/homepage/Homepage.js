import React from 'react';
import axios from 'axios';

class Homepage extends React.Component {
  state = {
    user: null,
  };
  componentDidMount(){
    axios.get('http://localhost:5000/users')
      .then(res => console.log(res))
      .catch(err => console.log(err.response.data));
  }
  render(){
    return (
      <div>    
        <section>
          <h1>Easy, Stress-Free Scheduling</h1>
          <p>Find and schedule the perfect contractor that fits your time as easy as one click.</p>     
        </section>
      </div>
    );
  }
}

export default Homepage;