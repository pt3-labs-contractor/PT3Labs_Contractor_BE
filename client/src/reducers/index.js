import { LOADING, SUCCESS, FAILURE } from '../actions';

const initialState = {
  accounts: {
    users: [],
    contractors: []
  },
  loading: false,
  error: null
};

export default (state = initialState, action) => {
  switch(action.type) {
    case LOADING:
      return { ...state, accounts: {users: [], contractors: []}, loading: true, error: null };
    case SUCCESS:
      return { ...state, accounts: action.payload, loading: false, error: null };
    case FAILURE:
      return { ...state, accounts: {users: [], contractors: []}, loading: false, error: action.error };
    default:
      return state;
  }
}