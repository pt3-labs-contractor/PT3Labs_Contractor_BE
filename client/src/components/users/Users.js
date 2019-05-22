import React from 'react';
import { connect } from 'react-redux';

function Users(props) {
  return (
    <div>
      <h3>Users:</h3>
      {props.loading ? <p>Loading...</p> : null}
      {props.error ? <p>{props.error}</p> : null}
      {props.users.map(user => (
        <p key={user.id}>{user.username}</p>
      ))}
    </div>
  )
};

const mapStateToProps = state => {
  return {
    users: state.accounts.users,
    loading: state.loading,
    error: state.error
  }
}

export default connect(mapStateToProps)(Users)
