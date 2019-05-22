import {
  LOADING,
  SUCCESS,
  FAILURE,
  FETCH_USER_SUCCESS,
  FETCH_USER_FAILURE,
} from '../actions';

const initialState = {
  loggedIn: false,
  accounts: {
    users: [],
    contractors: [],
  },
  loading: false,
  error: null,
  user: null,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case LOADING:
      return {
        ...state,
        accounts: { users: [], contractors: [] },
        loading: true,
        error: null,
      };
    case SUCCESS:
      return {
        ...state,
        accounts: action.payload,
        loading: false,
        error: null,
      };
    case FAILURE:
      return {
        ...state,
        accounts: { users: [], contractors: [] },
        loading: false,
        error: action.error,
      };
    case FETCH_USER_SUCCESS:
      return {
        ...state,
        loggedIn: true,
        loading: false,
        user: action.payload,
      };
    case FETCH_USER_FAILURE:
      return {
        ...state,
        loggedIn: false,
        loading: false,
        user: null,
      };
    default:
      return state;
  }
};
