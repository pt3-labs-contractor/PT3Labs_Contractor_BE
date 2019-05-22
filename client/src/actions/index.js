import axios from 'axios';

export const LOADING = 'LOADING';
export const SUCCESS = 'SUCCESS';
export const FAILURE = 'FAILURE';
export const FETCH_USER_SUCCESS = 'FETCH_USER_SUCCESS';
export const FETCH_USER_FAILURE = 'FETCH_USER_FAILURE';

export const getUser = () => dispatch => {
  dispatch({ type: LOADING });
  axios
    .get('http://localhost:5000/api/users')
    .then(res =>
      dispatch({ type: FETCH_USER_SUCCESS, payload: res.data.users[0] })
    )
    .catch(err => dispatch({ type: FETCH_USER_FAILURE, payload: err }));
};

export const fetchAccts = () => dispatch => {
  dispatch({ type: LOADING });

  axios
    .all([
      axios.get('https://fierce-plains-47590.herokuapp.com/users'),
      axios.get('https://fierce-plains-47590.herokuapp.com/contractors'),
    ])
    .then(
      axios.spread((userRes, contRes) => {
        const accounts = {
          users: userRes.data.users,
          contractors: contRes.data.contractors,
        };
        dispatch({ type: SUCCESS, payload: accounts });
      })
    )
    .catch(() => {
      dispatch({ type: FAILURE, error: 'Something went wrong.' });
    });
};
