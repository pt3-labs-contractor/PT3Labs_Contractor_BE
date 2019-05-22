import React, { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import './App.css';

import { fetchAccts } from './actions/index';
import Homepage from './components/homepage/Homepage';
import Users from './components/users/Users';
import ContractorList from './components/contractors/ContractorList';
import Login from './components/login/Login';
import Register from './components/register/Register';
import MainNavbar from './components/navbar/MainNavbar';

function App(props) {
  useEffect(() => {
    props.fetchAccts();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="App">
      <MainNavbar />
      <main className="main-content">
        <Switch>
          <Route exact path="/" component={Homepage} />
          <Route path="/users" component={Users} />
          <Route path="/contractors" component={ContractorList} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
        </Switch>
      </main>
    </div>
  );
}

export default withRouter(
  connect(
    null,
    { fetchAccts }
  )(App)
);
