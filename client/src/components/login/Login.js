import React, { useState } from 'react'
import axios from 'axios';

function Login(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    axios.post()
      .then(res => {
        props.history.push('/contractors');
      })
      .catch(err => {
        console.log(err)
      })
  } 
  // state = {
  //   username: ''
  // }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          type='text'
          name='username'
          placeholder='Username'
          onChange={(e) => setUsername(e.target.value)}
          value={username}
        >
        </input>
        <input
          type='text'
          name='password'
          placeholder='Password'
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        >
        </input>
        <button type='submit'>Submit</button>
      </form>
    </>
  )
}

export default Login;
