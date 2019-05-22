import axios from 'axios';

export const LOADING = 'LOADING';
export const SUCCESS = 'SUCCESS';
export const FAILURE = 'FAILURE';

export const fetchAccts = () => dispatch => {
  dispatch({ type: LOADING });

  axios.all([
    axios.get('https://fierce-plains-47590.herokuapp.com/users'),
    axios.get('https://fierce-plains-47590.herokuapp.com/contractors')
  ])
    .then(axios.spread((userRes, contRes) => {
      const accounts = {
        users: userRes.data.users,
        contractors: contRes.data.contractors
      };
      dispatch({ type: SUCCESS, payload: accounts });
    }))
    .catch(() => {
      dispatch({ type: FAILURE, error: "Something went wrong."});
    });
}